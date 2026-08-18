import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(os.path.dirname(BASE_DIR), ".env"))

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required. Copy .env.example to .env and configure it.")

engine = create_engine(DATABASE_URL)

df = pd.read_csv(os.path.join(BASE_DIR, "Superstore_cleaned.csv"))

df.to_sql(
    "superstore",
    engine,
    if_exists="replace",
    index=False
)

print("Data imported successfully!")
print("Rows:", len(df))
