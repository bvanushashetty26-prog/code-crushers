import json
import os
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

from flask import (
    Flask,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from werkzeug.utils import secure_filename

import ai_engine  # noqa: E402 — local module

# ---------------------------------------------------------------------------
# App configuration
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.config["DATABASE"] = os.path.join(app.root_path, "civicreport.db")
app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "static", "uploads")
app.config["ALLOWED_EXTENSIONS"] = {"png", "jpg", "jpeg", "gif", "webp"}
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db() -> sqlite3.Connection:
    """Return a per-request database connection stored on Flask's `g`."""
    if "db" not in g:
        g.db = sqlite3.connect(
            app.config["DATABASE"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create all tables if they do not already exist."""
    db = get_db()
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS reports (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_id     TEXT    NOT NULL UNIQUE,          -- e.g. CIV-1001
            title           TEXT    NOT NULL,
            description     TEXT,
            summary         TEXT,
            category        TEXT,
            latitude        REAL,
            longitude       REAL,
            address         TEXT,
            image_path      TEXT,
            priority_score  INTEGER DEFAULT 0
                            CHECK (priority_score BETWEEN 0 AND 100),
            priority_level  TEXT    DEFAULT 'Low'
                            CHECK (priority_level IN ('Low','Medium','High','Critical')),
            priority_reason TEXT,                             -- JSON text of factors
            duplicate_of    INTEGER REFERENCES reports(id),  -- nullable
            duplicate_count INTEGER DEFAULT 0,
            cluster_id      TEXT,
            status          TEXT    NOT NULL DEFAULT 'Submitted'
                            CHECK (status IN (
                                'Submitted','Under Review','Assigned',
                                'In Progress','Resolved'
                            )),
            assigned_to     TEXT,
            created_at      TEXT    NOT NULL,
            updated_at      TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS status_history (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
            status    TEXT    NOT NULL,
            note      TEXT,
            timestamp TEXT    NOT NULL
        );
        """
    )
    db.commit()


# Initialise the database when the application context is first pushed.
with app.app_context():
    init_db()

# ---------------------------------------------------------------------------
# Upload helper
# ---------------------------------------------------------------------------

def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]
    )


def save_upload(file_storage) -> str | None:
    """
    Validate and save an uploaded file to UPLOAD_FOLDER.
    Returns the relative path suitable for storing in the DB, or None.
    """
    if file_storage and file_storage.filename and allowed_file(file_storage.filename):
        ext = file_storage.filename.rsplit(".", 1)[1].lower()
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        safe_name = secure_filename(unique_name)
        dest = os.path.join(app.config["UPLOAD_FOLDER"], safe_name)
        file_storage.save(dest)
        return f"uploads/{safe_name}"   # relative to static/
    return None

# ---------------------------------------------------------------------------
# Tracking-ID generator
# ---------------------------------------------------------------------------

def next_tracking_id(db: sqlite3.Connection) -> str:
    """Return the next CIV-XXXX tracking id."""
    row = db.execute("SELECT MAX(id) AS max_id FROM reports").fetchone()
    next_num = (row["max_id"] or 1000) + 1
    return f"CIV-{next_num}"

# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/report", methods=["GET", "POST"])
def report():
    if request.method == "GET":
        return render_template("report.html")

    # --- POST: submit a new report ---
    db = get_db()
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    tracking_id = next_tracking_id(db)

    image_path = save_upload(request.files.get("image"))

    db.execute(
        """
        INSERT INTO reports (
            tracking_id, title, description, category,
            latitude, longitude, address, image_path,
            status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)
        """,
        (
            tracking_id,
            request.form.get("title", "").strip(),
            request.form.get("description", "").strip(),
            request.form.get("category", "").strip(),
            request.form.get("latitude") or None,
            request.form.get("longitude") or None,
            request.form.get("address", "").strip(),
            image_path,
            now,
            now,
        ),
    )
    report_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

    db.execute(
        "INSERT INTO status_history (report_id, status, note, timestamp) VALUES (?, ?, ?, ?)",
        (report_id, "Submitted", "Report submitted by citizen.", now),
    )
    db.commit()

    return redirect(url_for("track", tracking_id=tracking_id))


