# Talking Rabbit

Talking Rabbit is a sales analytics dashboard with a React/Vite frontend and a FastAPI backend. The backend loads Superstore analytics data from PostgreSQL and includes Gemini-powered question answering.

## Prerequisites

- Node.js 20 or later
- Python 3.10 or later
- PostgreSQL
- A Gemini API key for the AI features

## Configure the backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `DATABASE_URL` and `GEMINI_API_KEY`. Set `READONLY_DATABASE_URL` to a read-only PostgreSQL account when using the AI query feature.
3. Create and activate a virtual environment, then install dependencies:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

4. Import the supplied source data into PostgreSQL (optional if the `superstore` table already exists):

   ```powershell
   python import_data.py
   ```

5. Start the API:

   ```powershell
   uvicorn main:app --reload
   ```

## Configure the frontend

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

The Vite development server runs on the URL shown in the terminal and connects to the API at `http://127.0.0.1:8000`.

## Security

Do not commit `backend/.env` or any credentials. The repository includes `backend/.env.example` as the safe configuration template.
