# ScratchSense Study Setup

## Conditions

| Condition | URL | Panel visible |
|-----------|-----|---------------|
| Control | https://scratch.mit.edu | No |
| Treatment | http://localhost:8601 | Yes |

## Starting a session

```
cd packages/scratch-gui
ANTHROPIC_API_KEY=sk-... npm start
```

The dev server starts on port 8601. Open http://localhost:8601 in a full-screen browser window. The Quality Panel appears on the right side of the editor.

## Before handing the keyboard to a participant

1. Enter the participant ID (e.g. `P01`) in the **PID** field at the top of the Quality Panel.
2. Confirm the session timer reads `00:00` (or close to it). If not, click **Reset session** to restart.
3. Ensure the panel shows the blue banner: *"Enter a participant ID above before starting the session."* — this disappears once a PID is entered, confirming the ID was accepted.

## During the session

The session timer in the panel header increments in mm:ss. Use it to track the 25-minute task cutoff.

## Exporting the log

After the session ends (before the participant leaves the room):

1. Click **Export log** in the panel. This appears as soon as the first analysis has run.
2. A JSON file is downloaded as `findings_log_P01_YYYY-MM-DD.json`.
3. You can export multiple times — the log is not cleared on export.

The JSON contains: `participant_id`, `session_start`, `exported_at`, `total_dispatches`, and a `log` array. Each log entry records `timestamp_ms` (relative to session start), `wall_clock` (ISO string), `trigger` (`rule-based` or `llm`), and the full `findings` array at that dispatch.

## Resetting between participants

1. Export the log first.
2. Click **Reset session** and confirm the dialog.
3. This clears findings, the session log, and the participant ID field. It does **not** reload the page or affect the open project.
4. Load a fresh project (or reload the page) for the next participant, then enter the new PID.