@app.route("/track")
@app.route("/track/<tracking_id>")
def track(tracking_id: str = None):
    # Template is fully client-side; JS reads the URL path and calls GET /api/reports/<id>.
    return render_template("track.html")


@app.route("/admin")
def admin():
    # Template is fully client-side; no server-side data needed.
    return render_template("admin.html")


# ---------------------------------------------------------------------------
# Helpers shared by API endpoints
# ---------------------------------------------------------------------------

_VALID_STATUSES = ("Submitted", "Under Review", "Assigned", "In Progress", "Resolved")
_VALID_LEVELS   = ("Low", "Medium", "High", "Critical")
_VALID_CATS     = (
    "Waterlogging", "Road Damage", "Garbage",
    "Streetlight", "Drainage", "Water Supply",
)


def _row_to_dict(row: sqlite3.Row) -> dict:
    """Convert a sqlite3.Row to a plain dict (JSON-serialisable)."""
    return dict(row)


def _run_ai_pipeline(description: str, title: str, category: str | None,
                     latitude: float | None, longitude: float | None,
                     db: sqlite3.Connection) -> dict:
    """
    Run categorize → summarize → score_priority → find_duplicates.
    Returns a dict of AI-derived fields ready to merge into the INSERT.
    """
    full_text = f"{title} {description}".strip()

    # 1. Category (use submitted one if provided and valid, else infer)
    if category and category in _VALID_CATS:
        final_cat = category
        cat_confidence = 1.0
        cat_method = "user-provided"
    else:
        cat_result = ai_engine.categorize(full_text)
        final_cat = cat_result["category"]
        cat_confidence = cat_result["confidence"]
        cat_method = cat_result["method"]

    # 2. Summary
    summary = ai_engine.summarize(full_text)

    # 3. Priority scoring (no duplicates yet — report not inserted)
    temp_report = {
        "title": title,
        "description": description,
        "summary": summary,
        "category": final_cat,
        "duplicate_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    priority = ai_engine.score_priority(temp_report)

    # 4. Duplicate detection against existing open reports
    existing_rows = db.execute(
        """SELECT id, tracking_id, title, description, summary,
                  category, latitude, longitude
           FROM reports
           WHERE status != 'Resolved'
           ORDER BY created_at DESC
           LIMIT 200"""
    ).fetchall()
    existing = [_row_to_dict(r) for r in existing_rows]

    new_for_dup = {
        "title": title,
        "description": description,
        "category": final_cat,
        "latitude": latitude,
        "longitude": longitude,
    }
    dup_result = ai_engine.find_duplicates(new_for_dup, existing)

    return {
        "category":       final_cat,
        "summary":        summary,
        "priority_score": priority["score"],
        "priority_level": priority["level"],
        "priority_reason": json.dumps(priority["factors"]),
        "dup_result":     dup_result,
    }


def _api_error(message: str, status: int = 400) -> tuple:
    return jsonify({"error": message}), status


# ---------------------------------------------------------------------------
# API: POST /api/reports
# ---------------------------------------------------------------------------

@app.route("/api/reports", methods=["POST"])
def api_create_report():
    """
    Submit a new civic report via JSON-returning endpoint.

    Multipart form fields
    ---------------------
    description  (required)
    title        (optional — inferred from first 60 chars of description)
    category     (optional — AI-inferred if omitted)
    latitude     (optional float)
    longitude    (optional float)
    address      (optional)
    image        (optional file)
    """
    description = (request.form.get("description") or "").strip()
    if not description:
        return _api_error("'description' is required.")

    title = (request.form.get("title") or "").strip()
    if not title:
        # Auto-derive a title from the first sentence / 60 chars
        title = description.split(".")[0].strip()[:60] or description[:60]

    category = (request.form.get("category") or "").strip() or None
    if category and category not in _VALID_CATS:
        return _api_error(
            f"Invalid category '{category}'. "
            f"Choose from: {', '.join(_VALID_CATS)}."
        )

    try:
        latitude  = float(request.form["latitude"])  if request.form.get("latitude")  else None
        longitude = float(request.form["longitude"]) if request.form.get("longitude") else None
    except ValueError:
        return _api_error("'latitude' and 'longitude' must be numeric.")

    if (latitude is None) != (longitude is None):
        return _api_error("Provide both 'latitude' and 'longitude', or neither.")

    address = (request.form.get("address") or "").strip() or None

    db  = get_db()
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    tracking_id = next_tracking_id(db)
    image_path  = save_upload(request.files.get("image"))

    # Run AI pipeline
    ai = _run_ai_pipeline(description, title, category, latitude, longitude, db)

    dup_result  = ai.pop("dup_result")
    duplicate_of = None
    if dup_result:
        duplicate_of = dup_result["match_id"]

    db.execute(
        """
        INSERT INTO reports (
            tracking_id, title, description, summary, category,
            latitude, longitude, address, image_path,
            priority_score, priority_level, priority_reason,
            duplicate_of, status, created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'Submitted',?,?)
        """,
        (
            tracking_id, title, description, ai["summary"], ai["category"],
            latitude, longitude, address, image_path,
            ai["priority_score"], ai["priority_level"], ai["priority_reason"],
            duplicate_of, now, now,
        ),
    )
    report_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

    # Increment duplicate_count on primary if this is a duplicate
    if duplicate_of:
        db.execute(
            "UPDATE reports SET duplicate_count = duplicate_count + 1 WHERE id = ?",
            (duplicate_of,),
        )

    db.execute(
        "INSERT INTO status_history (report_id, status, note, timestamp) VALUES (?,?,?,?)",
        (report_id, "Submitted", "Report submitted via API.", now),
    )
    db.commit()

    dup_tracking_id = dup_result["match_tracking_id"] if dup_result else None
    dup_message = dup_result["reason"] if dup_result else None

    return jsonify({
        "tracking_id":      tracking_id,
        "category":         ai["category"],
        "summary":          ai["summary"],
        "priority_score":   ai["priority_score"],
        "priority_level":   ai["priority_level"],
        "priority_factors": json.loads(ai["priority_reason"]),
        "duplicate_of":     dup_tracking_id,
        "duplicate_message": dup_message,
    }), 201


# ---------------------------------------------------------------------------
# API: GET /api/reports
# ---------------------------------------------------------------------------

@app.route("/api/reports", methods=["GET"])
def api_list_reports():
    """
    List reports with optional filters.

    Query params
    ------------
    status    — one of the 5 valid statuses
    category  — one of the 6 valid categories
    priority  — Low | Medium | High | Critical
    limit     — default 50, max 200
    offset    — default 0
    """
    status   = request.args.get("status")
    category = request.args.get("category")
    priority = request.args.get("priority")
    try:
        limit  = min(int(request.args.get("limit",  50)),  200)
        offset = max(int(request.args.get("offset",  0)),    0)
    except ValueError:
        return _api_error("'limit' and 'offset' must be integers.")

    if status   and status   not in _VALID_STATUSES:
        return _api_error(f"Invalid status '{status}'.")
    if category and category not in _VALID_CATS:
        return _api_error(f"Invalid category '{category}'.")
    if priority and priority not in _VALID_LEVELS:
        return _api_error(f"Invalid priority '{priority}'.")

    clauses, params = [], []
    if status:
        clauses.append("status = ?");        params.append(status)
    if category:
        clauses.append("category = ?");      params.append(category)
    if priority:
        clauses.append("priority_level = ?"); params.append(priority)

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    params += [limit, offset]

    db = get_db()
    rows = db.execute(
        f"SELECT * FROM reports {where} ORDER BY priority_score DESC, created_at DESC LIMIT ? OFFSET ?",
        params,
    ).fetchall()

    total = db.execute(
        f"SELECT COUNT(*) AS n FROM reports {where}",
        params[:-2] if params[:-2] else [],
    ).fetchone()["n"]

    return jsonify({
        "total":   total,
        "limit":   limit,
        "offset":  offset,
        "reports": [_row_to_dict(r) for r in rows],
    })


# ---------------------------------------------------------------------------
# API: GET /api/reports/<tracking_id>
# ---------------------------------------------------------------------------

@app.route("/api/reports/<tracking_id>", methods=["GET"])
def api_get_report(tracking_id: str):
    """Return full report details plus status_history."""
    db = get_db()
    row = db.execute(
        "SELECT * FROM reports WHERE tracking_id = ?", (tracking_id,)
    ).fetchone()
    if not row:
        return _api_error(f"Report '{tracking_id}' not found.", 404)

    report = _row_to_dict(row)

    # Deserialise priority_reason JSON string
    if report.get("priority_reason"):
        try:
            report["priority_reason"] = json.loads(report["priority_reason"])
        except (ValueError, TypeError):
            pass

    history = db.execute(
        "SELECT id, status, note, timestamp FROM status_history "
        "WHERE report_id = ? ORDER BY timestamp ASC",
        (row["id"],),
    ).fetchall()
    report["status_history"] = [_row_to_dict(h) for h in history]

    # Resolve duplicate_of to its tracking_id for readability
    if report.get("duplicate_of"):
        dup_row = db.execute(
            "SELECT tracking_id FROM reports WHERE id = ?",
            (report["duplicate_of"],),
        ).fetchone()
        report["duplicate_of_tracking_id"] = dup_row["tracking_id"] if dup_row else None

    return jsonify(report)


# ---------------------------------------------------------------------------
# API: PUT /api/reports/<id>/status
# ---------------------------------------------------------------------------

@app.route("/api/reports/<int:report_id>/status", methods=["PUT"])
def api_update_status(report_id: int):
    """
    Update the status of a report.

    JSON body
    ---------
    { "status": "...", "assigned_to": "...", "note": "..." }
    status is required; assigned_to and note are optional.
    """
    data = request.get_json(silent=True)
    if not data:
        return _api_error("Request body must be JSON.")

    new_status = (data.get("status") or "").strip()
    if not new_status:
        return _api_error("'status' is required.")
    if new_status not in _VALID_STATUSES:
        return _api_error(
            f"Invalid status '{new_status}'. "
            f"Choose from: {', '.join(_VALID_STATUSES)}."
        )

    assigned_to = (data.get("assigned_to") or "").strip() or None
    note        = (data.get("note") or "").strip() or None

    db = get_db()
    row = db.execute("SELECT id FROM reports WHERE id = ?", (report_id,)).fetchone()
    if not row:
        return _api_error(f"Report with id={report_id} not found.", 404)

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    update_fields = ["status = ?", "updated_at = ?"]
    update_params = [new_status, now]
    if assigned_to is not None:
        update_fields.append("assigned_to = ?")
        update_params.append(assigned_to)

    update_params.append(report_id)
    db.execute(
        f"UPDATE reports SET {', '.join(update_fields)} WHERE id = ?",
        update_params,
    )
    db.execute(
        "INSERT INTO status_history (report_id, status, note, timestamp) VALUES (?,?,?,?)",
        (report_id, new_status, note, now),
    )
    db.commit()

    updated = _row_to_dict(
        db.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
    )
    return jsonify({"message": "Status updated.", "report": updated})


# ---------------------------------------------------------------------------
# API: GET /api/hotspots
# ---------------------------------------------------------------------------

@app.route("/api/hotspots", methods=["GET"])
def api_hotspots():
    """
    Return geographic hotspot clusters detected by ai_engine.detect_hotspots.

    Query params
    ------------
    status  — filter source reports by status before clustering (default: all open)
    """
    status_filter = request.args.get("status")
    db = get_db()

    if status_filter and status_filter not in _VALID_STATUSES:
        return _api_error(f"Invalid status '{status_filter}'.")

    if status_filter:
        rows = db.execute(
            "SELECT * FROM reports WHERE status = ?", (status_filter,)
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM reports WHERE status != 'Resolved'"
        ).fetchall()

    reports = [_row_to_dict(r) for r in rows]
    clusters = ai_engine.detect_hotspots(reports)
    return jsonify({"cluster_count": len(clusters), "clusters": clusters})


# ---------------------------------------------------------------------------
# API: GET /api/stats
# ---------------------------------------------------------------------------

@app.route("/api/stats", methods=["GET"])
def api_stats():
    """
    Dashboard statistics:
      - total reports, open count, resolved count
      - breakdown by category and by status
      - top 5 priority reports (unresolved)
      - 7-day submission trend (count per day)
    """
    db = get_db()

    # Totals
    total     = db.execute("SELECT COUNT(*) AS n FROM reports").fetchone()["n"]
    open_cnt  = db.execute("SELECT COUNT(*) AS n FROM reports WHERE status != 'Resolved'").fetchone()["n"]
    resolved  = db.execute("SELECT COUNT(*) AS n FROM reports WHERE status = 'Resolved'").fetchone()["n"]

    # By category
    by_cat = {
        row["category"]: row["n"]
        for row in db.execute(
            "SELECT category, COUNT(*) AS n FROM reports GROUP BY category"
        ).fetchall()
    }

    # By status
    by_status = {
        row["status"]: row["n"]
        for row in db.execute(
            "SELECT status, COUNT(*) AS n FROM reports GROUP BY status"
        ).fetchall()
    }

    # By priority level
    by_priority = {
        row["priority_level"]: row["n"]
        for row in db.execute(
            "SELECT priority_level, COUNT(*) AS n FROM reports GROUP BY priority_level"
        ).fetchall()
    }

    # Top 5 priority (unresolved)
    top5 = [
        _row_to_dict(r)
        for r in db.execute(
            """SELECT id, tracking_id, title, category, priority_score,
                      priority_level, status, address
               FROM reports
               WHERE status != 'Resolved'
               ORDER BY priority_score DESC
               LIMIT 5"""
        ).fetchall()
    ]

    # 7-day submission trend
    today = datetime.now(timezone.utc).date()
    trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.isoformat()          # "YYYY-MM-DD"
        cnt = db.execute(
            "SELECT COUNT(*) AS n FROM reports WHERE created_at LIKE ?",
            (f"{day_str}%",),
        ).fetchone()["n"]
        trend.append({"date": day_str, "count": cnt})

    return jsonify({
        "total":          total,
        "open":           open_cnt,
        "resolved":       resolved,
        "by_category":    by_cat,
        "by_status":      by_status,
        "by_priority":    by_priority,
        "top_priority":   top5,
        "trend_7_days":   trend,
    })


# ---------------------------------------------------------------------------
# API: GET /api/brief
# ---------------------------------------------------------------------------

@app.route("/api/brief", methods=["GET"])
def api_brief():
    """
    Return rule-based action briefs for:
      - the top 3 highest-priority unresolved reports
      - any hotspot clusters detected across all open reports

    Query params
    ------------
    top_n  — number of individual report briefs (default 3, max 10)
    """
    try:
        top_n = min(int(request.args.get("top_n", 3)), 10)
    except ValueError:
        return _api_error("'top_n' must be an integer.")

    db = get_db()

    top_rows = db.execute(
        """SELECT * FROM reports
           WHERE status != 'Resolved'
           ORDER BY priority_score DESC
           LIMIT ?""",
        (top_n,),
    ).fetchall()

    report_briefs = []
    for row in top_rows:
        r = _row_to_dict(row)
        report_briefs.append({
            "tracking_id":   r["tracking_id"],
            "priority_score": r["priority_score"],
            "priority_level": r["priority_level"],
            "brief":         ai_engine.generate_action_brief(r),
        })

    # Hotspot briefs
    all_open = [
        _row_to_dict(r)
        for r in db.execute(
            "SELECT * FROM reports WHERE status != 'Resolved'"
        ).fetchall()
    ]
    clusters = ai_engine.detect_hotspots(all_open)

    hotspot_briefs = [
        {
            "cluster_id": c["cluster_id"],
            "count":      c["count"],
            "brief":      ai_engine.generate_action_brief(c),
        }
        for c in clusters
    ]

    return jsonify({
        "report_briefs":  report_briefs,
        "hotspot_briefs": hotspot_briefs,
    })


# ---------------------------------------------------------------------------
# Generic JSON 404 / 405 handlers (API paths only)
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Endpoint not found."}), 404
    return e


@app.errorhandler(405)
def method_not_allowed(e):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Method not allowed."}), 405
    return e


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)
