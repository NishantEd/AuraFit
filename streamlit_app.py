"""Display the full AuraFit browser app and its project documents in Streamlit."""
from pathlib import Path

import streamlit as st

from app import ROOT, render_html

st.set_page_config(page_title="AuraFit", page_icon="⚡", layout="wide")

with st.sidebar:
    st.title("AuraFit")
    st.caption("CSV wellness dashboard · no login")
    page = st.radio("Open", ["App", "Project guide", "Project history"])
    if st.button("Refresh source CSV", use_container_width=True):
        st.rerun()
    st.caption("The app's top-right menu switches between owner and user views.")
    st.download_button("Download users.csv", (ROOT / "data/users.csv").read_bytes(), "users.csv", "text/csv")

if page == "App":
    st.caption("AuraFit · Use the theme and view menus inside the app. Scroll inside the app panel to see more.")
    st.iframe(render_html(embedded=True), height=720, alt="AuraFit interactive app with owner and user views")
else:
    documents = {"Project guide": "PROJECT_GUIDE", "Project history": "PROJECT_HISTORY"}
    stem = documents[page]
    document = ROOT / f"{stem}.html"
    if document.exists():
        st.iframe(document, height=1100, alt=page)
    else:
        st.markdown((ROOT / f"{stem}.md").read_text(encoding="utf-8"))
    for suffix, mime in [("html", "text/html"), ("md", "text/markdown")]:
        path = ROOT / f"{stem}.{suffix}"
        if path.exists():
            st.download_button(f"Download {suffix.upper()} document", path.read_bytes(), path.name, mime, key=f"{stem}-{suffix}")
