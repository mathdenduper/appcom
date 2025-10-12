# Author: Tristan Bong
# Page name: main.py
# Page purpose: Runs the program's backend
# Date created: 14/09

# Importing libraries
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Request
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
import datetime

# Loads environmental variables
load_dotenv()
app = FastAPI()

arrOrigins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=arrOrigins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Functions ---
def generateStudyItemsFromAI(strText: str):
    strApiKey = os.environ.get("GROQ_API_KEY")
    if not strApiKey:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in environment.")
    
    objClient = Groq(api_key=strApiKey)
    intWordCount = len(strText.split())
    intNumItems = max(3, min(15, intWordCount // 150))
    
    strSystemPrompt = "You are a helpful study assistant. Your task is to generate question and answer pairs from the provided text. You must respond with only a valid JSON object."
    strUserPrompt = f"Please generate {intNumItems} question and answer pairs from the following text. Format your response as a JSON object with a single key 'study_items' which contains a list of objects, where each object has a 'question' key and an 'answer' key. Text: {strText[:3000]}"
    
    try:
        objChatCompletion = objClient.chat.completions.create(
            messages=[
                {"role": "system", "content": strSystemPrompt},
                {"role": "user", "content": strUserPrompt},
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        strResponseContent = objChatCompletion.choices[0].message.content
        objParsedJson = json.loads(strResponseContent)
        arrStudyItems = objParsedJson.get("study_items")
        if not isinstance(arrStudyItems, list):
            raise HTTPException(status_code=500, detail="AI did not return a valid list of study items in its JSON response.")
        return arrStudyItems
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Groq API request failed: {str(e)}")


def generateQuizFromAI(strText: str):
    strApiKey = os.environ.get("GROQ_API_KEY")
    if not strApiKey:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in environment.")
    
    objClient = Groq(api_key=strApiKey)
    intWordCount = len(strText.split())
    intNumQuestions = max(3, min(10, intWordCount // 200))
    
    strSystemPrompt = "You are an expert quiz designer. Your task is to create a multiple-choice quiz from the provided text. You must respond with only a valid JSON object."
    strUserPrompt = f"Please generate exactly {intNumQuestions} multiple-choice questions from the following text. Format your response as a JSON object with a single key 'quiz_questions', which contains a list of objects. Each object must have a 'question' key, a 'correct_answer' key, and an 'options' key which is a list of 4 strings (the correct answer plus three plausible distractors). Text: {strText[:4000]}"
    
    try:
        objChatCompletion = objClient.chat.completions.create(
            messages=[
                {"role": "system", "content": strSystemPrompt},
                {"role": "user", "content": strUserPrompt},
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        strResponseContent = objChatCompletion.choices[0].message.content
        objParsedJson = json.loads(strResponseContent)
        arrQuizQuestions = objParsedJson.get("quiz_questions")
        if not isinstance(arrQuizQuestions, list):
            raise HTTPException(status_code=500, detail="AI did not return a valid list of quiz questions.")
        
        for objQuestion in arrQuizQuestions:
            if 'options' in objQuestion and isinstance(objQuestion['options'], list):
                random.shuffle(objQuestion['options'])
        return arrQuizQuestions
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Groq API request for quiz failed: {str(e)}")


# --- Data Models ---
class UserCredentials(BaseModel):
    strEmail: EmailStr
    strPassword: str

class QuizResultPayload(BaseModel):
    strUserId: str
    strSetId: str
    intScore: int
    intTotalQuestions: int
    intPointsToAdd: int

class UpdateProfilePayload(BaseModel):
    strUserId: str
    strFirstName: str
    strLastName: str

class AwardCrPayload(BaseModel):
    strUserId: str
    intPointsToAdd: int

class SharePayload(BaseModel):
    strSenderId: str
    strRecipientId: str
    strStudySetId: str

class AcceptSharePayload(BaseModel):
    strShareId: str
    strRecipientId: str
    strStudySetId: str

class DeclineSharePayload(BaseModel):
    strShareId: str

class DeletePayload(BaseModel):
    strUserId: str

class QuestCompletionPayload(BaseModel):
    strUserId: str
    strQuestType: str
    intValue: int

class StatUpdatePayload(BaseModel):
    strUserId: str
    strStatType: str
    intValue: int

class ClaimRewardPayload(BaseModel):
    strUserId: str
    intCompletionId: int
    intPointsToAdd: int


# --- API Endpoints ---
@app.get("/")
def readRoot():
    return {"message": "Welcome to the StudyAI API!"}

@app.post("/signup")
def signUp(payload: UserCredentials):
    try:
        res = supabase.auth.sign_up({"email": payload.strEmail, "password": payload.strPassword})
        return {"message": "Signup successful!", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
def signIn(payload: UserCredentials):
    try:
        res = supabase.auth.sign_in_with_password({"email": payload.strEmail, "password": payload.strPassword})
        return {"message": "Login successful!", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process-notes")
async def processNotes(
    strTitle: str = Form(...), strUserId: str = Form(...), strText: str = Form(None), fileUpload: UploadFile = File(None)
):
    strExtractedText = ""
    if fileUpload and fileUpload.size > 0:
        if fileUpload.content_type == 'application/pdf':
            try:
                bytesPdf = await fileUpload.read()
                objPdfReader = PyPDF2.PdfReader(BytesIO(bytesPdf))
                strExtractedText = "".join(page.extract_text() for page in objPdfReader.pages if page.extract_text())
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")
        else:
            bytesText = await fileUpload.read()
            strExtractedText = bytesText.decode('utf-8')
    elif strText:
        strExtractedText = strText
    else:
        raise HTTPException(status_code=400, detail="No content provided.")

    if len(strExtractedText.strip()) < 50:
        raise HTTPException(status_code=400, detail="The provided text is too short.")

    arrGeneratedItems = generateStudyItemsFromAI(strExtractedText)
    if not isinstance(arrGeneratedItems, list) or not all("question" in item and "answer" in item for item in arrGeneratedItems):
        raise HTTPException(status_code=500, detail="AI returned data in an unexpected format.")

    try:
        objSetInsertRes = supabase.table("study_sets").insert({
            "user_id": strUserId,
            "title": strTitle,
            "original_content": strExtractedText
        }).execute()
        strNewSetId = objSetInsertRes.data[0]['id']

        arrItemsToInsert = [
            {"set_id": strNewSetId, "user_id": strUserId, "question": item['question'], "answer": item['answer']}
            for item in arrGeneratedItems
        ]
        supabase.table("study_items").insert(arrItemsToInsert).execute()

        # Track that a new set has been created
        supabase.rpc('update_daily_stat', {
            'p_user_id': strUserId,
            'p_stat_type': 'sets_created',
            'p_increment_value': 1
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {"message": "Study set generated and saved successfully!", "study_set_id": strNewSetId}

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
        quiz_questions = generateQuizFromAI(original_content)
        return quiz_questions
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

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
        strNewSetId = new_set_res.data[0]['id']

        # Step 4: Copy the items to the new set
        if original_items:
            items_to_copy = [
                {"set_id": strNewSetId, "user_id": payload.recipient_id, "question": item['question'], "answer": item['answer']}
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

@app.delete("/delete-set/{set_id}")
def delete_study_set(set_id: str, payload: DeletePayload):
    """
    Deletes a study set and all its related items, but only if the
    requesting user is the owner of the set.
    """
    try:
        # First, verify ownership to ensure security
        set_res = supabase.table("study_sets").select("user_id").eq("id", set_id).single().execute()
        if not set_res.data:
            raise HTTPException(status_code=404, detail="Study set not found.")
        
        if set_res.data['user_id'] != payload.user_id:
            raise HTTPException(status_code=403, detail="You are not authorised to delete this set.")

        # If ownership is verified, proceed with deletion
        # Cascade delete in Supabase will handle related study_items and shares
        supabase.table("study_sets").delete().eq("id", set_id).execute()

        return {"message": "Study set deleted successfully."}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/stats/update")
def update_user_stats(payload: StatUpdatePayload):
    """
    Updates a user's daily stats. Creates a new row for the day if one doesn't exist.
    This is an UPSERT operation.
    """
    try:
        # This calls a database function to either insert a new daily record or update an existing one.
        # The function handles incrementing the correct stat column.
        supabase.rpc('update_daily_stat', {
            'p_user_id': payload.user_id,
            'p_stat_type': payload.stat_type,
            'p_increment_value': payload.value
        }).execute()
        return {"message": "Stats updated successfully."}
    except Exception as e:
        # Fail silently so we don't interrupt the user
        print(f"Error updating stats: {str(e)}")
        return {"message": "An error occurred but was handled."}


@app.get("/quests/daily/{user_id}")
def get_daily_quests(user_id: str):
    """
    Fetches or generates daily quests for a user and joins them with today's progress.
    """
    try:
        res = supabase.rpc('get_daily_quests_with_progress', {'p_user_id': user_id}).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching daily quests: {str(e)}")


@app.post("/quests/claim-reward")
def claim_quest_reward(payload: ClaimRewardPayload):
    try:
        res = supabase.table("user_quest_completions").select("*, quests(*)").eq("id", payload.completion_id).eq("user_id", payload.user_id).single().execute()
        if not res.data or res.data['is_claimed']:
            raise HTTPException(status_code=400, detail="Quest not available to be claimed.")
        quest = res.data['quests']
        if res.data['progress'] < quest['target_value']:
            raise HTTPException(status_code=400, detail="Quest is not yet completed.")
        supabase.table("user_quest_completions").update({"is_claimed": True}).eq("id", res.data['id']).execute()
        supabase.rpc('increment_cr_score', {'user_id_to_update': payload.user_id, 'points_to_add': payload.points_to_add}).execute()
        return {"message": "Reward claimed!"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error claiming reward: {str(e)}")