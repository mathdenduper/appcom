import streamlit as st

# -------------------------
# Main Home Page
# -------------------------
st.markdown("""
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
/* Centered container */
.home-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 50px 20px;
    text-align: center;
}

.home-title {
    font-size: 3rem;
    color: #2E7D32;
    font-weight: 700;
    margin-bottom: 20px;
}

.home-subtitle {
    font-size: 1.25rem;
    color: #555;
    margin-bottom: 40px;
}

.home-btn {
    display: inline-block;
    background: linear-gradient(135deg, #4CAF50, #2E7D32);
    color: white;
    font-size: 1.1rem;
    padding: 15px 40px;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    margin: 10px;
}

.home-btn:hover {
    background: linear-gradient(135deg, #66bb6a, #1b5e20);
    transform: translateY(-2px);
}
</style>
<div class="home-container">
    <div class="home-title">Welcome to Study AI 📚</div>
    <div class="home-subtitle">Your modern AI-powered study companion. Upload notes, generate quizzes, and track progress.</div>
    <a href="#" class="home-btn" onclick="window.location.href='#'">Upload Notes</a>
    <a href="#" class="home-btn" onclick="window.location.href='#'">Generate Quiz</a>
    <a href="#" class="home-btn" onclick="window.location.href='#'">Progress Tracker</a>
    <a href="#" class="home-btn" onclick="window.location.href='#'">Account Settings</a>
</div>
""", unsafe_allow_html=True)
