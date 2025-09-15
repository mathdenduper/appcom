# backend/supabase_client.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# This line loads the environment variables from your .env file
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY") # Use the powerful SERVICE KEY

# This creates the Supabase client. Because it is using the service key,
# it now has admin privileges and can bypass Row Level Security.
supabase: Client = create_client(url, key)