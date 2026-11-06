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
            duplicate_count INTEGER DEFAULT 0,               -- AI-detected duplicates
            metoo_count     INTEGER DEFAULT 0,               -- citizen "Me Too" upvotes
            cluster_id      TEXT,
            status          TEXT    NOT NULL DEFAULT 'Submitted'
                            CHECK (status IN (
                                'Submitted','Under Review','Assigned',
                                'In Progress','Resolved',
                                'Resolved—Awaiting Verification','Closed',
                                'Rejected','Duplicate'
                            )),
            assigned_to     TEXT,
            submitted_by    TEXT,
            is_demo         INTEGER DEFAULT 0,
            created_at      TEXT    NOT NULL,
            updated_at      TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS status_history (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id    INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
            status       TEXT    NOT NULL,
            note         TEXT,
            changed_by   TEXT,
            evidence_note TEXT,
            timestamp    TEXT    NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT    NOT NULL UNIQUE,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            role          TEXT    NOT NULL DEFAULT 'resident'
                          CHECK (role IN ('resident','reviewer','staff','admin')),
            created_at    TEXT    NOT NULL,
            is_active     INTEGER DEFAULT 1
        );
        """
    )
    db.commit()


# Initialise the database when the application context is first pushed.
with app.app_context():
    init_db()
    # Migration: add metoo_count column to existing databases that pre-date Feature 1.
    with app.app_context():
        _mig_db = get_db()
        try:
            _mig_db.execute("ALTER TABLE reports ADD COLUMN metoo_count INTEGER DEFAULT 0")
            _mig_db.commit()
        except Exception:
            pass  # column already exists — safe to ignore
    # Migration: add submitted_by and is_demo columns to reports (Sub-Task 1).
    with app.app_context():
        _mig_db = get_db()
        try:
            _mig_db.execute("ALTER TABLE reports ADD COLUMN submitted_by TEXT")
            _mig_db.commit()
        except Exception:
            pass  # column already exists — safe to ignore
        try:
            _mig_db.execute("ALTER TABLE reports ADD COLUMN is_demo INTEGER DEFAULT 0")
            _mig_db.commit()
        except Exception:
            pass  # column already exists — safe to ignore
    # Migration: add changed_by and evidence_note columns to status_history (Sub-Task 1).
    with app.app_context():
        _mig_db = get_db()
        try:
            _mig_db.execute("ALTER TABLE status_history ADD COLUMN changed_by TEXT")
            _mig_db.commit()
        except Exception:
            pass  # column already exists — safe to ignore
        try:
            _mig_db.execute("ALTER TABLE status_history ADD COLUMN evidence_note TEXT")
            _mig_db.commit()
        except Exception:
            pass  # column already exists — safe to ignore

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

_VALID_STATUSES = (
    "Submitted",
    "Under Review",
    "Assigned",
    "In Progress",
    "Resolved",
    "Resolved—Awaiting Verification",
    "Closed",
    "Rejected",
    "Duplicate",
)
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
# API: POST /api/reports/<tracking_id>/metoo  (Feature 1 – "Me Too" upvote)
# ---------------------------------------------------------------------------

@app.route("/api/reports/<tracking_id>/metoo", methods=["POST"])
def api_metoo(tracking_id: str):
    """
    Increment the 'Me Too' counter on a report (or its primary if it is a duplicate).

    Citizens use this to indicate they are experiencing the same issue without
    filing a full duplicate report.

    Behaviour
    ---------
    - If the target report is itself a duplicate, the upvote is credited to its
      primary (duplicate_of) so all votes accumulate on one canonical record.
    - Returns the updated metoo_count and the canonical tracking_id.
    - Rate-limiting (by IP) is intentionally left to the deployment proxy;
      the demo keeps it simple.
    """
    db = get_db()

    # Resolve the tracking_id to a row
    row = db.execute(
        "SELECT id, tracking_id, duplicate_of, metoo_count FROM reports WHERE tracking_id = ?",
        (tracking_id,),
    ).fetchone()
    if not row:
        return _api_error(f"Report '{tracking_id}' not found.", 404)

    # If this report is a known duplicate, credit the primary instead
    target_id = row["duplicate_of"] if row["duplicate_of"] else row["id"]
    canonical_row = db.execute(
        "SELECT id, tracking_id, metoo_count FROM reports WHERE id = ?",
        (target_id,),
    ).fetchone()
    if not canonical_row:
        # Fallback: primary was deleted, use self
        canonical_row = row
        target_id = row["id"]

    db.execute(
        "UPDATE reports SET metoo_count = metoo_count + 1, updated_at = ? WHERE id = ?",
        (datetime.now(timezone.utc).isoformat(timespec="seconds"), target_id),
    )
    db.commit()

    new_count = canonical_row["metoo_count"] + 1
    return jsonify({
        "canonical_tracking_id": canonical_row["tracking_id"],
        "metoo_count": new_count,
    })


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
# Page route: /explore
# ---------------------------------------------------------------------------

@app.route("/explore")
def explore():
    return render_template("explore.html")


# ---------------------------------------------------------------------------
# API: GET /api/reports/search  (public explore / search)
# ---------------------------------------------------------------------------

@app.route("/api/reports/search", methods=["GET"])
def api_search_reports():
    """
    Public search endpoint — returns a stripped-down list (no private fields).

    Query params
    ------------
    q         — free-text search (title / description / address)
    status    — filter by status
    category  — filter by category
    priority  — filter by priority level
    date_from — ISO date string (YYYY-MM-DD), inclusive
    date_to   — ISO date string (YYYY-MM-DD), inclusive
    limit     — default 50, max 200
    offset    — default 0
    """
    q         = (request.args.get("q") or "").strip()
    status    = request.args.get("status")
    category  = request.args.get("category")
    priority  = request.args.get("priority")
    date_from = request.args.get("date_from")
    date_to   = request.args.get("date_to")
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
    if q:
        clauses.append("(title LIKE ? OR description LIKE ? OR address LIKE ?)")
        params += [f"%{q}%", f"%{q}%", f"%{q}%"]
    if status:
        clauses.append("status = ?");         params.append(status)
    if category:
        clauses.append("category = ?");       params.append(category)
    if priority:
        clauses.append("priority_level = ?"); params.append(priority)
    if date_from:
        clauses.append("created_at >= ?");    params.append(date_from)
    if date_to:
        clauses.append("created_at <= ?");    params.append(date_to + "T23:59:59")

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    count_params = list(params)
    params += [limit, offset]

    db = get_db()
    rows = db.execute(
        f"""SELECT id, tracking_id, title, summary, category,
                   latitude, longitude, address,
                   priority_score, priority_level, status,
                   metoo_count, duplicate_count, is_demo,
                   created_at, updated_at
            FROM reports {where}
            ORDER BY priority_score DESC, created_at DESC
            LIMIT ? OFFSET ?""",
        params,
    ).fetchall()

    total = db.execute(
        f"SELECT COUNT(*) AS n FROM reports {where}",
        count_params,
    ).fetchone()["n"]

    return jsonify({
        "total":   total,
        "limit":   limit,
        "offset":  offset,
        "reports": [_row_to_dict(r) for r in rows],
    })


# ---------------------------------------------------------------------------
# API: POST /api/reports/<tracking_id>/verify  (resident confirms fix)
# ---------------------------------------------------------------------------

@app.route("/api/reports/<tracking_id>/verify", methods=["POST"])
def api_verify_report(tracking_id: str):
    """
    Resident confirms or disputes a resolved report.

    JSON body: { "confirmed": true|false, "note": "..." }
    """
    db = get_db()
    row = db.execute(
        "SELECT id, status FROM reports WHERE tracking_id = ?", (tracking_id,)
    ).fetchone()
    if not row:
        return _api_error(f"Report '{tracking_id}' not found.", 404)

    data = request.get_json(silent=True) or {}
    confirmed = data.get("confirmed")
    if confirmed is None:
        return _api_error("'confirmed' (boolean) is required.")

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    if confirmed:
        new_status = "Closed"
        note = (data.get("note") or "").strip() or "Resident confirmed the issue is resolved."
    else:
        new_status = "In Progress"
        note = (data.get("note") or "").strip() or "Resident reported the fix did not work — reopened."

    db.execute(
        "UPDATE reports SET status = ?, updated_at = ? WHERE id = ?",
        (new_status, now, row["id"]),
    )
    db.execute(
        "INSERT INTO status_history (report_id, status, note, changed_by, timestamp) VALUES (?,?,?,?,?)",
        (row["id"], new_status, note, "resident", now),
    )
    db.commit()

    return jsonify({"tracking_id": tracking_id, "new_status": new_status, "note": note})


# ---------------------------------------------------------------------------
# API: POST /api/chat  (rule-based chatbot — no external AI key needed)
# ---------------------------------------------------------------------------

_CHAT_FAQ = {
    "submit": (
        "To submit a report, click **Report an Issue** in the navigation. "
        "Describe the problem clearly (location, severity, how long it's been there), "
        "choose a category (or let AI detect it), optionally add a photo and pin the location, "
        "then tap **Submit Report**. You'll receive a tracking ID like CIV-1042."
    ),
    "track": (
        "To track a report, go to the **Track** page and enter your tracking ID "
        "(e.g. CIV-1042). You'll see the current status, full history, and who it is assigned to."
    ),
    "status.Submitted": (
        "**Submitted** means your report has been received and is waiting to be reviewed by staff."
    ),
    "status.Under Review": (
        "**Under Review** means a staff member is examining your report — checking its details, "
        "category, priority, and whether it duplicates an existing issue."
    ),
    "status.Assigned": (
        "**Assigned** means the report has been allocated to a specific team or officer who will address it."
    ),
    "status.In Progress": (
        "**In Progress** means work to fix the problem has started."
    ),
    "status.Resolved": (
        "**Resolved — Awaiting Verification** means the fix has been applied. "
        "You can confirm on the Track page whether the issue is actually fixed."
    ),
    "status.Closed": (
        "**Closed** means the issue has been resolved and a resident confirmed it. "
        "No further action is needed."
    ),
    "status.Rejected": (
        "**Rejected** means the report could not be processed — it may be out of scope, "
        "unclear, or already covered by another report."
    ),
    "status.Duplicate": (
        "**Duplicate** means a similar issue was already reported. "
        "Your Me Too vote has been counted on the primary report."
    ),
    "photo": (
        "Photos are optional but very helpful. Accepted formats: JPG, PNG, GIF, WebP. "
        "Location metadata (GPS EXIF) is stripped before storage for your privacy."
    ),
    "location": (
        "Location is optional. If you share it, only a general area is shown publicly — "
        "your exact pin is never exposed. You can also type an address instead of pinning."
    ),
    "privacy": (
        "CivicReport keeps your email and contact details private. "
        "Location data is only used to help route your report to the right team "
        "and to identify hotspot areas. Report text is stored in its original language."
    ),
    "categories": (
        "Available categories: Waterlogging, Road Damage, Garbage, Streetlight, Drainage, Water Supply. "
        "Leave the category on **Auto-detect** and the AI will classify it for you."
    ),
    "priority": (
        "Priority is automatically scored (Low / Medium / High / Critical) based on safety risk, "
        "category urgency, description severity, duplicate count, and how long the issue has been open."
    ),
    "contact": (
        "To contact staff directly, you can add a note to your report or ask the admin team "
        "for assistance. For emergencies, please call the city helpline."
    ),
    "languages": (
        "CivicReport supports English, हिन्दी (Hindi), বাংলা (Bengali), "
        "தமிழ் (Tamil), తెలుగు (Telugu), मराठी (Marathi), and ಕನ್ನಡ (Kannada). "
        "Use the language selector in the top-right corner to switch."
    ),
}

_CHAT_INTENTS = [
    (["how to submit", "how do i report", "how to report", "submit a report",
      "report an issue", "create a report", "file a report", "new report"], "submit"),
    (["track", "tracking id", "check status", "find my report", "where is my report",
      "status of my report"], "track"),
    (["submitted", "what does submitted mean"], "status.Submitted"),
    (["under review", "reviewing", "what does under review mean"], "status.Under Review"),
    (["assigned", "what does assigned mean"], "status.Assigned"),
    (["in progress", "being fixed", "what does in progress mean"], "status.In Progress"),
    (["resolved", "awaiting verification", "what does resolved mean"], "status.Resolved"),
    (["closed", "what does closed mean"], "status.Closed"),
    (["rejected", "what does rejected mean"], "status.Rejected"),
    (["duplicate", "what does duplicate mean"], "status.Duplicate"),
    (["photo", "image", "picture", "upload"], "photo"),
    (["location", "map", "gps", "pin", "address"], "location"),
    (["privacy", "data", "personal information", "private"], "privacy"),
    (["categories", "category", "types of issues", "what can i report"], "categories"),
    (["priority", "score", "urgent", "critical", "high priority"], "priority"),
    (["contact", "speak to someone", "call", "help", "staff"], "contact"),
    (["language", "hindi", "bengali", "tamil", "telugu", "marathi", "kannada"], "languages"),
]


def _chat_intent(text: str) -> str | None:
    lower = text.lower()
    for phrases, intent in _CHAT_INTENTS:
        for phrase in phrases:
            if phrase in lower:
                return intent
    return None


def _chat_lookup_report(tracking_id_raw: str, db) -> dict | None:
    """Return public fields for a report by tracking ID."""
    tid = tracking_id_raw.strip().upper()
    row = db.execute(
        """SELECT tracking_id, title, summary, category, status,
                  priority_level, assigned_to, created_at, updated_at
           FROM reports WHERE tracking_id = ?""", (tid,)
    ).fetchone()
    if not row:
        return None
    history = db.execute(
        "SELECT status, note, timestamp FROM status_history WHERE report_id = "
        "(SELECT id FROM reports WHERE tracking_id = ?) ORDER BY timestamp DESC LIMIT 3",
        (tid,),
    ).fetchall()
    return {
        "tracking_id": row["tracking_id"],
        "title":       row["title"],
        "summary":     row["summary"],
        "category":    row["category"],
        "status":      row["status"],
        "priority":    row["priority_level"],
        "assigned_to": row["assigned_to"],
        "created_at":  row["created_at"],
        "updated_at":  row["updated_at"],
        "recent_history": [dict(h) for h in history],
    }


@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    Rule-based chatbot. Responds to help questions, FAQ, and report lookups.

    JSON body: { "message": "...", "session": [] }
    Returns:   { "reply": "...", "report": null|{...}, "suggestions": [...] }
    """
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return _api_error("'message' is required.")
    if len(message) > 500:
        return _api_error("Message too long (max 500 chars).")

    db = get_db()

    # Check if message looks like a tracking ID
    import re
    tid_match = re.search(r'\bCIV-\d+\b', message.upper())
    if tid_match:
        tid = tid_match.group(0)
        report_data = _chat_lookup_report(tid, db)
        if report_data:
            hist = report_data["recent_history"]
            hist_text = ""
            if hist:
                hist_text = "\n\nRecent updates:\n" + "\n".join(
                    f"• {h['status']}: {h['note'] or '(no note)'} — {h['timestamp'][:10]}"
                    for h in hist
                )
            reply = (
                f"Here's what I found for **{tid}**:\n\n"
                f"**{report_data['title']}**\n"
                f"Category: {report_data['category']}\n"
                f"Status: **{report_data['status']}**\n"
                f"Priority: {report_data['priority']}\n"
                f"Assigned to: {report_data['assigned_to'] or 'Not yet assigned'}\n"
                f"Submitted: {report_data['created_at'][:10]}"
                f"{hist_text}"
            )
            return jsonify({
                "reply": reply,
                "report": report_data,
                "suggestions": ["How do I track my report?", "What does this status mean?", "Contact staff"],
            })
        else:
            return jsonify({
                "reply": f"I couldn't find a report with ID **{tid}**. Please check the ID and try again. Tracking IDs look like CIV-1042.",
                "report": None,
                "suggestions": ["How do I submit a report?", "How do I track a report?"],
            })

    # Check for draft-report intent
    draft_keywords = ["help me report", "want to report", "draft a report", "help me submit",
                      "i want to file", "i need to report"]
    lower = message.lower()
    if any(k in lower for k in draft_keywords):
        return jsonify({
            "reply": (
                "I'll help you draft a report! Please tell me:\n\n"
                "1. **What is the problem?** (e.g. broken streetlight, pothole, garbage overflow)\n"
                "2. **Where is it?** (street name, landmark, area)\n"
                "3. **How severe is it?** (minor inconvenience / dangerous / blocking road)\n"
                "4. **How long has it been there?**\n\n"
                "Once you give me those details, I'll show you a draft and you can confirm before submitting."
            ),
            "report": None,
            "suggestions": ["There's a pothole on MG Road near Sector 7", "Broken streetlight at Gandhi Chowk", "Overflowing garbage bin near the park"],
        })

    # Match FAQ intent
    intent = _chat_intent(message)
    if intent and intent in _CHAT_FAQ:
        reply = _CHAT_FAQ[intent]
        suggestions = {
            "submit":             ["How do I track my report?", "What categories are available?", "Is my location kept private?"],
            "track":              ["What does 'Under Review' mean?", "How do I submit a report?"],
            "status.Submitted":   ["What does Under Review mean?", "How do I track my report?"],
            "status.Under Review":["What does Assigned mean?", "How long does review take?"],
            "status.Assigned":    ["What does In Progress mean?"],
            "status.In Progress": ["What does Resolved mean?"],
            "status.Resolved":    ["How do I confirm a fix?", "Track my report"],
            "status.Closed":      ["Submit a new report"],
            "status.Rejected":    ["How do I submit a report?", "Contact staff"],
            "status.Duplicate":   ["What is Me Too?", "Track my report"],
            "photo":              ["Is location required?", "How do I submit a report?"],
            "location":           ["Is my data private?", "How do I submit a report?"],
            "privacy":            ["What data is collected?", "Contact staff"],
            "categories":         ["How do I submit a report?", "What is priority?"],
            "priority":           ["What does Critical priority mean?", "How do I submit?"],
            "contact":            ["How do I track my report?", "How do I submit a report?"],
            "languages":          ["How do I switch language?", "How do I submit a report?"],
        }.get(intent, ["How do I submit a report?", "How do I track a report?"])
        return jsonify({"reply": reply, "report": None, "suggestions": suggestions})

    # Fallback
    return jsonify({
        "reply": (
            "I'm not sure I understood that. Here are some things I can help with:\n\n"
            "• How to **submit** a report\n"
            "• How to **track** a report by ID\n"
            "• What each **status** means\n"
            "• **Privacy** and location information\n"
            "• Available **categories** and **priority** scoring\n\n"
            "You can also enter a tracking ID like **CIV-1042** to look up a specific report.\n\n"
            "For urgent help, please contact staff directly."
        ),
        "report": None,
        "suggestions": [
            "How do I submit a report?",
            "What does Under Review mean?",
            "Look up CIV-1042",
        ],
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
