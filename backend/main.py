# backend/main.py
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
import random
from typing import Optional

load_dotenv()
app = FastAPI()

# Your final, robust CORS configuration
origins = ["*"] 
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI Helper Functions (Your working code, unchanged) ---
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
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        response_content = chat_completion.choices[0].message.content
        parsed_json = json.loads(response_content)
        study_items = parsed_json.get("study_items")
        if not isinstance(study_items, list):
            raise HTTPException(status_code=500, detail="AI did not return a valid list of study items in its JSON response.")
        return study_items
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Groq API request failed: {str(e)}")

def generate_quiz_from_ai(text: str):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in environment.")
    client = Groq(api_key=api_key)
    word_count = len(text.split())
    num_questions = max(3, min(10, word_count // 200))
    system_prompt = "You are an expert quiz designer. Your task is to create a multiple-choice quiz from the provided text. You must respond with only a valid JSON object."
    user_prompt = f"Please generate exactly {num_questions} multiple-choice questions from the following text. Format your response as a JSON object with a single key 'quiz_questions', which contains a list of objects. Each object must have a 'question' key, a 'correct_answer' key, and an 'options' key which is a list of 4 strings (the correct answer plus three plausible distractors). Text: {text[:4000]}"
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        response_content = chat_completion.choices[0].message.content
        parsed_json = json.loads(response_content)
        quiz_questions = parsed_json.get("quiz_questions")
        if not isinstance(quiz_questions, list):
            raise HTTPException(status_code=500, detail="AI did not return a valid list of quiz questions.")
        for question in quiz_questions:
            if 'options' in question and isinstance(question['options'], list):
                random.shuffle(question['options'])
        return quiz_questions
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Groq API request for quiz failed: {str(e)}")


# --- Data Models (Consolidated and Corrected) ---
class UserCredentials(BaseModel):
    email: EmailStr
    password: str

class QuizResultPayload(BaseModel):
    user_id: str
    set_id: str
    score: int
    total_questions: int
    points_to_add: int

class UpdateProfilePayload(BaseModel):
    user_id: str
    first_name: str
    last_name: str

# ** NEW: Added the missing Pydantic model for awarding points **
class AwardCrPayload(BaseModel):
    user_id: str
    points_to_add: int

class SharePayload(BaseModel):
    sender_id: str
    recipient_id: str
    study_set_id: str

class AcceptSharePayload(BaseModel):
    share_id: str
    recipient_id: str
    study_set_id: str

class DeclineSharePayload(BaseModel):
    share_id: str

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the StudyAI API!"}

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
    # ... (Your existing code, unchanged)
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
    # ... (Your existing code, unchanged)
    try:
        set_res = supabase.table("study_sets").select("*").eq("id", set_id).single().execute()
        if not set_res.data:
            raise HTTPException(status_code=404, detail="Study set not found.")
        items_res = supabase.table("study_items").select("*").eq("set_id", set_id).execute()
        return {"study_set": set_res.data, "study_items": items_res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/my-study-sets/{user_id}")
def get_my_study_sets(user_id: str):
    # ... (Your existing code, unchanged)
    try:
        res = supabase.table("study_sets").select("id, title, created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/generate-quiz/{set_id}")
def generate_quiz(set_id: str):
    # ... (Your existing code, unchanged)
    try:
        set_res = supabase.table("study_sets").select("original_content").eq("id", set_id).single().execute()
        if not set_res.data or not set_res.data.get("original_content"):
            raise HTTPException(status_code=404, detail="Original content for this study set not found.")
        
        original_content = set_res.data["original_content"]
        quiz_questions = generate_quiz_from_ai(original_content)
        return quiz_questions
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# ** FIXED: Removed the duplicate log_quiz_attempt function **
@app.post("/log-quiz-attempt")
def log_quiz_attempt(payload: QuizResultPayload):
    """
    Logs a quiz attempt, logs the CR transaction, and updates the user's score.
    """
    try:
        if payload.total_questions > 0:
            supabase.table("quiz_attempts").insert({
                'user_id': payload.user_id,
                'set_id': payload.set_id,
                'score': payload.score,
                'total_questions': payload.total_questions,
            }).execute()

        if payload.points_to_add > 0:
            supabase.table("cr_transactions").insert({
                'user_id': payload.user_id,
                'points_earned': payload.points_to_add
            }).execute()
        
        supabase.rpc('increment_cr_score', {
            'user_id_to_update': payload.user_id,
            'points_to_add': payload.points_to_add
        }).execute()

        return {"message": "Quiz attempt logged and CR awarded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during quiz log: {str(e)}")

# ** NEW: Added the missing /award-cr endpoint **
@app.post("/award-cr")
def award_cr(payload: AwardCrPayload):
    """
    Awards a specific number of CR points to a user.
    """
    try:
        supabase.rpc('increment_cr_score', {
            'user_id_to_update': payload.user_id,
            'points_to_add': payload.points_to_add
        }).execute()
        return {"message": f"Successfully awarded {payload.points_to_add} CR points."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during CR award: {str(e)}")
        
@app.get("/get-results/{user_id}")
def get_results(user_id: str):
    # ... (Your existing code, unchanged)
    try:
        res = supabase.table("quiz_attempts").select("*, study_sets(title)").eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/leaderboard")
def get_leaderboard(timespan: Optional[str] = 'all_time', timezone: Optional[str] = 'UTC'):
    # ... (Your existing code, unchanged)
    try:
        res = supabase.rpc('get_leaderboard', {'timespan_filter': timespan, 'p_timezone': timezone}).execute()
        if res.data is None:
            return []
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/update-profile")
def update_profile(payload: UpdateProfilePayload):
    # ... (Your existing code, unchanged)
    try:
        supabase.auth.admin.update_user_by_id(
            payload.user_id,
            {"user_metadata": {"first_name": payload.first_name, "last_name": payload.last_name}}
        )
        supabase.table("profiles").update({
            "first_name": payload.first_name,
            "last_name": payload.last_name
        }).eq("id", payload.user_id).execute()
        return {"message": "Profile updated successfully in both locations."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/users/search")
def search_users(query: str, current_user_id: str):
    """Searches for users by calling the dedicated RPC function."""
    try:
        res = supabase.rpc('search_users_by_email', {
            'p_query': query,
            'p_current_user_id': current_user_id
        }).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching users: {str(e)}")


@app.post("/share-set")
def share_set(payload: SharePayload):
    """Shares a study set from a sender to a recipient."""
    try:
        # ** FIXED: No longer need to look up email, we receive the ID directly **
        if payload.recipient_id == payload.sender_id:
            raise HTTPException(status_code=400, detail="You cannot share a set with yourself.")

        # Insert directly into the shares table
        supabase.table("shares").insert({
            "sender_id": payload.sender_id,
            "recipient_id": payload.recipient_id,
            "study_set_id": payload.study_set_id
        }).execute()

        return {"message": "Set shared successfully!"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Database error while sharing: {str(e)}")


@app.get("/shares/sent/{user_id}")
def get_sent_shares_endpoint(user_id: str):
    """Gets all shares sent by a user by calling the RPC function."""
    try:
        res = supabase.rpc('get_sent_shares', {'p_user_id': user_id}).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sent shares: {str(e)}")


@app.get("/shares/inbox/{user_id}")
def get_inbox_endpoint(user_id: str):
    """Gets all shares received by a user by calling the RPC function."""
    try:
        res = supabase.rpc('get_inbox_shares', {'p_user_id': user_id}).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching inbox: {str(e)}")

@app.post("/shares/accept")
def accept_share(payload: AcceptSharePayload):
    """Accepts a shared study set, copying it and updating status."""
    try:
        # Step 1: Mark the share as 'accepted'
        supabase.table("shares").update({"status": "accepted"}).eq("id", payload.share_id).execute()

        # Step 2: Get the original set and its items
        original_set_res = supabase.table("study_sets").select("*").eq("id", payload.study_set_id).single().execute()
        original_items_res = supabase.table("study_items").select("*").eq("set_id", payload.study_set_id).execute()
        if not original_set_res.data:
            raise HTTPException(status_code=404, detail="Original study set not found.")
        original_set = original_set_res.data
        original_items = original_items_res.data
        
        # Step 3: Create a new set for the recipient
        new_set_res = supabase.table("study_sets").insert({
            "user_id": payload.recipient_id,
            "title": f"(Shared) {original_set['title']}",
            "original_content": original_set['original_content']
        }).execute()
        new_set_id = new_set_res.data[0]['id']

        # Step 4: Copy the items to the new set
        if original_items:
            items_to_copy = [
                {"set_id": new_set_id, "user_id": payload.recipient_id, "question": item['question'], "answer": item['answer']}
                for item in original_items
            ]
            supabase.table("study_items").insert(items_to_copy).execute()
        return {"message": "Set accepted and copied to your account!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during accept: {str(e)}")

@app.post("/shares/decline")
def decline_share(payload: DeclineSharePayload):
    """Declines a shared study set, updating its status."""
    try:
        supabase.table("shares").update({"status": "declined"}).eq("id", payload.share_id).execute()
        return {"message": "Share declined successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during decline: {str(e)}")