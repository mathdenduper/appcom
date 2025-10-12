# Author: Tristan Bong
# Page name: main.py
# Page purpose: Runs the program's backend
# Date created: 14/09

# Importing libraries
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
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
# Initialise FastAPI app
app = FastAPI()

# Configure CORS
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
    # INPUT: strText from user-uploaded notes or typed text
    strApiKey = os.environ.get("GROQ_API_KEY") # INPUT: Fetch API key for AI
    if not strApiKey:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in environment.")
    
    # PROCESS: Initialise Groq client
    objClient = Groq(api_key=strApiKey)
    # PROCESS: Calculate number of Q&A items based on text length
    intWordCount = len(strText.split())
    intNumItems = max(3, min(15, intWordCount // 150))
    
    # INPUT: Prompts for AI
    strSystemPrompt = "You are a helpful study assistant. Your task is to generate question and answer pairs from the provided text. You must respond with only a valid JSON object."
    strUserPrompt = f"Please generate {intNumItems} question and answer pairs from the following text. Format your response as a JSON object with a single key 'study_items' which contains a list of objects, where each object has a 'question' key and an 'answer' key. Text: {strText[:3000]}"
    
    try:
        # PROCESS: Call Groq API
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
        # OUTPUT: Get raw content from AI
        strResponseContent = objChatCompletion.choices[0].message.content
        # PROCESS: Parse JSON response
        objParsedJson = json.loads(strResponseContent)
        # OUTPUT: Extract list of Q&A items
        arrStudyItems = objParsedJson.get("study_items")
        if not isinstance(arrStudyItems, list):
            raise HTTPException(status_code=500, detail="AI did not return a valid list of study items in its JSON response.")
        return arrStudyItems # OUTPUT: Return list
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Groq API request failed: {str(e)}")


def generateQuizFromAI(strText: str):
    # INPUT: strText from user-uploaded notes or typed text
    strApiKey = os.environ.get("GROQ_API_KEY") # INPUT: Fetch API key for AI
    if not strApiKey:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in environment.")
    
    # PROCESS: Initialise Groq client
    objClient = Groq(api_key=strApiKey)
    # PROCESS: Determine number of multiple-choice questions
    intWordCount = len(strText.split())
    intNumQuestions = max(3, min(10, intWordCount // 200))
    # INPUT: Prompts for AI
    strSystemPrompt = "You are an expert quiz designer. Your task is to create a multiple-choice quiz from the provided text. You must respond with only a valid JSON object."
    strUserPrompt = f"Please generate exactly {intNumQuestions} multiple-choice questions from the following text. Format your response as a JSON object with a single key 'quiz_questions', which contains a list of objects. Each object must have a 'question' key, a 'correct_answer' key, and an 'options' key which is a list of 4 strings (the correct answer plus three plausible distractors). Text: {strText[:4000]}"
    
    try:
        # PROCESS: Call Groq API
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
        # OUTPUT: Raw AI response
        strResponseContent = objChatCompletion.choices[0].message.content
        # PROCESS: Parse JSON
        objParsedJson = json.loads(strResponseContent)
        arrQuizQuestions = objParsedJson.get("quiz_questions") # OUTPUT: Extract quiz questions
        if not isinstance(arrQuizQuestions, list):
            raise HTTPException(status_code=500, detail="AI did not return a valid list of quiz questions.")
        
        # PROCESS: Shuffle answer options
        for objQuestion in arrQuizQuestions:
            if 'options' in objQuestion and isinstance(objQuestion['options'], list):
                random.shuffle(objQuestion['options'])
        return arrQuizQuestions
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Groq API request for quiz failed: {str(e)}")


# --- Data Models ---

ConfigBase = {
    # Allows both the alias (snake_case from frontend) and the field name (camelCase in Python) to be used.
    "populate_by_name": True 
}

class UserCredentials(BaseModel):
    strEmail: EmailStr # INPUT: Email string
    strPassword: str # INPUT: Password string

# ALL INPUT:

class UserCredentials(BaseModel):
    # For signup/login, FastAPI automatically handles email/password
    strEmail: EmailStr = Field(alias="email")
    strPassword: str = Field(alias="password")
    model_config = ConfigBase

class QuizResultPayload(BaseModel):
    strUserId: str = Field(alias="user_id")
    strSetId: str = Field(alias="set_id")
    intScore: int = Field(alias="score")
    intTotalQuestions: int = Field(alias="total_questions")
    intPointsToAdd: int = Field(alias="points_to_add")
    model_config = ConfigBase

class UpdateProfilePayload(BaseModel):
    # This is the fix for your 422 error
    strUserId: str = Field(alias="user_id")
    strFirstName: str = Field(alias="first_name")
    strLastName: str = Field(alias="last_name")
    model_config = ConfigBase

class AwardCrPayload(BaseModel):
    strUserId: str = Field(alias="user_id")
    intPointsToAdd: int = Field(alias="points_to_add")
    model_config = ConfigBase

class SharePayload(BaseModel):
    strSenderId: str = Field(alias="sender_id")
    strRecipientId: str = Field(alias="recipient_id")
    strStudySetId: str = Field(alias="study_set_id")
    model_config = ConfigBase

class AcceptSharePayload(BaseModel):
    strShareId: str = Field(alias="share_id")
    strRecipientId: str = Field(alias="recipient_id")
    strStudySetId: str = Field(alias="study_set_id")
    
    # Define config directly inside the class
    model_config = {
        "populate_by_name": True 
    }

class DeclineSharePayload(BaseModel):
    strShareId: str = Field(alias="share_id")
    model_config = ConfigBase

class DeletePayload(BaseModel):
    strUserId: str = Field(alias="user_id")
    model_config = ConfigBase

class QuestCompletionPayload(BaseModel):
    strUserId: str = Field(alias="user_id")
    strQuestType: str = Field(alias="quest_type")
    intValue: int = Field(alias="value")
    model_config = ConfigBase

class StatUpdatePayload(BaseModel):
    strUserId: str = Field(alias="user_id")
    strStatType: str = Field(alias="stat_type")
    intValue: int = Field(alias="value")
    model_config = ConfigBase

class ClaimRewardPayload(BaseModel):
    strUserId: str = Field(alias="user_id")
    intCompletionId: int = Field(alias="completion_id")
    intPointsToAdd: int = Field(alias="points_to_add")
    model_config = ConfigBase


# --- API Endpoints ---
@app.get("/")
def readRoot():
    # OUTPUT: Welcome message
    return {"message": "Welcome to the StudyAI API!"}

@app.post("/signup")
def signUp(payload: UserCredentials):
    # INPUT: email and password
    try:
        # PROCESS: Sign up user in Supabase
        res = supabase.auth.sign_up({"email": payload.strEmail, "password": payload.strPassword})
        # OUTPUT: Return signup confirmation
        return {"message": "Signup successful!", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login")
def signIn(payload: UserCredentials):
    # INPUT: email and password
    try:
        # PROCESS: Authenticate user
        res = supabase.auth.sign_in_with_password({"email": payload.strEmail, "password": payload.strPassword})
        # OUTPUT: Return login confirmation
        return {"message": "Login successful!", "data": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#   Input: Form data including title, user ID, optional text input, and optional file upload (PDF or TXT).
#   Process:
#       - Extract text from uploaded file or provided text input.
#       - Validate extracted content length.
#       - Generate study items via AI.
#       - Insert new study set and items into Supabase.
#       - Update user’s daily creation statistics.
#   Output: JSON message confirming study set creation and the new set ID, or HTTP error on failure.

@app.post("/process-notes")
async def processNotes(
    # FIX: Use alias to map incoming form/file keys back to Python variable names
    strTitle: str = Form(..., alias="title"), 
    strUserId: str = Form(..., alias="user_id"), 
    strText: str = Form(None, alias="text"), 
    fileUpload: UploadFile = File(None, alias="file")
):
    # PROCESS: Initialise variable for extracted text
    strExtractedText = ""
    # PROCESS: Extract text from uploaded PDF or TXT file
    
    # NOTE: The variable fileUpload is used here, matching the function signature.
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
        strExtractedText = strText # INPUT: Use provided text
    else:
        raise HTTPException(status_code=400, detail="No content provided.")

    if len(strExtractedText.strip()) < 50:
        # PROCESS: Validate text length
        raise HTTPException(status_code=400, detail="The provided text is too short.")
    # PROCESS: Generate study items via AI
    arrGeneratedItems = generateStudyItemsFromAI(strExtractedText)
    if not isinstance(arrGeneratedItems, list) or not all("question" in item and "answer" in item for item in arrGeneratedItems):
        raise HTTPException(status_code=500, detail="AI returned data in an unexpected format.")

    try:
        # PROCESS: Insert study set into DB
        objSetInsertRes = supabase.table("study_sets").insert({
            "user_id": strUserId,
            "title": strTitle,
            "original_content": strExtractedText
        }).execute()
        # OUTPUT: New set ID
        strNewSetId = objSetInsertRes.data[0]['id']
        # PROCESS: Insert study items
        arrItemsToInsert = [
            {"set_id": strNewSetId, "user_id": strUserId, "question": item['question'], "answer": item['answer']}
            for item in arrGeneratedItems
        ]
        supabase.table("study_items").insert(arrItemsToInsert).execute()

        # PROCESS: Update daily stats
        supabase.rpc('update_daily_stat', {
            'p_user_id': strUserId,
            'p_stat_type': 'sets_created',
            'p_increment_value': 1
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    # OUTPUT: Confirmation of set creation
    return {"message": "Study set generated and saved successfully!", "study_set_id": strNewSetId}

@app.get("/study-set/{set_id}")
def get_study_set(set_id: str):
    # INPUT: set_id from URL path
    try:
        # PROCESS: Retrieve study set metadata
        set_res = supabase.table("study_sets").select("*").eq("id", set_id).single().execute()
        if not set_res.data:
            raise HTTPException(status_code=404, detail="Study set not found.")
        # PROCESS: Retrieve associated study items
        items_res = supabase.table("study_items").select("*").eq("set_id", set_id).execute()
        # OUTPUT: Return study set with items
        return {"study_set": set_res.data, "study_items": items_res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/my-study-sets/{user_id}")
def get_my_study_sets(user_id: str):
    # INPUT: user_id from URL path
    try:
        # PROCESS: Fetch all sets belonging to the user
        res = supabase.table("study_sets").select("id, title, created_at").eq("user_id", user_id).order("created_at", desc=True).execute()
        # OUTPUT: Return list of user's study sets
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/generate-quiz/{set_id}")
def generate_quiz(set_id: str):
    # INPUT: set_id from URL path
    try:
        # PROCESS: Get original content for the study set
        set_res = supabase.table("study_sets").select("original_content").eq("id", set_id).single().execute()
        if not set_res.data or not set_res.data.get("original_content"):
            raise HTTPException(status_code=404, detail="Original content for this study set not found.")
        original_content = set_res.data["original_content"]
        # PROCESS: Generate multiple-choice quiz
        quiz_questions = generateQuizFromAI(original_content)
        # OUTPUT: Return quiz questions
        return quiz_questions
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# Logs a quiz attempt, logs the CR transaction, and updates the user's score.
#   Input: QuizResultPayload containing user ID, set ID, score, total questions, and points to add.
#   Process: 
#       - Insert quiz attempt data into Supabase.
#       - Insert CR transaction entry if points were earned.
#       - Call RPC function to increment total CR score.
#   Output: JSON message confirming successful logging or HTTP 500 error on failure.

@app.post("/log-quiz-attempt")
def log_quiz_attempt(payload: QuizResultPayload):
    try:
        if payload.intTotalQuestions > 0:
            supabase.table("quiz_attempts").insert({
                'user_id': payload.strUserId,
                'set_id': payload.strSetId,
                'score': payload.intScore,
                'total_questions': payload.intTotalQuestions,
            }).execute()

        if payload.intPointsToAdd > 0:
            supabase.table("cr_transactions").insert({
                'user_id': payload.strUserId,
                'points_earned': payload.intPointsToAdd
            }).execute()
         
        supabase.rpc('increment_cr_score', {
            'user_id_to_update': payload.strUserId,
            'points_to_add': payload.intPointsToAdd
        }).execute()

        return {"message": "Quiz attempt logged and CR awarded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during quiz log: {str(e)}")

@app.post("/award-cr")
def award_cr(payload: AwardCrPayload):
    # INPUT: user_id and points to award
    try:
        # PROCESS: Increment CR points using RPC
        supabase.rpc('increment_cr_score', {
            'user_id_to_update': payload.strUserId,
            'points_to_add': payload.intPointsToAdd
        }).execute()

        # OUTPUT: Confirmation
        return {"message": f"Successfully awarded {payload.intPointsToAdd} CR points."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during CR award: {str(e)}")  # OUTPUT: Error

@app.get("/get-results/{user_id}")
def get_results(user_id: str):
    # INPUT: user_id from URL path
    try:
        # PROCESS: Fetch all quiz attempts for user, join with study set titles
        res = supabase.table("quiz_attempts").select("*, study_sets(title)").eq("user_id", user_id).order("created_at", desc=True).execute()

        # OUTPUT: Return quiz results
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  # OUTPUT: Error

@app.get("/leaderboard")
def get_leaderboard(timespan: Optional[str] = 'all_time', timezone: Optional[str] = 'UTC'):
    # INPUT: timespan and timezone
    try:
        # PROCESS: Call RPC to generate leaderboard
        res = supabase.rpc('get_leaderboard', {'timespan_filter': timespan, 'p_timezone': timezone}).execute()
        if res.data is None:
            return []  # OUTPUT: Empty list if no data

        # OUTPUT: Return leaderboard
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")  # OUTPUT: Error

@app.post("/update-profile")
def update_profile(payload: UpdateProfilePayload):
    # INPUT: User profile info (first/last name)
    try:
        # PROCESS: Update Supabase auth metadata
        supabase.auth.admin.update_user_by_id(
            payload.strUserId,
            {"user_metadata": {"first_name": payload.strFirstName, "last_name": payload.strLastName}}
        )

        # PROCESS: Update profiles table
        supabase.table("profiles").update({
            "first_name": payload.strFirstName,
            "last_name": payload.strLastName
        }).eq("id", payload.strUserId).execute()

        # OUTPUT: Confirmation
        return {"message": "Profile updated successfully in both locations."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")  # OUTPUT: Error

@app.get("/users/search")
def search_users(query: str, current_user_id: str):
    # INPUT: query string and current user ID
    try:
        # PROCESS: Call RPC to search users
        res = supabase.rpc('search_users_by_email', {
            'p_query': query,
            'p_current_user_id': current_user_id
        }).execute()

        # OUTPUT: List of users
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching users: {str(e)}")  # OUTPUT: Error

@app.post("/share-set")
def share_set(payload: SharePayload):
    # INPUT: sender_id, recipient_id, study_set_id
    try:
        # PROCESS: Prevent self-sharing
        if payload.strRecipientId == payload.strSenderId:
            raise HTTPException(status_code=400, detail="You cannot share a set with yourself.")  # OUTPUT: Error

        # PROCESS: Insert share into DB
        supabase.table("shares").insert({
            "sender_id": payload.strSenderId,
            "recipient_id": payload.strRecipientId,
            "study_set_id": payload.strStudySetId
        }).execute()

        # OUTPUT: Confirmation
        return {"message": "Set shared successfully!"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Database error while sharing: {str(e)}")  # OUTPUT: Error

@app.get("/shares/sent/{user_id}")
def get_sent_shares_endpoint(user_id: str):
    # INPUT: user_id from URL path
    try:
        # PROCESS: Call RPC to fetch shares sent by user
        res = supabase.rpc('get_sent_shares', {'p_user_id': user_id}).execute()

        # OUTPUT: Return list of sent shares
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sent shares: {str(e)}")  # OUTPUT: Error

@app.get("/shares/inbox/{user_id}")
def get_inbox_endpoint(user_id: str):
    # INPUT: user_id from URL path
    try:
        # PROCESS: Call RPC to fetch shares received by user
        res = supabase.rpc('get_inbox_shares', {'p_user_id': user_id}).execute()

        # OUTPUT: Return inbox shares
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching inbox: {str(e)}")  # OUTPUT: Error

@app.post("/shares/accept")
def accept_share(payload: AcceptSharePayload):
    # INPUT: share_id, recipient_id, study_set_id
    try:
        # PROCESS: Update share status to accepted
        supabase.table("shares").update({"status": "accepted"}).eq("id", payload.strShareId).execute()

        # PROCESS: Retrieve original set and items
        original_set_res = supabase.table("study_sets").select("*").eq("id", payload.strStudySetId).single().execute()
        original_items_res = supabase.table("study_items").select("*").eq("set_id", payload.strStudySetId).execute()
        if not original_set_res.data:
            raise HTTPException(status_code=404, detail="Original study set not found.")  # OUTPUT: Error

        original_set = original_set_res.data
        original_items = original_items_res.data

        # PROCESS: Create new set for recipient
        new_set_res = supabase.table("study_sets").insert({
            "user_id": payload.strRecipientId,
            "title": f"(Shared) {original_set['title']}",
            "original_content": original_set['original_content']
        }).execute()
        strNewSetId = new_set_res.data[0]['id']

        # PROCESS: Copy items to new set
        if original_items:
            items_to_copy = [
                {"set_id": strNewSetId, "user_id": payload.strRecipientId, "question": item['question'], "answer": item['answer']}
                for item in original_items
            ]
            supabase.table("study_items").insert(items_to_copy).execute()

        # OUTPUT: Confirmation message
        return {"message": "Set accepted and copied to your account!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during accept: {str(e)}")  # OUTPUT: Error

@app.post("/shares/decline")
def decline_share(payload: DeclineSharePayload):
    # INPUT: share_id
    try:
        # PROCESS: Update share status to declined
        supabase.table("shares").update({"status": "declined"}).eq("id", payload.strShareId).execute()

        # OUTPUT: Confirmation
        return {"message": "Share declined successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during decline: {str(e)}")  # OUTPUT: Error

@app.delete("/delete-set/{set_id}")
def delete_study_set(set_id: str, payload: DeletePayload):
    # INPUT: set_id (URL) and user_id (payload)
    try:
        # PROCESS: Verify ownership of study set
        set_res = supabase.table("study_sets").select("user_id").eq("id", set_id).single().execute()
        if not set_res.data:
            raise HTTPException(status_code=404, detail="Study set not found.")  # OUTPUT: Error

        if set_res.data['user_id'] != payload.strUserId:
            raise HTTPException(status_code=403, detail="You are not authorised to delete this set.")  # OUTPUT: Error

        # PROCESS: Delete set (cascade removes items/shares)
        supabase.table("study_sets").delete().eq("id", set_id).execute()

        # OUTPUT: Confirmation
        return {"message": "Study set deleted successfully."}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")  # OUTPUT: Error

@app.post("/stats/update")
def update_user_stats(payload: StatUpdatePayload):
    # INPUT: user_id, stat_type, increment value
    try:
        # PROCESS: Call RPC to insert/update daily stat record
        supabase.rpc('update_daily_stat', {
            'p_user_id': payload.strUserId,
            'p_stat_type': payload.strStatType,
            'p_increment_value': payload.intValue
        }).execute()

        # OUTPUT: Confirmation
        return {"message": "Stats updated successfully."}
    except Exception as e:
        # OUTPUT: Handled error without failing
        print(f"Error updating stats: {str(e)}")
        return {"message": "An error occurred but was handled."}

@app.get("/quests/daily/{user_id}")
def get_daily_quests(user_id: str):
    # INPUT: user_id from URL path
    try:
        # PROCESS: Fetch or generate daily quests with user's progress
        res = supabase.rpc('get_daily_quests_with_progress', {'p_user_id': user_id}).execute()

        # OUTPUT: Return list of quests
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching daily quests: {str(e)}")  # OUTPUT: Error

@app.post("/quests/claim-reward")
def claim_quest_reward(payload: ClaimRewardPayload):
    # INPUT: user_id, completion_id, points to add
    try:
        # PROCESS: Fetch quest completion info
        res = supabase.table("user_quest_completions").select("*, quests(*)")\
            .eq("id", payload.intCompletionId).eq("user_id", payload.strUserId).single().execute()

        if not res.data or res.data['is_claimed']:
            raise HTTPException(status_code=400, detail="Quest not available to be claimed.")  # OUTPUT: Error

        quest = res.data['quests']
        if res.data['progress'] < quest['target_value']:
            raise HTTPException(status_code=400, detail="Quest is not yet completed.")  # OUTPUT: Error

        # PROCESS: Mark as claimed
        supabase.table("user_quest_completions").update({"is_claimed": True}).eq("id", res.data['id']).execute()

        # PROCESS: Award CR points via RPC
        supabase.rpc('increment_cr_score', {'user_id_to_update': payload.strUserId, 'points_to_add': payload.intPointsToAdd}).execute()

        # OUTPUT: Confirmation
        return {"message": "Reward claimed!"}
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error claiming reward: {str(e)}")  # OUTPUT: Error
