# AuraFit CSV dashboard

AuraFit opens as the app owner. The top-right view menu switches between **App owner view** and **User view**, without login. **All five tabs remain available in both views.** The owner Dashboard shows the directory, totals, and CSV controls. The other tabs work with the selected person. User view provides their personal dashboard, timers, logs, rewards, and settings. CSV records seed the starting data; new progress is stored separately for each user in this browser. Six themes and the persistent coach remain available.

## The five tabs

| Tab | What you can do |
| --- | --- |
| **Dashboard** | Owner: inspect all users or a selected profile and manage CSV data. User: see daily goals, XP, streaks, completed fasts, recent activity, and add 250 ml of water quickly. |
| **Fasting Engine** | Choose a preset or custom 1–24 hour window; start a real timer, watch progress, and end the session. Completed targets earn 100 XP; early finishes are saved without XP. Timers survive tab changes and refreshes. |
| **Logger** | Save water, meals, or movement with notes. Filter or delete journal entries. Reaching the daily water goal awards 10 XP once per day. |
| **Rewards Shop** | View points and milestones, claim virtual rewards, and see locked items. Claims deduct available XP and cannot be repeated for the same reward. |
| **Profile** | Save your name, goals, default fasting duration, and coach preference. Export the complete profile as JSON or reset only the selected user's progress to the CSV baseline. |

CSV records contain summary counts, not individual historical sessions or meal entries. The fasting ledger and journal show your new detailed records. The original CSV active status does not automatically start a live timer. CSV reloads keep local sessions, logs, claims, and preferences and rebase changed starting values without discarding locally earned or spent XP. Download CSV exports the source file; Profile exports the complete local profile. Browser changes do not rewrite the CSV on disk or synchronize to another device.

Read [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for setup and everyday use, or [PROJECT_HISTORY.md](PROJECT_HISTORY.md) for plain-English development summaries. Both include headings and diagrams. Portable HTML copies open in a browser; TXT copies are also available.

## Run in Streamlit

After downloading and extracting the repository, install Python 3.12, open a terminal in the project folder, and run these Windows commands:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m streamlit run streamlit_app.py
```

Open **http://localhost:8501**. Use the sidebar to read the guide or history. The app's chat stays fixed inside the scrolling app panel. **Refresh source CSV** in the sidebar reads the file again and recreates that panel.

On macOS/Linux use `python3` to create the environment and `.venv/bin/python` in place of the Windows executable. Later runs only need the final Streamlit command. Stop the app with Ctrl+C in its terminal.

The bottom-right **Aura AI** companion supports chat, random motivation, and collapse/expand controls. Questions about hydration, movement, or progress use the selected user's CSV starting values and browser-saved changes. Conversations remain separate for each user during the page session. The agent uses preset responses without an external AI service. Its expanded dimensions remain 20% of the screen width and 300px high.

## Open immediately

Open `index.html` in a browser. The generated page embeds the three-user CSV snapshot, so it works offline without a server. After editing a CSV, click **Import CSV** to load the updated file. Imports affect the current page session; they do not overwrite the file on disk.

## Use the CSV as the data source

```sh
python app.py
```

Open **http://127.0.0.1:8000**. Requires Python 3.9+. On Windows, `py app.py` is also supported when the Python launcher is installed.

The app loads **data/users.csv** automatically through the Python server. Edit that file in a text editor or spreadsheet editor, save as UTF-8 CSV, and click **Reload CSV**. No database, account, external API, or authentication setup is needed. The CSV is read-only from the dashboard; update the file to change the recorded stats.

**Download CSV** exports the currently displayed dataset, including any imported changes. An import lasts until you reload the page or reload the source CSV. Reloading retains the selected user if their ID still exists; otherwise it returns to the overview. Malformed CSV is rejected without replacing the displayed dataset.

## CSV columns

One row represents one user's saved snapshot. Keep the header names unchanged. You can add more rows; each `user_id` must be unique.

| Columns | Meaning |
| --- | --- |
| `user_id`, `name`, `email`, `goal` | Identity and personal intention; email may be empty |
| `available_xp`, `lifetime_xp` | Available and total XP; available cannot exceed lifetime |
| `completed_fasts`, `streak_days` | Recorded completion count and streak |
| `water_ml`, `water_goal_ml` | Snapshot hydration and personal goal in ml |
| `activity_minutes`, `activity_goal_minutes` | Recorded movement and goal |
| `calories_kcal`, `meals_logged` | Recorded food intake and meal count |
| `fasting_status` | `active`, `completed`, or `idle` |
| `fast_target_hours`, `fast_elapsed_hours` | Target duration and recorded elapsed time; fractional hours are supported |
| `snapshot_date`, `joined_date` | Valid `YYYY-MM-DD` dates |
| `last_active` | ISO timestamp with timezone, such as `2026-10-12T09:30:00-04:00` |
| `mon_hours` through `sun_hours` | Saved Monday–Sunday fasting hours for the weekly chart |

All numeric fields must be nonnegative. XP, counts, hydration, calories, and movement use whole numbers. Water goals range from 250–10,000 ml, movement goals from 1–300 minutes, and fasting targets from 1–24 hours. Fields containing commas, quotes, or line breaks must use standard CSV quoting. Import supports UTF-8 BOM, LF/CRLF, and escaped quotes; files must be smaller than 2 MB.

Sample CSV records are fictional, dated October 12, 2026. Their recorded active status is historical starting data; new sessions started in Fasting Engine use live timestamps. Selecting a user does not alter their stats or last activity. The current app keeps per-user browser progress alongside the CSV; older storage keys from previous prototypes are left untouched.

## Active project structure

```text
app.py                    Builds the standalone page and serves local files
streamlit_app.py           Streamlit app and document sidebar
requirements.txt          Pinned Streamlit and Markdown dependencies
requirements-dev.txt      Optional browser test dependencies
data/users.csv            Three editable sample user snapshots
components/shell.html     Branding, owner identity, theme selector
components/csv-owner.js   Overview and selected-user dashboard
components/owner-coach.js Selected-user chat and motivation
utils/owner-state.js      Shared formatting and UI helpers
utils/state.js            Timer, XP, streak, and journal logic
utils/live-users.js       Independent per-user progress and CSV baselines
utils/csv.js              CSV parser, validation, import, and reload
utils/owner-app.js        Owner-only startup and selection handlers
utils/themes.js           Six saved color palettes
utils/styles.css          Responsive theme styles
utils/check.cjs           Test entry point
utils/check-csv.cjs       Owner, CSV, themes, and loading checks
index.html                Generated, self-contained preview
PROJECT_GUIDE.txt          Plain-English app and file guide
PROJECT_HISTORY.txt        User requests and iteration history
PROJECT_GUIDE.md/.html     User setup guide with two diagrams
PROJECT_HISTORY.md/.html   Formatted development history
docs/images/              SVG diagrams used in the guide
utils/build_documents.py  Builds formatted documents from TXT files
```

The original five tab components are loaded by the current build, together with the owner CSV dashboard. `utils/live-users.js` keeps per-user browser progress separate from the CSV baseline.

See the project guide for choosing views, using the chat, working with CSV files, and resolving common setup problems.
