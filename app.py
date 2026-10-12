"""AuraFit: dependency-free local application and standalone preview builder."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent


def render_html(csv_text=None, embedded=False):
    template = (ROOT / "components" / "shell.html").read_text(encoding="utf-8")
    styles = (ROOT / "utils" / "styles.css").read_text(encoding="utf-8")
    sources = ["utils/owner-state.js", "utils/themes.js", "utils/csv.js",
               "components/csv-owner.js", "components/owner-coach.js", "utils/owner-app.js"]
    if csv_text is None:
        csv_text = (ROOT / "data" / "users.csv").read_text(encoding="utf-8-sig")
    bundled_csv = json.dumps(csv_text, ensure_ascii=True).replace("<", "\\u003c")
    script = f"const EMBEDDED_APP = {str(embedded).lower()};\nconst BUNDLED_USER_CSV = {bundled_csv};\n" + "\n".join(
        (ROOT / file).read_text(encoding="utf-8") for file in sources)
    return template.replace("{{STYLES}}", styles).replace("{{SCRIPT}}", script)


def build():
    output = ROOT / "index.html"
    output.write_text(render_html(), encoding="utf-8")
    return output


def main():
    parser = ArgumentParser(description="Run AuraFit locally")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--build", action="store_true", help="Only generate index.html")
    args = parser.parse_args()
    output = build()
    print(f"Built {output}", flush=True)
    if args.build:
        return
    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print(f"AuraFit is ready at http://127.0.0.1:{args.port} — Ctrl+C to stop", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
