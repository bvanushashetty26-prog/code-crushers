# CivicReport — Limitations & What's Real

This document is honest about what CivicReport actually does, what it simulates,
where the AI will be wrong, and what a production system would need.

---

## What is real

| Component | What it genuinely does |
|-----------|----------------------|
| **SQLite database** | Persistent storage of reports, status history, coordinates, image paths |
| **Image upload** | Files saved to `static/uploads/` with UUID filenames via `werkzeug.secure_filename` |
| **Category classifier** | Keyword-weighted scoring blended with TF-IDF cosine similarity — real inference, not hard-coded |
| **Extractive summariser** | Sentence scoring against issue/location vocabulary — produces a real summary |
| **Duplicate detector** | TF-IDF cosine + Haversine distance + category match — real similarity calculation |
| **Priority scorer** | Additive rule engine with explicit safety keywords, age, and duplicate count |
| **Hotspot clustering** | DBSCAN (`sklearn`) with `eps = 150 m`, `min_samples = 3`; haversine metric |
| **JSON REST API** | All seven endpoints are real, validated, and tested end-to-end |
| **Leaflet map** | Real OpenStreetMap tiles, real coordinates, real pin-drop and circle layers |
| **Status history** | Every status change is written as an immutable history row |
| **Live tracking** | Track page polls the API every 10 seconds — real auto-refresh |

---

## What is mocked / not yet real

### Data
- **All 40 seed reports are entirely synthetic.** Addresses, names, tracking IDs,
  coordinates, and descriptions are fictional. They were generated for development
  and demo purposes only. The city "Greenvale" does not exist.
- The `priority_score`, `priority_level`, and `priority_reason` stored in the database
  for seed reports were hand-assigned in `seed_data.py`, not run through the AI engine.
  New reports submitted via the API do use the real engine.

### Authentication & authorisation
- **There is no login system.** The admin dashboard is publicly accessible at `/admin`.
  Anyone can change report statuses or view all reports.
- There are no user accounts, citizen profiles, or role-based access control.

### Notifications
- **No SMS, email, or push notifications are sent.** When a report status changes,
  the citizen is not notified. They must actively visit the tracking page.
- There is no integration with any messaging gateway (Twilio, AWS SNS, FCM, etc.).

### Department / field-team integration
- **No real work-order system.** "Assigning" a report in the admin panel writes a
  name to the database but does not dispatch any task to a real team.
- There is no integration with municipality ERP systems, GIS platforms, or
  field-crew mobile apps.

### AI engine
- **No real machine-learning model is trained.** The classifier uses hand-crafted
  keyword lists and TF-IDF similarity against manually written example sentences.
  It was not trained on actual civic complaint corpora.
- **Image analysis is not implemented.** Uploaded photos are stored but never read.
  The AI engine has no vision model and does not infer category or damage severity
  from images.
- **The action brief is template-based, not generated.** `generate_action_brief()`
  fills a fixed string template. It is explicitly labelled `[Rule-based brief]` in
  every output to prevent confusion.

### Geography
- **No reverse geocoding.** Dropping a pin on the map does not fill in the address
  field automatically. Citizens must type the address manually.
- The Leaflet map defaults to coordinates 28.62 N, 77.21 E (fictional Greenvale).
  A real deployment would centre the map on the actual city.

### Infrastructure
- **Single-process SQLite.** Under concurrent write load, SQLite will produce
  `database is locked` errors. A production deployment needs PostgreSQL.
- **No HTTPS, CORS policy, or rate limiting.** The API is open to any same-origin
  request. Running `python app.py` in `debug=True` is not suitable for production.
- **No file-size or file-type enforcement beyond the 5 MB client-side guard.**
  The server accepts any extension in the allow-list without verifying file magic bytes.

---

## Where the AI can be wrong

### Category classifier

| Failure mode | Example |
|---|---|
| **Ambiguous multi-category text** | *"The flooded road has damaged asphalt near the blocked drain"* spans Waterlogging, Road Damage, and Drainage. The classifier picks the one with the highest blended score, which may vary with wording. |
| **Keyword absence** | A report written in Hindi transliteration (*"jal jama ho gaya"* = waterlogging) scores zero on all English keywords and falls back to TF-IDF against English examples, producing a low-confidence result. |
| **Negation blindness** | *"The pothole is finally fixed, no more damage"* contains the word `pothole` and will be classified as Road Damage with high confidence. |
| **Very short text** | A 3-word report like *"broken pipe here"* gives low confidence; the caller should treat `confidence < 0.4` as unreliable. |
| **Acronyms / abbreviations** | *"PWD contractor blocked SW drain"* — `SW` (stormwater) is not in the keyword list. |

