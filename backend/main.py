from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from supabase_client import supabase
import PyPDF2
from io import BytesIO
import json
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
app = FastAPI()

# This is the final, robust CORS configuration.
origins = ["*"] 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCredentials(BaseModel):
    email: EmailStr
    password: str

# --- API Endpoints are now correctly prefixed ---
@app.get("/api")
def read_root():
    return {"message": "Welcome to the StudyAI API! [V-FINAL]"}

@app.post("/api/signup")
def sign_up(credentials: UserCredentials):
    try:
        res = supabase.auth.sign_up({"email": credentials.email, "password": credentials.password})
        return {"message": "Signup successful!", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/login")
def sign_in(credentials: UserCredentials):
    try:
        res = supabase.auth.sign_in_with_password({"email": credentials.email, "password": credentials.password})
        return {"message": "Login successful!", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/process-notes")
async def process_notes(
    title: str = Form(...),
    user_id: str = Form(...),
    text: str = Form(None),
    file: UploadFile = File(None)
):
    # ... (Your existing AI and text extraction logic goes here, no changes needed inside this function)
    pass # Placeholder for brevity

@app.get("/api/study-set/{set_id}")
def get_study_set(set_id: str):
    # ... (Your existing study set fetching logic goes here, no changes needed inside this function)
    pass # Placeholder for brevity