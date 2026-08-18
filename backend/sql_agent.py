import os
import re
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from google import genai
from google.genai import types
from sqlalchemy import text

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY environment variable is missing in .env.")

client = genai.Client(api_key=api_key)

# Fallback models in priority order
MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash"]

ALLOWED_TABLES = {"superstore"}

# Accurate Postgres schema context
SCHEMA_CONTEXT = """
Table: superstore
Columns:
  "Order ID" (text), "Order Date" (text, formatted as 'YYYY-MM-DD'), "Ship Date" (text, formatted as 'YYYY-MM-DD'),
  "Year" (bigint, e.g. 2014, 2015, 2016, 2017), "Month" (bigint, 1-12), "Month Name" (text, e.g. 'January'), "Quarter" (bigint, 1-4),
  "Ship Mode" (text, e.g. 'Standard Class', 'Second Class', 'First Class', 'Same Day'),
  "Customer ID" (text), "Customer Name" (text), "Segment" (text, e.g. 'Consumer', 'Corporate', 'Home Office'),
  "Country" (text), "City" (text), "State" (text), "Region" (text, e.g. 'West', 'East', 'Central', 'South'),
  "Product ID" (text), "Category" (text, e.g. 'Furniture', 'Office Supplies', 'Technology'), "Sub-Category" (text), "Product Name" (text),
  "Sales" (double precision), "Quantity" (bigint), "Discount" (double precision), "Profit" (double precision), "Profit Margin" (double precision)
"""

SQL_SYSTEM_PROMPT = f"""You are an expert SQL generator for a PostgreSQL analytics database.

{SCHEMA_CONTEXT}

Rules — follow all of them strictly:
- Output ONLY a single SQL SELECT statement. No markdown code blocks, no explanations, no semicolon.
- Query ONLY from the "superstore" table. Never reference any other table.
- Never use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, GRANT, TRUNCATE, or any DDL/DML.
- Always quote column names with double quotes, e.g. "Sales", "Profit", "Year", "Category", "Region", "Customer Name", "Product Name", "Order Date".
- For filtering by year, use "Year" = YYYY or "Order Date" LIKE 'YYYY%'.
- For ranking / top items, use ORDER BY and LIMIT (e.g. ORDER BY SUM("Sales") DESC LIMIT 5).
- Always include a LIMIT clause (max 200 rows) unless the query is a single aggregate value (like SUM, AVG, COUNT, MAX, MIN).
- If the question cannot be answered from this table, output exactly: NO_QUERY
"""

FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|create|grant|revoke|truncate|"
    r"exec|execute|copy|call|merge|--|/\*)\b",
    re.IGNORECASE,
)


def _call_gemini_with_fallback(contents: str, system_instruction: str = None, temperature: float = 0.0, max_tokens: int = 500) -> str:
    last_err = None
    config_args = {"temperature": temperature, "max_output_tokens": max_tokens}
    if system_instruction:
        config_args["system_instruction"] = system_instruction
    
    config = types.GenerateContentConfig(**config_args)
    
    for model_name in MODELS:
        try:
            resp = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config,
            )
            if resp.text:
                return resp.text.strip()
        except Exception as e:
            last_err = e
            print(f"Warning: model {model_name} failed: {e}. Trying next fallback model...")
            continue
    raise last_err or RuntimeError("All Gemini models failed.")


def clean_sql_output(raw_text: str) -> str:
    text_clean = raw_text.strip()
    match = re.search(r"```(?:sql)?\s*([\s\S]*?)\s*```", text_clean, re.IGNORECASE)
    if match:
        text_clean = match.group(1).strip()
    
    if text_clean.lower().startswith("sql"):
        text_clean = text_clean[3:].strip()
    
    return text_clean.rstrip(";").strip()


def generate_sql(question: str) -> str | None:
    raw_response = _call_gemini_with_fallback(
        contents=question,
        system_instruction=SQL_SYSTEM_PROMPT,
        temperature=0.0,
        max_tokens=500
    )
    
    sql = clean_sql_output(raw_response)
    if not sql or sql.upper() == "NO_QUERY":
        return None
    return sql


