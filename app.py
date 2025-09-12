import streamlit as st

# -------------------------
# Page Config
# -------------------------
st.set_page_config(
    page_title="Study AI",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -------------------------
# Bootstrap + CSS
# -------------------------
st.markdown("""
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
    body { background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }

    /* Sidebar */
    .sidebar .sidebar-content {
        background-color: #2E7D32;
        color: white;
        padding: 1rem;
        border-radius: 1rem;
        margin-bottom: 1rem;
    }
    .sidebar .sidebar-content h2 {
        color: #fff;
        text-align: center;
        margin-bottom: 1rem;
    }

    /* Full-width buttons for pages */
    .sidebar-button {
        display: block;
        width: 100%;
        margin: 0.4rem 0;
        padding: 0.6rem 1rem;
        font-size: 1.05rem;
        font-weight: 600;
        color: #fff;
        background: #4CAF50;
        border: none;
        border-radius: 0.6rem;
        text-align: left;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    .sidebar-button:hover { background-color: #66bb6a; }
    .sidebar-button:active, .sidebar-button.active { background-color: #1b5e20; }
</style>
""", unsafe_allow_html=True)

# -------------------------
# Sidebar
# -------------------------
st.sidebar.markdown('<div class="sidebar-content"><h2>📚 Study AI</h2></div>', unsafe_allow_html=True)

# List of pages
lstPages = {
    "🏠 Home": "home",
    "📝 Notes": "notes",
    "❓ Quizzes": "quizzes",
    "📊 Progress": "progress",
    "⚙️ Settings": "settings",
}

# Store current page in session_state
if "current_page" not in st.session_state:
    st.session_state["current_page"] = "home"

# Render sidebar buttons
for strLabel, strPage in lstPages.items():
    if st.sidebar.button(strLabel, key=strPage):
        st.session_state["current_page"] = strPage

# -------------------------
# Load the selected page
# -------------------------
strPageToLoad = st.session_state["current_page"]

if strPageToLoad == "home":
    st.markdown("<h1>🏠 Home Page</h1><p>Welcome to Study AI!</p>", unsafe_allow_html=True)
elif strPageToLoad == "notes":
    st.markdown("<h1>📝 Notes Page</h1><p>Upload & manage your notes here.</p>", unsafe_allow_html=True)
elif strPageToLoad == "quizzes":
    st.markdown("<h1>❓ Quizzes Page</h1><p>Generate quizzes from your notes.</p>", unsafe_allow_html=True)
elif strPageToLoad == "progress":
    st.markdown("<h1>📊 Progress Tracker</h1><p>Track your study progress.</p>", unsafe_allow_html=True)
elif strPageToLoad == "settings":
    st.markdown("<h1>⚙️ Settings Page</h1><p>Manage your account & preferences.</p>", unsafe_allow_html=True)
