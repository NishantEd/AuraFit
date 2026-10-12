"""Create readable Markdown and portable HTML documents with SVG diagrams."""
import base64
import html
from pathlib import Path
import re

import markdown

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "docs" / "images"


def diagram(name, title, description, boxes, arrows, height=400):
    nodes = []
    for x, y, width, label, lines in boxes:
        nodes.append(f'<rect x="{x}" y="{y}" width="{width}" height="110" rx="16" fill="#161F30" stroke="#8B5CF6"/>')
        nodes.append(f'<text x="{x+18}" y="{y+32}" fill="#F9FAFB" font-size="19" font-weight="700">{html.escape(label)}</text>')
        for i, line in enumerate(lines):
            nodes.append(f'<text x="{x+18}" y="{y+60+i*22}" fill="#B8C2D4" font-size="14">{html.escape(line)}</text>')
    for points in arrows:
        nodes.append(f'<path d="{points}" fill="none" stroke="#B99AFF" stroke-width="3" marker-end="url(#arrow)"/>')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 {height}" role="img" aria-labelledby="title desc">
    <title id="title">{html.escape(title)}</title><desc id="desc">{html.escape(description)}</desc>
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#B99AFF"/></marker></defs>
    <rect width="960" height="{height}" rx="22" fill="#0B0F19"/>
    <g font-family="Segoe UI,Arial,sans-serif"><text x="30" y="42" fill="#F9FAFB" font-size="23" font-weight="700">{html.escape(title)}</text>
    <text x="30" y="70" fill="#9CA3AF" font-size="14">{html.escape(description)}</text>{''.join(nodes)}</g></svg>'''
    (IMAGES / name).write_text(svg, encoding="utf-8")


def make_diagrams():
    IMAGES.mkdir(parents=True, exist_ok=True)
    diagram("views.svg", "Two views, one CSV dataset", "The app opens as owner. The view menu switches to a single person's preview.", [
        (340,100,280,"data/users.csv",["Alex, Jordan, and Sam","Saved wellness snapshots"]),
        (70,260,360,"App owner view",["Directory, totals, and CSV controls","Inspect any user's saved data"]),
        (530,260,360,"User view",["One person's habits and progress","Chat and themes, without login"])
    ], ["M420 210L250 255", "M540 210L710 255"], 410)
    diagram("data-flow.svg", "How saved data reaches AuraFit", "The browser reads a snapshot. Import and reload replace the displayed dataset.", [
        (30,125,240,"CSV file",["Editable rows and columns","One record per user"]),
        (360,125,240,"Python or Streamlit",["Packages the data safely","Builds the app page"]),
        (690,125,240,"Your browser",["Choose a view and a user","See stats and chat replies"]),
        (265,285,430,"Direct index.html preview",["Uses the included CSV copy","Import CSV loads an edited file"])
    ], ["M275 180L350 180", "M605 180L680 180", "M480 245L480 280", "M700 340L815 340L815 245"], 430)
    diagram("iterations.svg", "How AuraFit evolved", "Six refinements shaped the app and its reader-friendly documents.", [
        (30,110,280,"1  Original app",["Five tabs, live tools, dark theme","Fasting, logs, XP, and coach"]),
        (340,110,280,"2  Themes and roles",["Six themes and user profiles","Owner directory and switching"]),
        (650,110,280,"3  CSV owner dashboard",["Three sample users, no login","Selected-user snapshot views"]),
        (30,280,280,"4  Chat and documents",["Restore the bottom-right coach","Plain-English guide and history"]),
        (340,280,280,"5  Streamlit and diagrams",["Readable themes and two views","Streamlit and formatted guides"]),
        (650,280,280,"6  Reader-focused guides",["Short development summaries","Setup and everyday app use"])
    ], ["M315 165L330 165", "M625 165L640 165", "M790 225L790 250L170 250L170 270", "M315 335L330 335", "M625 335L640 335"], 430)


def heading_title(text):
    return text.title().replace("Aurafit", "AuraFit").replace("Csv", "CSV").replace("Github", "GitHub").replace("Streamlit", "Streamlit")


def text_to_markdown(text):
    lines=text.splitlines(); output=[]; i=0
    subtitles={'What was requested:', 'What changed:', 'Windows', 'macOS or Linux', 'Later runs', 'Without Python', 'App owner view', 'User view', 'Choosing a person', 'Reload CSV', 'Import CSV', 'Download CSV', 'Read the dashboard', 'Theme menu', 'Using the chat'}
    while i<len(lines):
        line=lines[i]
        if i+1<len(lines) and re.fullmatch(r'[=-]{3,}',lines[i+1]):
            level='#' if lines[i+1].startswith('=') else '##'
            output.extend(['',f'{level} {heading_title(line)}','']);i+=2;continue
        if line in subtitles:
            output.extend(['',f'### {line.rstrip(":")}',''])
        else:output.append(line)
        i+=1
    return '\n'.join(output)+'\n'


def export_html(stem, text):
    document=markdown.Markdown(extensions=['toc','tables','fenced_code'])
    body=document.convert(text)
    def embed(match):
        path=(ROOT / html.unescape(match.group(1))).resolve()
        if path.is_relative_to(IMAGES.resolve()) and path.is_file():
            encoded=base64.b64encode(path.read_bytes()).decode()
            return f'src="data:image/svg+xml;base64,{encoded}"'
        return match.group(0)
    body=re.sub(r'src="([^"]+)"',embed,body)
    title=stem.replace('_',' ').title()
    css='''body{margin:0;background:#f4f6fb;color:#172033;font:16px/1.75 system-ui,Segoe UI,sans-serif}main{max-width:980px;margin:auto;padding:36px 28px 80px}h1{font-size:36px;line-height:1.2;color:#3f1b79}h2{margin-top:44px;border-bottom:1px solid #d6deec;padding-bottom:10px;color:#45208c}h3{margin-top:25px;color:#334155}a{color:#6d28d9}nav{padding:20px 25px;background:white;border:1px solid #d6deec;border-radius:14px}nav h2{margin:0;font-size:19px;border:0}nav ul{margin:8px 0;padding-left:20px}nav ul ul{display:none}pre{padding:18px;background:#e9edf7;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;font-size:14px}code{font-family:Consolas,monospace}img{width:100%;height:auto;margin:15px 0;border-radius:16px}table{width:100%;border-collapse:collapse;font-size:14px}td,th{border:1px solid #d6deec;padding:10px;text-align:left}th{background:#e9edf7}blockquote{border-left:4px solid #8b5cf6;margin:20px 0;padding:10px 20px;background:white}li{margin:5px 0}@media(max-width:600px){main{padding:20px 16px}h1{font-size:28px}}'''
    page=f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><style>{css}</style></head><body><main><nav aria-label="Table of contents"><h2>Contents</h2>{document.toc}</nav>{body}</main></body></html>'
    (ROOT/f'{stem}.html').write_text(page,encoding='utf-8')


def main():
    make_diagrams()
    for stem in ['PROJECT_GUIDE','PROJECT_HISTORY']:
        text=text_to_markdown((ROOT/f'{stem}.txt').read_text(encoding='utf-8'))
        if stem=='PROJECT_GUIDE':
            text=text.replace('## 6. Use The CSV Data', '## 6. Use The CSV Data\n\n![How CSV data reaches the app](docs/images/data-flow.svg)')
            text=text.replace('## 5. Switch Between The Two Views','## 5. Switch Between The Two Views\n\n![App owner and user views](docs/images/views.svg)')
        else:
            text=text.replace('## 1. Build The Original App', '![Development timeline](docs/images/iterations.svg)\n\n## 1. Build The Original App',1)
        (ROOT/f'{stem}.md').write_text(text,encoding='utf-8')
        export_html(stem,text)
    print('Built Markdown and portable HTML documents, with three SVG diagrams.')


if __name__=='__main__':
    main()