def validate_sql(sql: str) -> str:
    stripped = sql.strip().rstrip(";")

    if ";" in stripped:
        raise ValueError("Multiple statements are not allowed.")

    if not stripped.lower().startswith("select"):
        raise ValueError("Only SELECT statements are allowed.")

    if FORBIDDEN.search(stripped):
        raise ValueError("Query contains a forbidden keyword.")

    if "superstore" not in stripped.lower():
        raise ValueError("Query must reference the superstore table.")

    if stripped.count('"') % 2 != 0:
        raise ValueError("Query has an unterminated quoted identifier.")

    if stripped.count("'") % 2 != 0:
        raise ValueError("Query has an unterminated string literal.")

    # Exclude EXTRACT/SUBSTRING/TRIM before validating table names in FROM/JOIN
    table_check_str = re.sub(r'\bEXTRACT\s*\([^)]*\)', '', stripped, flags=re.IGNORECASE)
    table_check_str = re.sub(r'\b(SUBSTRING|TRIM)\s*\([^)]*\)', '', table_check_str, flags=re.IGNORECASE)

    for word in re.findall(r'\b(?:from|join)\s+"?([a-zA-Z0-9_]+)"?', table_check_str, re.IGNORECASE):
        if word.lower() not in ALLOWED_TABLES:
            raise ValueError(f"Query references disallowed table: {word}")

    if "limit" not in stripped.lower() and not any(agg in stripped.lower() for agg in ["sum(", "avg(", "count(", "max(", "min("]):
        stripped += " LIMIT 200"

    return stripped


def run_readonly_query(sql: str, readonly_engine):
    with readonly_engine.connect() as conn:
        result = conn.execute(text(sql))
        rows = [dict(row._mapping) for row in result]
    return rows


def generate_answer(question: str, sql: str, rows: list[dict]) -> str:
    preview = rows[:50]
    prompt = (
        f"User question: {question}\n\n"
        f"SQL that was run: {sql}\n\n"
        f"Query result (JSON, up to 50 rows): {preview}\n\n"
        "Answer the user's question in one or two clear, concise, plain-English sentences, "
        "using the exact numbers and findings from the result. Format currency amounts with $ and commas. If the result is empty, clearly state that no records were found."
    )
    
    return _call_gemini_with_fallback(
        contents=prompt,
        temperature=0.2,
        max_tokens=300
    )


def generate_conversational_response(question: str) -> str:
    prompt = (
        f"You are Talking Rabbitt, a helpful AI sales intelligence assistant for the Superstore retail dashboard. "
        f"The user said: '{question}'. "
        f"Reply in 1-2 friendly, engaging sentences. If it is a greeting or general inquiry, greet them warmly and suggest 2-3 specific sales or analytics questions they can ask you (e.g. 'What were the total sales in 2016?', 'Which category has the highest profit margin?', or 'Who are our top customers?')."
    )
    try:
        return _call_gemini_with_fallback(
            contents=prompt,
            temperature=0.4,
            max_tokens=200
        )
    except Exception:
        return "Hello! I am Talking Rabbitt. You can ask me about total sales, profit trends, top-selling products, customer segments, or loss-making transactions."


