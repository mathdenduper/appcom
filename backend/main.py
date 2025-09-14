# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# This simple security setting is all we need.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The back-end has ONE door at the main entrance (/).
# I have added a new version number to the message so we can be 100% sure the fix is working.
@app.get("/")
def read_root():
    return {"message": "Welcome to the StudyAI API! [Connection Successful - V3 FINAL]"}