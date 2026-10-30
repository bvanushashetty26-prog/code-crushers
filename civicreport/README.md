# CivicReport

A full-stack civic issue reporting system with a rule-based AI engine for classification,
priority scoring, duplicate detection, and hotspot clustering.
No paid API, no external model weights — everything runs offline with Python + SQLite.

---

## Quick start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Seed 40 synthetic reports (creates civicreport.db automatically)
python -X utf8 seed_data.py

# 3. Start the development server
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

> **Windows note:** use `python -X utf8 seed_data.py` so the console
> can print UTF-8 output correctly. The database itself is always UTF-8.

---

## File layout

```
civicreport/
│
├── app.py               Flask application — page routes + all JSON API endpoints
├── ai_engine.py         Rule-based AI engine (categorize, summarize, score, dedup, cluster)
├── seed_data.py         One-shot synthetic data loader (idempotent)
├── requirements.txt     Python dependencies
│
├── templates/
│   ├── index.html       Home page
│   ├── report.html      Citizen report form (Leaflet map, image upload, fetch submit)
│   ├── track.html       Live status tracking page (auto-refresh every 10 s)
│   └── admin.html       Admin dashboard (map, table, filters, action panel, chart)
│
└── static/
    ├── style.css        Mobile-first CSS — navy + teal civic design, all components
    ├── script.js        Client-side JS — initReportPage, initTrackPage, initAdminPage
    └── uploads/         Saved citizen photo uploads (created at runtime)
```

---

## Architecture

```
Browser                         Flask (app.py)               SQLite (civicreport.db)
───────                         ──────────────               ──────────────────────
                                                             ┌──────────────┐
report.html ──POST /api/reports──▶  _run_ai_pipeline()       │   reports    │
                                    ├─ ai_engine.categorize  │   (40+ rows) │
                                    ├─ ai_engine.summarize   └──────────────┘
                                    ├─ ai_engine.score_priority      │
                                    └─ ai_engine.find_duplicates      │
                               ◀── {tracking_id, category,   INSERT ─┘
                                    summary, priority, dup}

track.html  ──GET /api/reports/<id>─▶  SELECT report + history ──▶ JSON
            (auto-refresh 10 s)    ◀── {status, status_history[],
                                        priority_reason (list),
                                        duplicate_of_tracking_id}

admin.html  ──GET /api/stats ───────▶  aggregates              ──▶ JSON
            ──GET /api/reports ─────▶  sorted list             ──▶ JSON
            ──GET /api/hotspots ────▶  ai_engine.detect_hotspots──▶ JSON
            ──GET /api/brief ───────▶  ai_engine.generate_action_brief ▶ JSON
            ──PUT /api/reports/<id>/status ▶ UPDATE + history  ──▶ JSON

                    ai_engine.py (pure Python, no network calls)
                    ┌─────────────────────────────────────────────┐
                    │  categorize()   keyword scores + TF-IDF     │
                    │  summarize()    extractive sentence scoring  │
                    │  find_duplicates() TF-IDF cosine + Haversine│
                    │  score_priority()  additive factor rules     │
                    │  detect_hotspots() DBSCAN → grid fallback   │
                    │  generate_action_brief() template strings   │
                    └─────────────────────────────────────────────┘
```

---