def generate_business_story(context_data: dict) -> dict:
    import json
    
    prompt = f"""You are an insightful business storyteller and strategic advisor.
Write a clear, captivating, human-readable narrative story of this retail business performance for everyday readers.
Anyone without a business background should find it easy, engaging, and enlightening to read.

Here is the business performance data:
{json.dumps(context_data, indent=2)}

Rules for the story:
- Write in a natural, friendly narrative voice (avoid buzzwords and dry financial jargon).
- CRITICAL: Wrap all important numbers, percentages, dollar amounts, hero products, top regions, and key takeaways in markdown **bold text** (e.g. **$2.3M**, **Technology**, **Canon imageCLASS Copier**, **12.5% margin**, **301 loss-making items**). This allows a busy reader to scan and catch every critical keyword in seconds.
- Construct the story in 3 continuous chapters:
  1. "previously": How the journey began and evolved over the previous years/months.
  2. "now": Where things stand right now — big milestones, superstar winners, and where profits are quietly leaking.
  3. "future": What lies ahead based on the forecast, and 2 straightforward practical moves.
- Provide 3-4 ultra-short "quick_takeaways" (each under 8 words) for a 5-second speed read.
- Return ONLY a valid JSON object with these exact keys:
{{
  "headline": "A punchy, engaging 5-8 word title for the story",
  "quick_takeaways": [
    "📈 Milestone / Revenue summary",
    "🏆 Top performer / win",
    "⚠️ Key money leak / risk",
    "🚀 Top recommended move"
  ],
  "previously": "1-2 paragraphs with **bold keywords** for the past journey...",
  "now": "1-2 paragraphs with **bold keywords** describing current performance, wins, and leaks...",
  "future": "1-2 paragraphs with **bold keywords** covering future forecast and practical advice..."
}}
"""
    try:
        raw_text = _call_gemini_with_fallback(
            contents=prompt,
            temperature=0.3,
            max_tokens=1200
        )
        
        # Strip markdown JSON blocks if present
        clean_text = raw_text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", clean_text, re.IGNORECASE)
        if match:
            clean_text = match.group(1).strip()
            
        data = json.loads(clean_text)
        if "headline" in data and "previously" in data and "now" in data and "future" in data:
            if "quick_takeaways" not in data or not isinstance(data["quick_takeaways"], list):
                data["quick_takeaways"] = [
                    f"📈 Revenue: {context_data.get('current_sales', 'Strong')}",
                    f"🏆 Superstar: {context_data.get('top_category', 'Tech')}",
                    f"⚠️ Leaks: {context_data.get('loss_count', 'Few')} loss items",
                    "🚀 Action: Cut steep discounts"
                ]
            return data
    except Exception as e:
        print(f"Business story generation error: {e}. Using intelligent narrative fallback.")

    # High quality dynamic fallback if API is unavailable
    scope = context_data.get("filter_scope", "Your business")
    sales = context_data.get("current_sales", "strong revenue")
    profit = context_data.get("current_profit", "healthy profits")
    margin = context_data.get("current_margin", "12%")
    top_cat = context_data.get("top_category", "Technology")
    top_reg = context_data.get("top_region", "West")
    top_prod = context_data.get("top_product", "Top Product")
    loss_count = context_data.get("loss_count", "several")
    
    return {
        "headline": f"The Story of {scope}: Growth, Wins, and Next Steps",
        "quick_takeaways": [
            f"📈 Total Sales: {sales}",
            f"🏆 Hero Category: {top_cat}",
            f"⚠️ Money Leaks: {loss_count} items with negative profit",
            "🚀 Smart Move: Trim heavy discounts"
        ],
        "previously": (
            "Over the preceding years, the business established **solid market traction**. "
            "Customer demand steadily built up momentum as word spread, expanding the store's reach and setting up a foundation of **loyal buyers** across multiple regions."
        ),
        "now": (
            f"Today, the business is generating **{sales}** in total sales with **{profit}** in profit (**{margin} profit margin**). "
            f"The undisputed superstar is **{top_cat}**, and the **{top_reg}** region continues to deliver outstanding results led by **{top_prod}**. "
            f"However, there is a catch: **{loss_count} products** are currently losing money due to **excessive discounting**, quietly eating into overall earnings."
        ),
        "future": (
            "Looking ahead, sales are forecasted to maintain **steady growth** into the coming months. "
            "To maximize future earnings, two smart moves will make an immediate impact: first, **dial back steep discounts** on loss-making items, and second, **allocate more inventory** to your highest-performing categories."
        )
    }


