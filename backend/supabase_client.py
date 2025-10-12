# backend/supabase_client.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# This line loads the environment variables from your .env file
load_dotenv()

strSupabaseUrl: str = os.environ.get("SUPABASE_URL")
strSupabaseServiceKey: str = os.environ.get("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(strSupabaseUrl, strSupabaseServiceKey)
