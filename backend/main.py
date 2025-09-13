# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# This is the crucial security setting.
# We are telling your back-end that it is safe to accept
# requests from your front-end website.
origins = [
    "https://appcom-tau.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """
    Root endpoint for the API. Confirms the server is running.
    """
    return {"message": "Welcome to the StudyAI API!"}