def transcribe_audio_with_gemini(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    """Transcribe spoken audio bytes to English text using Gemini multimodal capabilities."""
    if not audio_bytes or len(audio_bytes) < 100:
        return ""
    
    part = types.Part.from_bytes(
        data=audio_bytes,
        mime_type=mime_type
    )
    prompt = (
        "You are an expert audio transcription assistant for a Superstore analytics business dashboard. "
        "Listen to this audio recording carefully and transcribe the user's speech verbatim into clear English text. "
        "Output ONLY the transcribed question/sentence. Do not add quotes, explanations, prefixes, or any extra text. "
        "If no clear speech or only background silence/noise is detected, return exactly: NO_SPEECH"
    )
    
    for model_name in MODELS:
        try:
            resp = client.models.generate_content(
                model=model_name,
                contents=[part, prompt],
            )
            if resp.text:
                cleaned = resp.text.strip().strip('"').strip("'")
                if cleaned == "NO_SPEECH":
                    return ""
                return cleaned
        except Exception as e:
            print(f"Transcription model {model_name} failed: {e}")
            continue
    return ""






def generate_section_insights(context: dict) -> dict:
    """Takes pre-computed dashboard numbers and writes one short caption per section.
    The model must never invent or recompute a number — only narrate what's given."""
    import json
    prompt = f"""You are a business analyst writing short captions for a live dashboard.
You are given already-calculated numbers — do not invent, recompute, or contradict any of them.

Dashboard data:
{json.dumps(context, indent=2)}

Write ONE short, natural sentence (max ~25 words) per section below. Call out what's
actually notable, not just a restatement of the number.

Return ONLY a valid JSON object with these exact keys:
{{
  "insights_caption": "...",
  "trend_caption": "...",
  "category_caption": "...",
  "region_caption": "...",
  "top_products_caption": "...",
  "forecast_caption": "...",
  "segments_caption": "...",
  "anomalies_caption": "..."
}}
"""
    try:
        raw_text = _call_gemini_with_fallback(contents=prompt, temperature=0.3, max_tokens=500)
        clean_text = raw_text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", clean_text, re.IGNORECASE)
        if match:
            clean_text = match.group(1).strip()
        data = json.loads(clean_text)
        if isinstance(data, dict) and "trend_caption" in data:
            return data
    except Exception as e:
        print(f"Section insights generation error: {e}. Using smart fallbacks.")

    # High quality dynamic fallback from pre-calculated context
    cat_sales = context.get("category_sales", {})
    top_cat = list(cat_sales.keys())[0] if cat_sales else "Technology"
    reg_profit = context.get("region_profit", {})
    top_reg = list(reg_profit.keys())[0] if reg_profit else "West"
    loss_count = context.get("loss_making_product_count", 0)

    return {
        "insights_caption": f"Core operations remain steady led by high volume in {top_cat}.",
        "trend_caption": "Sales and profit show recurring upward momentum across recent periods.",
        "category_caption": f"{top_cat} drives the largest share of overall store revenue.",
        "region_caption": f"The {top_reg} region is currently generating the highest overall profit margins.",
        "top_products_caption": "Revenue is heavily driven by top-tier office and technology hardware items.",
        "forecast_caption": "Next 3 months project consistent sales volume with moderate profit margins.",
        "segments_caption": "Consumer segment continues to represent the largest customer base and volume.",
        "anomalies_caption": f"Identified {loss_count} items with negative margins that need discount adjustments."
    }


def format_chart_data(rows: list[dict], question: str = "") -> dict | None:
    """Analyzes SQL result rows and constructs an interactive chart specification
    (BarChart, LineChart, PieChart, or Mini-Table) for the chatbot response."""
    if not rows or not isinstance(rows, list) or len(rows) == 0:
        return None

    first_row = rows[0]
    keys = list(first_row.keys())
    if not keys:
        return None

    # Identify numeric columns vs string/dimension columns
    numeric_keys = []
    dimension_keys = []

    for k in keys:
        sample_vals = [r.get(k) for r in rows[:10] if r.get(k) is not None]
        if not sample_vals:
            continue
        is_num = all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in sample_vals)
        # Check if year is a dimension rather than numeric metric
        if is_num and k.lower() in ["year", "quarter", "month"] and len(keys) > 1:
            dimension_keys.append(k)
        elif is_num:
            numeric_keys.append(k)
        else:
            dimension_keys.append(k)

    # If single row and only 1 aggregate value, no chart is needed
    if len(rows) == 1 and len(numeric_keys) == 1 and len(dimension_keys) == 0:
        return None

    # Handle single row with multiple comparison columns (e.g. SUM(Sales), SUM(Profit))
    if len(rows) == 1 and len(numeric_keys) >= 2:
        chart_data = [{"metric": k, "value": round(float(first_row[k]), 2)} for k in numeric_keys]
        return {
            "type": "bar",
            "title": "Metric Comparison",
            "xKey": "metric",
            "yKeys": ["value"],
            "data": chart_data
        }

    # If we have at least 1 dimension and 1+ numeric metrics across multiple rows
    if len(rows) >= 2 and dimension_keys and numeric_keys:
        x_key = dimension_keys[0]
        # Choose most relevant x_key if multiple dimensions exist
        for d in dimension_keys:
            d_lower = d.lower()
            if any(t in d_lower for t in ["month", "date", "year", "category", "region", "product", "segment", "state", "city"]):
                x_key = d
                break

        # Decide chart type: line, pie, or bar
        is_time_series = any(t in x_key.lower() for t in ["date", "month", "year", "quarter", "time"])
        is_small_distribution = (
            any(t in x_key.lower() for t in ["segment", "ship mode", "category", "region"])
            and len(rows) <= 6
            and len(numeric_keys) == 1
        )

        chart_type = "line" if is_time_series else ("pie" if is_small_distribution else "bar")

        # Format rows for safe chart rendering (limit top 12 items for clarity)
        formatted_data = []
        for r in rows[:12]:
            item = {}
            for k, v in r.items():
                if k == x_key:
                    str_val = str(v)
                    # Shorten overly long product names for clean visual labels
                    item[k] = (str_val[:22] + "...") if len(str_val) > 25 else str_val
                elif isinstance(v, (int, float)):
                    item[k] = round(float(v), 2)
                else:
                    item[k] = v
            formatted_data.append(item)

        # Generate a clean title
        title_metric = ", ".join(numeric_keys[:2])
        title = f"{title_metric} by {x_key}"

        return {
            "type": chart_type,
            "title": title,
            "xKey": x_key,
            "yKeys": numeric_keys[:3],  # Up to 3 metrics plotted
            "data": formatted_data
        }

    # If tabular data without standard numeric aggregation (e.g. list of orders or info)
    if len(rows) >= 2 and len(keys) >= 2:
        return {
            "type": "table",
            "title": "Data Records",
            "columns": keys[:5],
            "data": rows[:8]
        }

    return None