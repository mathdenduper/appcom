from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# This is important security code that allows your front-end
# to communicate with this back-end. We will add the live
# URLs for your website here later.
origins = [
    "http://localhost:3000",
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
    This is the first "endpoint" of your API.
    When the front-end makes a request to the main URL,
    this function runs and sends back a confirmation message.
    """
    return {"message": "Welcome to the StudyAI API!"}