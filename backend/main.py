import re
from fastapi import FastAPI
import pandas as pd
from sqlalchemy import create_engine
from fastapi.middleware.cors import CORSMiddleware
import os
import pickle
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required. Copy .env.example to .env and configure it.")

# A dedicated read-only account is recommended for AI-generated queries. When it
# is not configured, use the primary connection so local development still works.
READONLY_DATABASE_URL = os.environ.get("READONLY_DATABASE_URL", DATABASE_URL)


app = FastAPI(title="Talking Rabbitt API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------
# Database Engines & SQL Agent
# -----------------------------------

engine = create_engine(DATABASE_URL)
readonly_engine = create_engine(READONLY_DATABASE_URL)

from sql_agent import (
    generate_sql,
    validate_sql,
    run_readonly_query,
    generate_answer,
    generate_conversational_response,
    generate_business_story,
    transcribe_audio_with_gemini,
    generate_section_insights,
    format_chart_data
)
from action_center import analyze_business_action_center


def load_data():
    global df
    df = pd.read_sql("SELECT * FROM superstore", engine)
    df["Order Date"] = pd.to_datetime(df["Order Date"])
    df["Ship Date"] = pd.to_datetime(df["Ship Date"])
    print(f"Data loaded: {len(df)} rows")

load_data()

@app.post("/api/refresh-data")
def refresh_data():
    load_data()
    return {"message": "Data refreshed", "rows": len(df)}

##########################################################################

# -----------------------------------
# Load prediction models
# -----------------------------------

def get_file_path(filename: str) -> str:
    path = os.path.join(BASE_DIR, filename)
    if os.path.exists(path):
        return path
    parent_path = os.path.join(os.path.dirname(BASE_DIR), filename)
    if os.path.exists(parent_path):
        return parent_path
    return filename

with open(get_file_path("sales_model.pkl"), "rb") as f:
    sales_model = pickle.load(f)

with open(get_file_path("profit_model.pkl"), "rb") as f:
    profit_model = pickle.load(f)

with open(get_file_path("forecast_state.pkl"), "rb") as f:
    forecast_state = pickle.load(f)

SALES_FEATURE_COLS = ["t", "month"]
PROFIT_FEATURE_COLS = ["t", "month", "profit_lag_1", "profit_lag_2", "profit_lag_3", "profit_rolling_3"]

customer_segments = pd.read_csv(get_file_path("customer_segments.csv"))

anomalies_df = pd.read_csv(get_file_path("flagged_anomalies.csv"))
anomalies_df["Order Date"] = pd.to_datetime(anomalies_df["Order Date"])

high_sales_loss_df = pd.read_csv(get_file_path("high_sales_loss_anomalies.csv"))






##########################################################################

# -----------------------------------
# Home
# -----------------------------------

@app.get("/")
def home():
    return {
        "message": "Talking Rabbitt API is running!"
    }


# -----------------------------------
# Common Filter Function
# -----------------------------------

def apply_filters(
    data,
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):

    filtered_df = data.copy()

    if year is not None:
        filtered_df = filtered_df[
            filtered_df["Year"] == year
        ]

    if region is not None:
        filtered_df = filtered_df[
            filtered_df["Region"] == region
        ]

    if category is not None:
        filtered_df = filtered_df[
            filtered_df["Category"] == category
        ]

    if segment is not None:
        filtered_df = filtered_df[
            filtered_df["Segment"] == segment
        ]

    return filtered_df


# -----------------------------------
# KPIs
# -----------------------------------
@app.get("/api/customer-segments")
def get_customer_segments():
    summary = (
        customer_segments.groupby("Segment")
        .agg(
            Customers=("Customer ID", "count"),
            AvgMonetary=("Monetary", "mean"),
            AvgProfit=("Profit", "mean"),
            AvgRecency=("Recency", "mean"),
            AvgFrequency=("Frequency", "mean")
        )
        .round(2)
        .reset_index()
        .to_dict(orient="records")
    )
    return {"segments": summary}



@app.get("/api/kpis")
def get_kpis(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):

    filtered_df = apply_filters(
        df,
        year,
        region,
        category,
        segment
    )

    total_sales = filtered_df["Sales"].sum()
    total_profit = filtered_df["Profit"].sum()
    total_quantity = filtered_df["Quantity"].sum()
    total_orders = filtered_df["Order ID"].nunique()
    total_customers = filtered_df["Customer ID"].nunique()

    profit_margin = (
        (total_profit / total_sales) * 100
        if total_sales != 0
        else 0
    )

    return {
        "total_sales": round(float(total_sales), 2),
        "total_profit": round(float(total_profit), 2),
        "total_quantity": int(total_quantity),
        "total_orders": int(total_orders),
        "total_customers": int(total_customers),
        "profit_margin": round(float(profit_margin), 2)
    }


# -----------------------------------
# Category Performance
# -----------------------------------

@app.get("/api/categories")
def get_categories(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):

    filtered_df = apply_filters(
        df,
        year,
        region,
        category,
        segment
    )

    result = (
        filtered_df.groupby("Category")
        .agg(
            Sales=("Sales", "sum"),
            Profit=("Profit", "sum"),
            Quantity=("Quantity", "sum")
        )
        .reset_index()
    )

    result["Profit Margin"] = (
        result["Profit"] / result["Sales"] * 100
    )

    return result.round(2).to_dict(orient="records")


# -----------------------------------
# Business Action Center Alerts
# -----------------------------------

@app.get("/api/action-center")
def get_action_center(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):
    filtered_df = apply_filters(df, year, region, category, segment)
    return analyze_business_action_center(filtered_df)


# -----------------------------------
# Region Performance
# -----------------------------------

@app.get("/api/regions")
def get_regions(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):

    filtered_df = apply_filters(
        df,
        year,
        region,
        category,
        segment
    )

    result = (
        filtered_df.groupby("Region")
        .agg(
            Sales=("Sales", "sum"),
            Profit=("Profit", "sum"),
            Quantity=("Quantity", "sum")
        )
        .reset_index()
    )

    result["Profit Margin"] = (
        result["Profit"] / result["Sales"] * 100
    )

    return result.round(2).to_dict(orient="records")


# -----------------------------------
# Monthly Sales
# -----------------------------------

@app.get("/api/monthly-sales")
def get_monthly_sales(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):

    filtered_df = apply_filters(
        df,
        year,
        region,
        category,
        segment
    )

    result = (
        filtered_df.groupby(["Year", "Month"])
        .agg(
            Sales=("Sales", "sum"),
            Profit=("Profit", "sum")
        )
        .reset_index()
    )

    result["Year-Month"] = (
        result["Year"].astype(str)
        + "-"
        + result["Month"].astype(str).str.zfill(2)
    )

    return result.round(2).to_dict(orient="records")


# -----------------------------------
# Top Products
# -----------------------------------

@app.get("/api/top-products")
def get_top_products(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):

    filtered_df = apply_filters(
        df,
        year,
        region,
        category,
        segment
    )

    result = (
        filtered_df.groupby("Product Name")
        .agg(
            Sales=("Sales", "sum"),
            Profit=("Profit", "sum"),
            Quantity=("Quantity", "sum")
        )
        .reset_index()
        .sort_values("Sales", ascending=False)
        .head(10)
    )

    return result.round(2).to_dict(orient="records")


# -----------------------------------
# Filtered KPI Data
# -----------------------------------

@app.get("/api/filtered-data")
def get_filtered_data(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):

    filtered_df = apply_filters(
        df,
        year,
        region,
        category,
        segment
    )

    total_sales = filtered_df["Sales"].sum()
    total_profit = filtered_df["Profit"].sum()
    total_quantity = filtered_df["Quantity"].sum()
    total_orders = filtered_df["Order ID"].nunique()
    total_customers = filtered_df["Customer ID"].nunique()

    profit_margin = (
        (total_profit / total_sales) * 100
        if total_sales != 0
        else 0
    )

    return {
        "total_sales": round(float(total_sales), 2),
        "total_profit": round(float(total_profit), 2),
        "total_quantity": int(total_quantity),
        "total_orders": int(total_orders),
        "total_customers": int(total_customers),
        "profit_margin": round(float(profit_margin), 2)
    }




# -----------------------------------
# AI Business Insights
# -----------------------------------

@app.get("/api/insights")
def get_insights(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):

    filtered_df = apply_filters(
        df,
        year,
        region,
        category,
        segment
    )
    if filtered_df.empty:
        return {
            "message": "No data found for this selected filters."
        }
    # 1. Best category by sales
    category_sales = (
        filtered_df.groupby("Category")["Sales"]
        .sum()
        .sort_values(ascending=False)
    )

    best_category = category_sales.index[0]
    best_category_sales = category_sales.iloc[0]

    # 2. Best region by profit
    region_profit = (
        filtered_df.groupby("Region")["Profit"]
        .sum()
        .sort_values(ascending=False)
    )

    best_region = region_profit.index[0]
    best_region_profit = region_profit.iloc[0]

    # 3. Best month by sales
    monthly_sales = (
        filtered_df.groupby(["Year", "Month"])["Sales"]
        .sum()
        .sort_values(ascending=False)
    )

    best_month = monthly_sales.index[0]
    best_month_sales = monthly_sales.iloc[0]

    # 4. Loss-making products
    product_profit = (
        filtered_df.groupby("Product Name")["Profit"]
        .sum()
        .sort_values()
    )

    loss_products = product_profit[product_profit < 0]

    # 5. High-sales but loss-making products
    product_summary = (
        filtered_df.groupby("Product Name")
        .agg(
            Sales=("Sales", "sum"),
            Profit=("Profit", "sum")
        )
        .reset_index()
    )

    high_sales_loss_products = product_summary[
        (product_summary["Sales"] > product_summary["Sales"].median()) &
        (product_summary["Profit"] < 0)
    ].sort_values("Sales", ascending=False)

    return {
        "best_category": {
            "name": best_category,
            "sales": round(float(best_category_sales), 2)
        },

        "best_region": {
            "name": best_region,
            "profit": round(float(best_region_profit), 2)
        },

        "best_month": {
            "year": int(best_month[0]),
            "month": int(best_month[1]),
            "sales": round(float(best_month_sales), 2)
        },

        "loss_making_products_count": int(len(loss_products)),

        "loss_making_products": [
            {
                "product": product,
                "profit": round(float(profit), 2)
            }
            for product, profit in loss_products.head(5).items()
        ],

        "high_sales_loss_products": [
            {
                "product": row["Product Name"],
                "sales": round(float(row["Sales"]), 2),
                "profit": round(float(row["Profit"]), 2)
            }
            for _, row in high_sales_loss_products.head(5).iterrows()
        ]
    }


# -----------------------------------
# Anomaly Detection
# -----------------------------------

@app.get("/api/anomalies")
def get_anomalies(limit: int = 20):
    result = (
        anomalies_df
        .sort_values("Anomaly_Score")
        .head(limit)
    )
    return {"anomalies": result.round(2).to_dict(orient="records")}


@app.get("/api/anomalies/high-sales-loss")
def get_high_sales_loss_anomalies():
    return {
        "count": int(len(high_sales_loss_df)),
        "anomalies": high_sales_loss_df.round(2).to_dict(orient="records")
    }


# -----------------------------------
# Human-Readable Business Story Summary
# -----------------------------------

@app.get("/api/business-story")
def get_business_story(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):
    filtered_df = apply_filters(df, year, region, category, segment)
    
    if filtered_df.empty:
        return {
            "headline": "No Data Found For Selected Filters",
            "previously": "No prior records match the chosen filter combinations.",
            "now": "Currently, there are zero recorded transactions matching these criteria.",
            "future": "Try selecting 'All Years' or 'All Regions' to see the complete business story."
        }

    # 1. Historical Growth Trajectory (Year by Year)
    yearly = df.groupby("Year")["Sales"].sum().to_dict()
    yearly_str = ", ".join([f"{int(y)}: ${s:,.0f}" for y, s in sorted(yearly.items())])
    
    # 2. Filter scope description
    scope_parts = []
    if year: scope_parts.append(f"Year {year}")
    if region: scope_parts.append(f"{region} Region")
    if category: scope_parts.append(f"{category} Category")
    if segment: scope_parts.append(f"{segment} Segment")
    filter_scope = " / ".join(scope_parts) if scope_parts else "Overall Business"

    # 3. Current Performance
    total_sales = float(filtered_df["Sales"].sum())
    total_profit = float(filtered_df["Profit"].sum())
    total_orders = int(filtered_df["Order ID"].nunique())
    margin = (total_profit / total_sales * 100) if total_sales > 0 else 0

    # 4. Top Performers
    top_cat = filtered_df.groupby("Category")["Sales"].sum().sort_values(ascending=False).index[0]
    top_reg = filtered_df.groupby("Region")["Profit"].sum().sort_values(ascending=False).index[0]
    top_prod = filtered_df.groupby("Product Name")["Sales"].sum().sort_values(ascending=False).index[0]

    # 5. Challenges / Leaks
    prod_profit = filtered_df.groupby("Product Name")["Profit"].sum()
    loss_count = int((prod_profit < 0).sum())
    
    # 6. High-loss / discounted items
    loss_items = prod_profit.sort_values().head(3).to_dict()
    loss_str = ", ".join([f"{p} (Loss: ${abs(v):,.0f})" for p, v in loss_items.items() if v < 0])

    # 7. Next 3 months forecast
    forecast_sales = forecast_series(
        sales_model, SALES_FEATURE_COLS,
        forecast_state["last_sales"], forecast_state["next_t"], forecast_state["last_date"],
        3, "sales"
    )
    forecast_summary = ", ".join([f"{f['date']}: ${f['predicted_sales']:,.0f}" for f in forecast_sales])

    context_data = {
        "filter_scope": filter_scope,
        "historical_growth": f"Yearly sales trajectory: {yearly_str}",
        "current_sales": f"${total_sales:,.2f}",
        "current_profit": f"${total_profit:,.2f}",
        "current_margin": f"{margin:.1f}%",
        "total_orders": total_orders,
        "top_category": top_cat,
        "top_region": top_reg,
        "top_product": top_prod,
        "loss_count": loss_count,
        "challenges": f"{loss_count} products are loss-making. Biggest drains: {loss_str or 'None'}",
        "forecast_next_3_months": f"Projected monthly sales: {forecast_summary}"
    }

    story = generate_business_story(context_data)
    return story











from pydantic import BaseModel
import re


class QuestionRequest(BaseModel):
    question: str








@app.post("/api/ask-ai")
def ask_question_ai(request: QuestionRequest):
    question = request.question.strip()
    if not question:
        return {"answer": "Please ask a question!", "sql": None, "chart": None}

    try:
        sql = generate_sql(question)
        if sql is None:
            # Provide a warm conversational reply or guide the user
            conv_answer = generate_conversational_response(question)
            return {"answer": conv_answer, "sql": None, "chart": None}

        safe_sql = validate_sql(sql)
        rows = run_readonly_query(safe_sql, readonly_engine)
        answer = generate_answer(question, safe_sql, rows)
        chart = format_chart_data(rows, question)

        return {"answer": answer, "sql": safe_sql, "chart": chart}

    except ValueError as e:
        # Guardrail rejected the generated SQL
        return {"answer": f"I couldn't safely run that query. ({e})", "sql": None, "chart": None}

    except Exception as e:
        print(f"ask-ai error: {e}")
        try:
            res = ask_question(request)  # fall back to the rule-based endpoint
            return {"answer": res.get("answer", ""), "sql": None, "chart": None}
        except Exception:
            return {"answer": "I couldn't process that question. Please try asking about sales, profit, regions, or products!", "sql": None, "chart": None}




















@app.post("/api/ask")
def ask_question(request: QuestionRequest):

    question = request.question.lower().strip()

    # ==========================================
    # 1. DETECT FILTERS
    # ==========================================

    year_match = re.search(r"\b(2014|2015|2016|2017)\b", question)
    year = int(year_match.group()) if year_match else None

    region = None
    for r in ["west", "east", "central", "south"]:
        if r in question:

            region = r.title()
            break

    category = None
    for c in ["furniture", "office supplies", "technology"]:
        if c in question:
            category = c.title()
            break

    segment = None
    for s in ["consumer", "corporate", "home office"]:
        if s in question:
            segment = s.title()
            break

    # ==========================================
    # 2. APPLY FILTERS
    # ==========================================

    filtered_df = apply_filters(
        df,
        year=year,
        region=region,
        category=category,
        segment=segment
    )

    if filtered_df.empty:
        return {
            "answer": "No data found for this filter."
        }

    # ==========================================
    # 3. BEST CATEGORY BY SALES
    # ==========================================

    if (
        "best category" in question or "highest sales category" in question or ("category" in question and "highest sales" in question)
    ):

        category_sales = (
            filtered_df
            .groupby("Category")["Sales"]
            .sum()
            .sort_values(ascending=False)
        )

        best_category = category_sales.index[0]
        sales = category_sales.iloc[0]

        return {
            "answer": (
                f"{best_category} is the best category"
                + (f" in {year}" if year else "")
                + f" with sales of ${sales:,.2f}."
            )
        }

    # ==========================================
    # 4. BEST REGION BY PROFIT
    # ==========================================

    if (
        "best region" in question
        or "highest profit region" in question
        or (
            "region" in question
            and "highest profit" in question
        )
    ):

        region_profit = (
            filtered_df
            .groupby("Region")["Profit"]
            .sum()
            .sort_values(ascending=False)
        )

        best_region = region_profit.index[0]
        profit = region_profit.iloc[0]

        return {
            "answer": (
                f"{best_region} is the best region"
                + (f" in {year}" if year else "")
                + f" with profit of ${profit:,.2f}."
            )
        }

    # ==========================================
    # 5. LOSS-MAKING PRODUCTS
    # ==========================================

    if (
        ("product" in question or "products" in question)
        and (
            "loss" in question
            or "losses" in question
            or "negative profit" in question
            or "losing" in question
        )
    ):

        product_profit = (
            filtered_df
            .groupby("Product Name")["Profit"]
            .sum()
            .sort_values()
        )

        loss_products = product_profit[
            product_profit < 0
        ]

        if loss_products.empty:
            return {
                "answer": (
                    "There are no loss-making products "
                    "for the selected filters."
                )
            }

        products = loss_products.head(5)

        product_text = ", ".join(
            [
                f"{product} (${profit:,.2f})"
                for product, profit in products.items()
            ]
        )

        return {
            "answer": (
                f"There are {len(loss_products)} loss-making products"
                + (f" in {year}" if year else "")
                + f". The biggest losses are: {product_text}."
            )
        }


# -----------------------------------
# Best Product by Sales
# -----------------------------------

    if (
    "best product" in question
    or "top product" in question
    or "highest sales product" in question
    or (
        "product" in question
        and "highest sales" in question
    )
):

        product_sales = (
        filtered_df.groupby("Product Name")["Sales"]
        .sum()
        .sort_values(ascending=False)
    )

        if product_sales.empty:
            return {
            "answer": "No product data found for the selected filters."
        }

        best_product = product_sales.index[0]
        sales = product_sales.iloc[0]

        return {
        "answer": (
            f"{best_product} is the top-selling product"
            + (f" in {year}" if year else "")
            + f" with sales of ${sales:,.2f}."
        )
    }




    # ==========================================
    # 6. TOTAL SALES
    # ==========================================

    if (
        "total sales" in question
        or "sales" in question
    ):

        total_sales = filtered_df["Sales"].sum()

        filter_text = ""

        if year:
            filter_text += f" in {year}"

        if region:
            filter_text += f" for {region} region"

        if category:
            filter_text += f" for {category} category"

        if segment:
            filter_text += f" for {segment} segment"

        return {
            "answer": (
                f"Total sales{filter_text} are "
                f"${total_sales:,.2f}."
            )
        }

    # ==========================================
    # 7. TOTAL PROFIT
    # ==========================================

    if (
        "total profit" in question
        or "profit" in question
    ):

        total_profit = filtered_df["Profit"].sum()

        filter_text = ""

        if year:
            filter_text += f" in {year}"

        if region:
            filter_text += f" for {region} region"

        if category:
            filter_text += f" for {category} category"

        if segment:
            filter_text += f" for {segment} segment"

        return {
            "answer": (
                f"Total profit{filter_text} is "
                f"${total_profit:,.2f}."
            )
        }

    # ==========================================
    # 8. UNKNOWN QUESTION
    # ==========================================

    return {
        "answer": "Sorry, I don't understand that question yet."
    }





##############################################################################################################3



# -----------------------------------
# Sales & Profit Forecasting
# -----------------------------------

def forecast_series(model, feature_cols, last_values, next_t, last_date, periods, target_name):
    """
    Recursively predicts `periods` months ahead.
    last_values: last 3 actual monthly totals, oldest -> newest.
    """
    history = list(last_values)
    current_date = last_date
    predictions = []

    for i in range(periods):
        current_date = current_date + pd.DateOffset(months=1)
        t = next_t + i
        month = current_date.month

        lag_1, lag_2, lag_3 = history[-1], history[-2], history[-3]
        rolling_3 = sum(history[-3:]) / 3

        feature_values = {
            "t": t,
            "month": month,
            f"{target_name}_lag_1": lag_1,
            f"{target_name}_lag_2": lag_2,
            f"{target_name}_lag_3": lag_3,
            f"{target_name}_rolling_3": rolling_3
        }

        X = pd.DataFrame([feature_values])[feature_cols]  # enforce training column order
        pred = float(model.predict(X)[0])

        predictions.append({
            "date": current_date.strftime("%Y-%m"),
            f"predicted_{target_name}": round(pred, 2)
        })

        history.append(pred)
        history.pop(0)

    return predictions


@app.get("/api/predict-sales")
def predict_sales(periods: int = 3):
    predictions = forecast_series(
        sales_model, SALES_FEATURE_COLS,
        forecast_state["last_sales"], forecast_state["next_t"], forecast_state["last_date"],
        periods, "sales"
    )
    return {"predictions": predictions}


@app.get("/api/predict-profit")
def predict_profit(periods: int = 3):
    predictions = forecast_series(
        profit_model, PROFIT_FEATURE_COLS,
        forecast_state["last_profit"], forecast_state["next_t"], forecast_state["last_date"],
        periods, "profit"
    )
    return {"predictions": predictions}


from pydantic import BaseModel

class AudioTranscribeRequest(BaseModel):
    audio_base64: str
    mime_type: str = "audio/webm"


@app.post("/api/transcribe-audio")
def transcribe_audio_endpoint(payload: AudioTranscribeRequest):
    import base64
    try:
        raw_b64 = payload.audio_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        audio_bytes = base64.b64decode(raw_b64)
        mime_type = payload.mime_type or "audio/webm"
        text = transcribe_audio_with_gemini(audio_bytes, mime_type=mime_type)
        return {"text": text, "success": True}
    except Exception as e:
        print("Transcription endpoint error:", e)
        return {"text": "", "success": False, "error": str(e)}




@app.get("/api/dashboard-narrative")
def dashboard_narrative(
    year: int | None = None,
    region: str | None = None,
    category: str | None = None,
    segment: str | None = None
):
    filtered_df = apply_filters(df, year, region, category, segment)
    if filtered_df.empty:
        return {}

    category_sales = filtered_df.groupby("Category")["Sales"].sum().sort_values(ascending=False)
    region_profit = filtered_df.groupby("Region")["Profit"].sum().sort_values(ascending=False)
    monthly = filtered_df.groupby(["Year", "Month"])[["Sales", "Profit"]].sum().reset_index().tail(6)
    top_products = filtered_df.groupby("Product Name")["Sales"].sum().sort_values(ascending=False).head(5)
    loss_count = int((filtered_df.groupby("Product Name")["Profit"].sum() < 0).sum())

    sales_fc = forecast_series(sales_model, SALES_FEATURE_COLS, forecast_state["last_sales"], forecast_state["next_t"], forecast_state["last_date"], 3, "sales")
    profit_fc = forecast_series(profit_model, PROFIT_FEATURE_COLS, forecast_state["last_profit"], forecast_state["next_t"], forecast_state["last_date"], 3, "profit")

    seg_summary = (
        customer_segments.groupby("Segment")
        .agg(Customers=("Customer ID", "count"), AvgMonetary=("Monetary", "mean"), AvgProfit=("Profit", "mean"))
        .round(2).reset_index().to_dict(orient="records")
    )

    context = {
        "category_sales": category_sales.round(2).to_dict(),
        "region_profit": region_profit.round(2).to_dict(),
        "monthly_trend_last_6": monthly.round(2).to_dict(orient="records"),
        "top_5_products_by_sales": top_products.round(2).to_dict(),
        "loss_making_product_count": loss_count,
        "sales_forecast_next_3mo": sales_fc,
        "profit_forecast_next_3mo": profit_fc,
        "customer_segments": seg_summary,
        "high_sales_loss_transaction_count": int(len(high_sales_loss_df)),
    }

    return generate_section_insights(context)
