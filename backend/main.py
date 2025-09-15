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

# This is the final, robust CORS configuration. It trusts your live site.
origins = [
    "https://appcom-tau.vercel.app",
    "*" 
] 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI Helper Function (Your working code) ---
def generate_study_items_from_ai(text: str):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in environment.")
    client = Groq(api_key=api_key)
    word_count = len(text.split())
    num_items = max(3, min(15, word_count // 150))
    system_prompt = "You are a helpful study assistant. Your task is to generate question and answer pairs from the provided text. You must respond with only a valid JSON object."
    user_prompt = f"Please generate {num_items} question and answer pairs from the following text. Format your response as a JSON object with a single key 'study_items' which contains a list of objects, where each object has a 'question' key and an 'answer' key. Text: {text[:3000]}"
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
            model="llama-3.1-8b-instant", temperature=0.3, max_tokens=2048, response_format={"type": "json_object"}
        )
        response_content = chat_completion.choices[0].message.content
        parsed_json = json.loads(response_content)
        study_items = parsed_json.get("study_items")
        if not isinstance(study_items, list):
            raise HTTPException(status_code=500, detail="AI did not return a valid list.")
        return study_items
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Groq API request failed: {str(e)}")


# --- Data Models ---
class UserCredentials(BaseModel):
    email: EmailStr
    password: str

# --- API Endpoints (All at the top level, NO /api prefix) ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the StudyAI API! [FINAL]"}

@app.post("/signup")
def sign_up(credentials: UserCredentials):
    try:
        res = supabase.auth.sign_up({"email": credentials.email, "password": credentials.password})
        return {"message": "Signup successful!", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
def sign_in(credentials: UserCredentials):
    try:
        res = supabase.auth.sign_in_with_password({"email": credentials.email, "password": credentials.password})
        return {"message": "Login successful!", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process-notes")
async def process_notes(
    title: str = Form(...), user_id: str = Form(...), text: str = Form(None), file: UploadFile = File(None)
):
    extracted_text = ""
    if file and file.size > 0:
        if file.content_type == 'application/pdf':
            try:
                pdf_content = await file.read()
                pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))
                extracted_text = "".join(page.extract_text() for page in pdf_reader.pages if page.extract_text())
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")
        else:
            text_content = await file.read()
            extracted_text = text_content.decode('utf-8')
    elif text:
        extracted_text = text
    else:
        raise HTTPException(status_code=400, detail="No content provided.")

    if len(extracted_text.strip()) < 50:
         raise HTTPException(status_code=400, detail="The provided text is too short.")

    generated_items = generate_study_items_from_ai(extracted_text)
    if not isinstance(generated_items, list) or not all("question" in item and "answer" in item for item in generated_items):
        raise HTTPException(status_code=500, detail="AI returned data in an unexpected format.")

    try:
        set_insert_res = supabase.table("study_sets").insert({"user_id": user_id, "title": title, "original_content": extracted_text}).execute()
        new_set_id = set_insert_res.data[0]['id']
        items_to_insert = [{"set_id": new_set_id, "user_id": user_id, "question": item['question'], "answer": item['answer']} for item in generated_items]
        supabase.table("study_items").insert(items_to_insert).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {"message": "Study set generated and saved successfully!", "study_set_id": new_set_id}

@app.get("/study-set/{set_id}")
def get_study_set(set_id: str):
    try:
        set_res = supabase.table("study_sets").select("*").eq("id", set_id).single().execute()
        if not set_res.data:
            raise HTTPException(status_code=404, detail="Study set not found.")
        
        items_res = supabase.table("study_items").select("*").eq("set_id", set_id).execute()
        
        return {"study_set": set_res.data, "study_items": items_res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))