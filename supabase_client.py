from supabase import create_client
import streamlit as st

# Environment variables (store in Streamlit secrets later)
SUPABASE_URL = st.secrets["SUPABASE_URL"]
SUPABASE_KEY = st.secrets["SUPABASE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