## API reference

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/reports` | Submit a report; runs full AI pipeline |
| `GET`  | `/api/reports` | List reports (`?status=`, `?category=`, `?priority=`, `?limit=`, `?offset=`) |
| `GET`  | `/api/reports/<tracking_id>` | Full report + status history |
| `PUT`  | `/api/reports/<id>/status` | Update status, assignee, add note |
| `GET`  | `/api/hotspots` | Geographic clusters from DBSCAN / grid |
| `GET`  | `/api/stats` | Totals, by-category, by-status, by-priority, top-5, 7-day trend |
| `GET`  | `/api/brief` | Rule-based action briefs for top-N reports + clusters |

All API responses are JSON.  Errors return `{"error": "..."}` with an appropriate HTTP status.

---

## AI engine — how each feature works

### 1. `categorize(text)` — keyword rules + TF-IDF blended classifier

```
Input : free-text description (+ optional title)
Output: { category, confidence 0–1, method }
```

1. **Weighted keyword scan** — 6–13 keywords per category, each with a weight
   (e.g. `"open manhole"` → 3.5, `"drain"` → 3.0).  Scores are summed per category.
2. **TF-IDF cosine similarity** — two representative sentences per category are
   vectorised with scikit-learn's `TfidfVectorizer(ngram_range=(1,2))`.
   The input text is projected into the same space and cosine similarity is computed.
3. **Blend** — `final = 0.7 × kw_normalised + 0.3 × tfidf_normalised`.
4. **Confidence** — `top_score / (top_score + second_score)`, a genuine margin
   of victory rather than a raw probability.

### 2. `summarize(text)` — extractive sentence scoring

```
Input : free-text description
Output: ≤20-word string
```

1. Split into sentences at `.!?` boundaries.
2. Score each sentence: `overlap_words / total_words` where overlap counts
   issue-signal words (25 keywords) and location-signal words (20 keywords).
3. Return the highest-scoring sentence, truncated to 20 words.

### 3. `find_duplicates(new, existing)` — TF-IDF cosine + Haversine

```
Input : new report dict, list of existing open report dicts
Output: { match_id, match_tracking_id, score 0–1, reason } or None
```

Combined score formula:
```
score = 0.6 × TF-IDF cosine(title + description)
      + 0.3 × (1 if same_category else 0)
      + 0.1 × max(0, 1 − haversine_distance / 150 m)
```
Only candidates with `text_similarity ≥ 0.40` are considered.
The reason string is human-readable: `"text similarity 74%, same category (Drainage), 24 m away."`.

### 4. `score_priority(report)` — additive factor rules

```
Input : report dict (title, description, category, duplicate_count, created_at, cluster_id)
Output: { score 0–100, level (Low/Medium/High/Critical), factors [{factor, points}] }
```

| Factor | Max points |
|--------|-----------|
| Safety keywords (`open manhole` +35, `live wire` +35, `sparking` +30, …) | 35 each |
| Category base weight (Drainage 15 → Garbage 8) | 15 |
| Urgency words (`critical` +10, `urgent` +8, …) | 10 each |
| Duplicate count (5 pts × count, max 20) | 20 |
| Days unresolved (1 pt/day, max 15) | 15 |
| Cluster membership (+5) | 5 |

Level thresholds: ≥80 → Critical, ≥60 → High, ≥40 → Medium, else Low.

### 5. `detect_hotspots(reports)` — DBSCAN with grid fallback

```
Input : list of report dicts with lat/lon
Output: list of cluster dicts { cluster_id, centre_lat, centre_lon, count,
                                 open_count, categories, tracking_ids, description }
```

1. **DBSCAN first** (`eps = 150 m`, `min_samples = 3`, haversine metric via scikit-learn).
2. **Grid fallback** if DBSCAN returns no clusters: `≈150 m × 150 m` axis-aligned tiles.
3. Plain-English `description` field generated for each cluster.

### 6. `generate_action_brief(obj)` — template-based, labelled rule-based

```
Input : single report dict OR hotspot cluster dict
Output: multi-sentence string prefixed "[Rule-based brief | Category: X | Level: Y]"
```

Selects one of six category templates (Waterlogging, Road Damage, Garbage,
Streetlight, Drainage, Water Supply) and fills `{location}` and `{urgency_hours}`
(Critical = 2 h, High = 6 h, Medium = 24 h, Low = 48 h).
Every output is clearly labelled as rule-based so it is never confused with
AI-generated or human-authored text.

---

## Running the tests

```bash
# Re-seed and verify the database
python -X utf8 seed_data.py

# The project has no formal test suite yet.
# A manual end-to-end journey was validated in Step 8 (78/78 checks pass).
```

---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SECRET_KEY` | `dev-secret-change-me` | Flask session signing key |

Set `SECRET_KEY` to a random 32-byte hex string before deploying to production.

---

## Dependencies

```
flask          — web framework and routing
scikit-learn   — TfidfVectorizer, cosine_similarity, DBSCAN
numpy          — coordinate arrays for DBSCAN
werkzeug       — secure_filename for uploads
```

All are pure-Python wheels; no CUDA, no internet access required at runtime.
