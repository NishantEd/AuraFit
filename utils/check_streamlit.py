"""Verify the real Streamlit entry point and all document routes."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from streamlit.testing.v1 import AppTest
from app import render_html

page = render_html(embedded=True)
assert "const EMBEDDED_APP = true;" in page
assert 'id="theme-select"' in page and 'id="app-view"' in page
test = AppTest.from_file(str(ROOT / "streamlit_app.py"), default_timeout=30).run()
assert not test.exception, test.exception
for route in ["Project guide", "Project history", "App"]:
    test.radio[0].set_value(route).run()
    assert not test.exception, test.exception
for name in ["PROJECT_GUIDE", "PROJECT_HISTORY"]:
    document=(ROOT/f"{name}.html").read_text(encoding="utf-8")
    assert "<h1" in document and "<h2" in document and "<nav" in document
guide=(ROOT/"PROJECT_GUIDE.html").read_text(encoding="utf-8")
assert guide.count("data:image/svg+xml;base64,")==2
for diagram in (ROOT/"docs/images").glob("*.svg"):
    ET.parse(diagram)
assert not (ROOT/"GITHUB_UPLOAD_STEPS.html").exists()
assert not (ROOT/"GITHUB_UPLOAD_STEPS.md").exists()
history=(ROOT/"PROJECT_HISTORY.md").read_text(encoding="utf-8")
assert '```' not in history and 'Your request:' not in history
print("PASS: Streamlit app and two document routes, updated headings and diagrams, summarized history, upload documents removed.")
