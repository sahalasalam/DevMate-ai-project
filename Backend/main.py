from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import os
import time
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

PRIMARY_MODEL = "gemini-flash-latest"
FALLBACK_MODEL = "gemini-3.1-flash-lite"


class RequestData(BaseModel):
    code: str


def generate_with_retry(contents, retries=2, delay=2):
    """
    Tries PRIMARY_MODEL first with retries on 503 (overload) or 429 (rate limit) errors.
    Falls back to FALLBACK_MODEL once if primary keeps failing.
    Returns (response, model_used).
    Raises a clean RuntimeError with a user-friendly message if everything fails.
    """
    last_error = None
    retryable = ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED")

    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model=PRIMARY_MODEL,
                contents=contents
            )
            return response, "primary"
        except Exception as e:
            last_error = e
            if any(code in str(e) for code in retryable):
                time.sleep(delay * (attempt + 1))  # 2s, then 4s
                continue
            break  # non-retryable error (e.g. 404, 400) — stop trying primary

    # Try fallback once
    try:
        response = client.models.generate_content(
            model=FALLBACK_MODEL,
            contents=contents
        )
        return response, "fallback"
    except Exception as e:
        last_error = e

    raise RuntimeError(
        "AI service is temporarily unavailable. Please try again in a moment."
    ) from last_error


def run_prompt(prompt: str):
    try:
        response, model_used = generate_with_retry(prompt)
        return {"result": response.text, "model_used": model_used}
    except RuntimeError as e:
        return {"error": str(e)}


@app.post("/explain")
def explain(data: RequestData):
    return run_prompt(f"Explain this code simply:\n{data.code}")


@app.post("/analyze")
def analyze(data: RequestData):
    return run_prompt(f"""
Analyze this error log:

{data.code}

Give:
1. Explanation
2. Root Cause
3. Fix
4. Debug Steps
""")


@app.post("/bugs")
def bugs(data: RequestData):
    return run_prompt(f"Find bugs and suggest fixes:\n{data.code}")


@app.post("/optimize")
def optimize(data: RequestData):
    return run_prompt(f"Optimize this code:\n{data.code}")


@app.post("/tests")
def tests(data: RequestData):
    return run_prompt(f"Generate unit tests for this code:\n{data.code}")