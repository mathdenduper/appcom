# Author: Tristan Bong
# Page name: supabase_client.py
# Page purpose: Runs the program's backend
# Date created: 14/09

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Loads the environment variables from the .env file
load_dotenv()

strSupabaseUrl: str = os.environ.get("SUPABASE_URL")
strSupabaseServiceKey: str = os.environ.get("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(strSupabaseUrl, strSupabaseServiceKey)