### Duplicate detector

| Failure mode | Example |
|---|---|
| **Paraphrase gap** | *"Live wire is sparking on the road"* and *"electrical hazard on street"* describe the same issue but share few n-grams; TF-IDF similarity may fall below the 0.40 threshold. |
| **False positive on co-located unrelated reports** | Two different issues filed from the same junction (e.g. a pothole and a garbage pile) share the same address text and will score high on category-agnostic tokens. The category match check reduces but does not eliminate this. |
| **Cold-start** | The first report of a type has no existing reports to compare against, so nothing is ever flagged as a duplicate on day one. |
| **Coordinate-free reports** | Reports without latitude/longitude lose the 10% proximity bonus, reducing recall for near-duplicates that differ in wording. |

### Priority scorer

| Failure mode | Example |
|---|---|
| **Keyword gaming** | A report that includes the phrase "open manhole" to describe an unrelated issue (e.g. "unlike an open manhole, this is just a crack") receives the full +35 points because negation is not detected. |
| **Age over-weighting resolved issues** | A report marked Resolved still accumulates age points if the caller does not filter by status before scoring. |
| **Duplicate inflation** | If duplicates are misidentified (false positives), the primary report's `duplicate_count` rises artificially, boosting its priority score. |
| **English-only safety keywords** | Incidents described in other languages or transliterations receive no safety keyword points regardless of severity. |

### Hotspot detector

| Failure mode | Example |
|---|---|
| **Grid tile splits** | A cluster of reports straddling a grid cell boundary is split into two small clusters, neither reaching `min_samples = 3`. |
| **Dense area merging** | In a busy market area with many unrelated issues (garbage, waterlogging, streetlight) within 150 m, DBSCAN merges them into one "hotspot" even though they require different departments. |
| **Sparse geography** | In a large rural area with reports hundreds of metres apart, DBSCAN finds no clusters and falls back to the grid, which may also find none. |
| **Coordinate drift** | Reports entered without GPS (manually typed address) may have coordinates far from the actual location, silently distorting cluster centres. |

### Extractive summariser

| Failure mode | Example |
|---|---|
| **Boilerplate openers** | *"Dear officer, I am writing to bring to your attention that…"* — this sentence scores high on generic location words and may be selected over the actual issue sentence. |
| **Mid-sentence truncation** | A 25-word clause is truncated to 20 words with `…`, potentially cutting off the key location or severity qualifier. |
| **Single-sentence reports** | When the report is one long sentence, that sentence is always returned regardless of quality. |

---

## Next steps for a production system

### AI / ML improvements
- **Sentence embeddings** (e.g. `sentence-transformers` with `paraphrase-multilingual-MiniLM-L12-v2`)
  would replace TF-IDF for both category classification and duplicate detection,
  dramatically improving recall on paraphrased and multilingual text.
- **Fine-tuned LLM summarisation** (e.g. a small T5 or BART model) would produce
  fluent abstractive summaries rather than extracted sentences.
- **Image classification** — a MobileNet or EfficientNet model could infer issue
  category and damage severity directly from citizen photos without any text.
- **Named-entity extraction** — a spaCy NER pipeline trained on civic text could
  extract street names, ward numbers, and landmark names for structured storage
  and improved duplicate detection.
- **Online learning** — let officers mark duplicates and correct categories;
  feed these labels back to retrain the classifier periodically.

### Authentication & access control
- Citizen accounts with OTP-based phone verification.
- Officer / admin role separation; only authenticated officers can change statuses.
- JWT or session-based authentication for all state-changing API calls.

### Notifications
- SMS gateway (Twilio or local equivalent) to notify citizens when their report
  status changes.
- Email digest for supervisors summarising overnight new Critical reports.
- Push notifications via a service worker for citizens on mobile.

### Infrastructure
- **PostgreSQL** with PostGIS for spatial queries (replace SQLite + Python haversine).
- **Redis** for caching expensive `detect_hotspots` calculations.
- **Celery** task queue to run the AI pipeline asynchronously so the POST response
  is fast and AI results are filled in within seconds.
- **HTTPS** via a reverse proxy (nginx + Let's Encrypt).
- **Rate limiting** on the public `POST /api/reports` endpoint.
- **File type verification** via `python-magic` to check MIME type from file bytes,
  not just the extension.

### Integration
- Municipality ERP / work-order system API for real team dispatching.
- GIS platform integration (QGIS, ArcGIS Online) to export hotspot layers.
- Open311 / SeeClickFix API compatibility for aggregating reports from multiple
  citizen channels.
- Automatic reverse geocoding via Nominatim or Google Maps API to fill the address
  field from dropped-pin coordinates.
