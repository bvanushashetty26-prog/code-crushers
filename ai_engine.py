"""
ai_engine.py
------------
Rule-based and TF-IDF analytics for CivicReport.
No paid API, no external model weights — only scikit-learn, numpy, and stdlib.

Functions
---------
categorize(text)            -> dict  (category, confidence, method)
summarize(text)             -> str   (≤20-word extractive summary)
find_duplicates(new, exist) -> dict  (best_match, score, reason) or None
score_priority(report)      -> dict  (score 0-100, level, factors list)
detect_hotspots(reports)    -> list  (cluster dicts)
generate_action_brief(obj)  -> str   (rule-based plain-English brief)

All functions are RULE-BASED / STATISTICAL — they can be wrong.
Known failure modes are documented in each function's docstring.
"""

import math
import re
import string
from collections import defaultdict
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# 1. CATEGORIZE
# ---------------------------------------------------------------------------

# Weighted keyword table: (keyword, weight).
# Multiple keywords per category; weight reflects specificity.
_CATEGORY_KEYWORDS: dict[str, list[tuple[str, float]]] = {
    "Waterlogging": [
        ("waterlog", 3.0), ("flood", 2.5), ("standing water", 3.0),
        ("submerged", 2.5), ("inundated", 2.5), ("overflow", 2.0),
        ("knee deep", 2.5), ("water level", 2.0), ("stagnant water", 2.5),
        ("puddle", 1.5), ("waterlogged", 3.0), ("underwater", 2.0),
    ],
    "Road Damage": [
        ("pothole", 3.0), ("crater", 2.5), ("road broken", 3.0),
        ("asphalt", 2.0), ("pavement", 2.0), ("road surface", 2.5),
        ("road damage", 3.0), ("tyre", 2.0), ("tire", 2.0),
        ("median", 2.0), ("divider", 2.0), ("collapsed road", 3.5),
        ("road edge", 2.5), ("broken road", 3.0),
    ],
    "Garbage": [
        ("garbage", 3.0), ("waste", 2.5), ("rubbish", 2.5), ("trash", 2.5),
        ("sanitation", 2.0), ("bins", 2.5), ("overflowing bin", 3.0),
        ("dump", 2.0), ("litter", 2.0), ("collection", 1.5),
        ("rotting", 2.5), ("stinking", 2.0), ("flies", 2.0),
    ],
    "Streetlight": [
        ("streetlight", 3.0), ("street light", 3.0), ("lamp post", 3.0),
        ("lamp", 2.0), ("lighting", 2.0), ("dark", 2.0), ("light out", 3.0),
        ("non-functional light", 3.0), ("no light", 2.5),
        ("electric wire", 2.5), ("live wire", 3.0), ("wire hanging", 3.0),
        ("power line", 2.5), ("sparking", 3.0), ("snapped wire", 2.5),
    ],
    "Drainage": [
        ("drain", 3.0), ("drainage", 3.0), ("gutter", 2.5), ("sewer", 2.5),
        ("manhole", 3.0), ("open manhole", 3.5), ("blocked drain", 3.5),
        ("choked", 2.5), ("silt", 2.5), ("drain cover", 2.5),
        ("drain overflow", 3.0), ("drain blockage", 3.5),
    ],
    "Water Supply": [
        ("water supply", 3.0), ("no water", 3.0), ("water pipe", 2.5),
        ("pipe burst", 3.0), ("water main", 2.5), ("tap water", 2.5),
        ("water pressure", 2.5), ("water meter", 2.5), ("water outage", 3.0),
        ("water cut", 3.0), ("drinking water", 2.5), ("water shortage", 2.5),
    ],
}

# One representative sentence per category for TF-IDF fallback.
_CATEGORY_EXAMPLES: dict[str, list[str]] = {
    "Waterlogging": [
        "severe waterlogging knee deep water standing flood submerged inundated overflow",
        "rain water not draining standing water flooded road area",
    ],
    "Road Damage": [
        "large pothole crater broken asphalt road surface collapsed road edge tyre damage",
        "road median divider broken pavement crumbling tyre puncture",
    ],
    "Garbage": [
        "garbage waste rubbish overflowing bins dump litter rotting sanitation truck skip",
        "no garbage collection waste pile bins full flies stench market area",
    ],
    "Streetlight": [
        "streetlight lamp post light non functional dark night electric wire sparking live wire",
        "street lights out lamp broken power line snapped wire unsafe dark",
    ],
    "Drainage": [
        "drain blocked choked silt overflow manhole open drain cover broken gutter sewer",
        "drainage ditch overflow blocked drain gutter overflow manhole missing cover",
    ],
    "Water Supply": [
        "water supply cut pipe burst tap water no water pressure meter leak drinking water",
        "water outage main pipe leak no water supply shortage low pressure meter broken",
    ],
}

_CATEGORIES = list(_CATEGORY_KEYWORDS.keys())


def _keyword_score(text: str) -> dict[str, float]:
    """Return raw weighted keyword scores per category."""
    t = text.lower()
    scores: dict[str, float] = {c: 0.0 for c in _CATEGORIES}
    for cat, kw_list in _CATEGORY_KEYWORDS.items():
        for kw, w in kw_list:
            if kw in t:
                scores[cat] += w
    return scores


def _tfidf_score(text: str) -> dict[str, float]:
    """
    Compute cosine similarity between *text* and each category's example
    corpus using TF-IDF.  Returns a score in [0, 1] per category.
    """
    docs = [" ".join(examples) for examples in _CATEGORY_EXAMPLES.values()]
    cats = list(_CATEGORY_EXAMPLES.keys())
    try:
        vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        matrix = vec.fit_transform(docs + [text])
        sims = cosine_similarity(matrix[-1], matrix[:-1])[0]
        return {cats[i]: float(sims[i]) for i in range(len(cats))}
    except Exception:
        return {c: 0.0 for c in _CATEGORIES}


def categorize(text: str) -> dict[str, Any]:
    """
    Classify *text* into one of the six civic categories.

    Strategy
    --------
    1. Compute weighted keyword scores (primary signal).
    2. If the top keyword score is below a threshold, fall back to
       TF-IDF cosine similarity against category example sentences.
    3. Blend both signals: final_score = 0.7 * kw_norm + 0.3 * tfidf.
    4. Confidence = top_score / (top_score + second_score), clamped to [0, 1].

    Returns
    -------
    {
        "category":   str,   # predicted category
        "confidence": float, # 0.0-1.0
        "method":     str,   # "keyword", "tfidf", or "blended"
    }

    Known failure modes
    -------------------
    - Ambiguous reports that span two categories (e.g. "waterlogging due to
      blocked drain") may flip between Waterlogging and Drainage depending on
      exact wording.
    - Very short texts (<5 words) may return low-confidence results; the
      caller should treat confidence < 0.4 as "Uncategorized".
    - Sarcastic or negated text ("no pothole anymore") is not handled.
    """
    if not text or not text.strip():
        return {"category": "Uncategorized", "confidence": 0.0, "method": "none"}

    kw = _keyword_score(text)
    tf = _tfidf_score(text)

    kw_max = max(kw.values()) or 1.0
    kw_norm = {c: v / kw_max for c, v in kw.items()}

    tf_max = max(tf.values()) or 1.0
    tf_norm = {c: v / tf_max for c, v in tf.items()}

    blended = {c: 0.7 * kw_norm[c] + 0.3 * tf_norm[c] for c in _CATEGORIES}

    sorted_cats = sorted(blended, key=lambda c: blended[c], reverse=True)
    top, second = sorted_cats[0], sorted_cats[1]

    top_score = blended[top]
    second_score = blended[second]
    confidence = top_score / (top_score + second_score) if (top_score + second_score) > 0 else 0.0
    confidence = min(confidence, 1.0)

    # Determine method label
    kw_top = max(kw.values())
    if kw_top == 0:
        method = "tfidf"
    elif kw_norm[top] >= 0.9:
        method = "keyword"
    else:
        method = "blended"

    return {"category": top, "confidence": round(confidence, 3), "method": method}


# ---------------------------------------------------------------------------
# 2. SUMMARIZE
# ---------------------------------------------------------------------------

# Location-indicator words
_LOCATION_WORDS = {
    "road", "street", "lane", "avenue", "colony", "sector", "block",
    "near", "outside", "behind", "opposite", "park", "market", "hospital",
    "school", "station", "nagar", "chowk", "flyover", "underpass", "bridge",
    "gate", "area", "locality", "society", "apartment", "complex",
}

# Issue-indicator words (category + severity signals)
_ISSUE_WORDS = {
    "waterlogging", "flood", "pothole", "garbage", "drain", "drainage",
    "streetlight", "water", "supply", "pipe", "sewer", "manhole",
    "wire", "live", "broken", "blocked", "overflow", "collapsed", "missing",
    "damaged", "leaking", "burst", "dark", "stagnant", "overflow",
    "unsafe", "accident", "danger", "urgent", "critical", "severe",
}


def _clean(text: str) -> str:
    """Lower-case, strip punctuation, collapse whitespace."""
    text = text.lower()
    text = text.translate(str.maketrans(string.punctuation, " " * len(string.punctuation)))
    return re.sub(r"\s+", " ", text).strip()


def _sentence_score(sentence: str, all_words: list[str]) -> float:
    """
    Score a sentence by the fraction of its words that are location/issue
    words, weighted by sentence position (earlier = slightly better).
    """
    words = _clean(sentence).split()
    if not words:
        return 0.0
    overlap = sum(1 for w in words if w in _ISSUE_WORDS or w in _LOCATION_WORDS)
    return overlap / len(words)


def summarize(text: str) -> str:
    """
    Produce a short extractive summary of *text* in ≤20 words.

    Strategy
    --------
    1. Split into sentences.
    2. Score each sentence by density of issue + location keywords.
    3. Pick the highest-scoring sentence.
    4. Truncate to 20 words.

    Known failure modes
    -------------------
    - If the best sentence is a boilerplate opener ("Dear officer, …"), the
      summary may miss the actual issue.
    - Long compound sentences are truncated mid-thought at 20 words.
    - Non-English words in mixed-language texts are not scored.
    """
    if not text or not text.strip():
        return ""

    # Split on sentence boundaries
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

    if not sentences:
        words = text.split()
        return " ".join(words[:20])

    # Score and rank
    all_words = _clean(text).split()
    scored = sorted(sentences, key=lambda s: _sentence_score(s, all_words), reverse=True)
    best = scored[0]

    words = best.split()
    if len(words) > 20:
        best = " ".join(words[:20]) + "…"

    # Capitalise
    return best[0].upper() + best[1:] if best else ""


# ---------------------------------------------------------------------------
# 3. FIND DUPLICATES
# ---------------------------------------------------------------------------

_EARTH_RADIUS_M = 6_371_000.0


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return distance in metres between two lat/lon points."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * _EARTH_RADIUS_M * math.asin(math.sqrt(a))


def _report_text(r: dict) -> str:
    """Concatenate title + description for TF-IDF input."""
    parts = [r.get("title", ""), r.get("description", ""), r.get("summary", "")]
    return " ".join(p for p in parts if p)


def find_duplicates(
    new_report: dict,
    existing_reports: list[dict],
    text_threshold: float = 0.40,
    distance_threshold_m: float = 150.0,
) -> dict | None:
    """
    Find the best matching existing report for *new_report*.

    Scoring
    -------
    combined_score = 0.6 * text_similarity
                   + 0.3 * (1 if same_category else 0)
                   + 0.1 * proximity_score

    where proximity_score = max(0, 1 - dist_m / distance_threshold_m)

    Only reports with text_similarity ≥ text_threshold are considered.

    Returns
    -------
    {
        "match_id":         int,
        "match_tracking_id": str,
        "score":            float,   # 0.0 – 1.0
        "reason":           str,
    }
    or None if no duplicate is found.

    Side-effects
    ------------
    *new_report* is NOT mutated here.  The caller (app.py) is responsible
    for setting ``duplicate_of`` and incrementing ``duplicate_count``.

    Known failure modes
    -------------------
    - Two reports that use completely different wording for the same physical
      issue (e.g. "live wire" vs "electric hazard") may score below the
      text_threshold and be missed.
    - Reports that happen to share many common civic words but describe
      different issues on the same street can produce false positives
      (especially if both have the same category).
    - Coordinate-free reports (lat/lon = None) lose the 10 % proximity signal.
    """
    if not existing_reports:
        return None

    new_text = _report_text(new_report)
    if not new_text.strip():
        return None

    # Build TF-IDF matrix: [existing..., new]
    existing_texts = [_report_text(r) for r in existing_reports]
    try:
        vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        matrix = vec.fit_transform(existing_texts + [new_text])
        sims = cosine_similarity(matrix[-1], matrix[:-1])[0]
    except Exception:
        return None

    new_lat = new_report.get("latitude")
    new_lon = new_report.get("longitude")
    new_cat = (new_report.get("category") or "").strip().lower()

    best_score = 0.0
    best_idx = -1

    for i, r in enumerate(existing_reports):
        text_sim = float(sims[i])
        if text_sim < text_threshold:
            continue

        same_cat = (r.get("category") or "").strip().lower() == new_cat
        cat_bonus = 0.3 if same_cat else 0.0

        # Proximity
        prox_score = 0.0
        dist_m = None
        r_lat, r_lon = r.get("latitude"), r.get("longitude")
        if None not in (new_lat, new_lon, r_lat, r_lon):
            dist_m = _haversine_m(new_lat, new_lon, r_lat, r_lon)
            prox_score = max(0.0, 1.0 - dist_m / distance_threshold_m) * 0.1

        combined = 0.6 * text_sim + cat_bonus + prox_score
        if combined > best_score:
            best_score = combined
            best_idx = i
            _best_dist = dist_m
            _best_same_cat = same_cat
            _best_text_sim = text_sim

    if best_idx == -1:
        return None

    match = existing_reports[best_idx]

    # Build human-readable reason
    reasons = [f"text similarity {_best_text_sim:.0%}"]
    if _best_same_cat:
        reasons.append(f"same category ({match.get('category')})")
    if _best_dist is not None:
        reasons.append(f"{_best_dist:.0f} m away")
    reason = ", ".join(reasons)

    return {
        "match_id": match.get("id"),
        "match_tracking_id": match.get("tracking_id"),
        "score": round(best_score, 3),
        "reason": f"Likely duplicate of {match.get('tracking_id')}: {reason}.",
    }


# ---------------------------------------------------------------------------
# 4. SCORE PRIORITY
# ---------------------------------------------------------------------------

_SAFETY_KEYWORDS: list[tuple[str, int, str]] = [
    # (keyword, points, label)
    ("open manhole",    35, "Safety keyword: 'open manhole'"),
    ("live wire",       35, "Safety keyword: 'live wire'"),
    ("sparking",        30, "Safety keyword: 'sparking'"),
    ("collapsed road",  30, "Safety keyword: 'collapsed road'"),
    ("flooded underpass", 30, "Safety keyword: 'flooded underpass'"),
    ("submerged",       25, "Safety keyword: 'submerged'"),
    ("accident",        20, "Safety keyword: 'accident'"),
    ("child",           15, "Safety keyword: 'child'"),
    ("school",          15, "Safety keyword: 'school'"),
    ("hospital",        15, "Safety keyword: 'hospital'"),
    ("wire hanging",    28, "Safety keyword: 'wire hanging'"),
    ("falling",         20, "Safety keyword: 'falling'"),
    ("collapse",        25, "Safety keyword: 'collapse'"),
    ("flood",           18, "Safety keyword: 'flood'"),
    ("knee deep",       22, "Safety keyword: 'knee deep'"),
    ("no barricade",    20, "Safety keyword: 'no barricade'"),
    ("missing cover",   28, "Safety keyword: 'missing cover'"),
]

_CATEGORY_BASE: dict[str, int] = {
    "Drainage":     15,
    "Waterlogging": 14,
    "Road Damage":  13,
    "Water Supply": 12,
    "Streetlight":  10,
    "Garbage":       8,
}

_URGENCY_WORDS: list[tuple[str, int]] = [
    ("urgent", 8), ("critical", 10), ("emergency", 10),
    ("danger", 8), ("dangerous", 8), ("immediately", 7),
    ("serious", 5), ("severe", 6), ("extremely", 5),
]


def score_priority(report: dict) -> dict[str, Any]:
    """
    Compute a priority score 0–100 for *report*.

    Factors
    -------
    1. Safety keywords in title + description             (up to 35 pts each)
    2. Category base weight                               (8–15 pts)
    3. Urgency / severity words                           (up to 10 pts each)
    4. Duplicate count (more duplicates = wider impact)   (5 pts per duplicate, max 20)
    5. Time unresolved (days since created_at)            (1 pt/day, max 15)
    6. Cluster density (duplicate_count used as proxy)    (up to 5 pts)

    Score is clamped to [0, 100].

    Returns
    -------
    {
        "score":   int,        # 0 – 100
        "level":   str,        # "Low" | "Medium" | "High" | "Critical"
        "factors": list[dict], # [{"factor": str, "points": int}, ...]
    }

    Known failure modes
    -------------------
    - The keyword list is English-only; vernacular or transliterated words
      (e.g. "jal jama ho gaya") will receive zero safety points.
    - Reports that use unusual spelling variants ("pothole" → "pot hole")
      may miss some keyword matches.
    - The time-unresolved bonus rewards old reports even if they are already
      resolved; callers should filter by status if needed.
    - Duplicate count is taken from the stored field; freshly inserted reports
      with 0 duplicates may be under-scored relative to their true impact.
    """
    factors: list[dict] = []
    total = 0

    full_text = " ".join(
        str(report.get(k, ""))
        for k in ("title", "description", "summary")
    ).lower()

    # 1. Safety keywords
    for kw, pts, label in _SAFETY_KEYWORDS:
        if kw in full_text:
            factors.append({"factor": label, "points": pts})
            total += pts

    # 2. Category base weight
    cat = report.get("category", "")
    base = _CATEGORY_BASE.get(cat, 5)
    factors.append({"factor": f"Category: {cat}", "points": base})
    total += base

    # 3. Urgency words
    for word, pts in _URGENCY_WORDS:
        if word in full_text:
            factors.append({"factor": f"Urgency word: '{word}'", "points": pts})
            total += pts

    # 4. Duplicate count (wider community impact)
    dup_count = int(report.get("duplicate_count", 0) or 0)
    if dup_count > 0:
        dup_pts = min(dup_count * 5, 20)
        factors.append({"factor": f"{dup_count} duplicate report(s) filed", "points": dup_pts})
        total += dup_pts

    # 5. Time unresolved
    import sqlite3  # already in stdlib; avoid circular at module level
    created_raw = report.get("created_at", "")
    days_unresolved = 0
    if created_raw:
        try:
            from datetime import datetime, timezone
            created_dt = datetime.fromisoformat(str(created_raw).replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            if created_dt.tzinfo is None:
                created_dt = created_dt.replace(tzinfo=timezone.utc)
            days_unresolved = max(0, (now - created_dt).days)
        except (ValueError, TypeError):
            pass
    if days_unresolved > 0:
        age_pts = min(days_unresolved, 15)
        factors.append({"factor": f"Unresolved for {days_unresolved} day(s)", "points": age_pts})
        total += age_pts

    # 6. Cluster density bonus (use duplicate_count as proxy for local density)
    cluster_id = report.get("cluster_id")
    if cluster_id:
        factors.append({"factor": f"Part of hotspot cluster {cluster_id}", "points": 5})
        total += 5

    score = max(0, min(100, total))

    if score >= 80:
        level = "Critical"
    elif score >= 60:
        level = "High"
    elif score >= 40:
        level = "Medium"
    else:
        level = "Low"

    return {"score": score, "level": level, "factors": factors}


# ---------------------------------------------------------------------------
# 5. DETECT HOTSPOTS
# ---------------------------------------------------------------------------

def _grid_cluster(
    reports: list[dict],
    cell_deg: float = 0.0015,   # ~150 m at this latitude
    min_reports: int = 3,
) -> list[dict]:
    """
    Group reports into grid cells.  Each report whose (lat, lon) falls into
    the same cell_deg × cell_deg tile is in the same cluster.
    Returns only clusters with ≥ min_reports members.
    """
    cells: dict[tuple[int, int], list[dict]] = defaultdict(list)
    for r in reports:
        lat = r.get("latitude")
        lon = r.get("longitude")
        if lat is None or lon is None:
            continue
        key = (int(lat / cell_deg), int(lon / cell_deg))
        cells[key].append(r)

    clusters = []
    cluster_id = 0
    for cell_key, members in cells.items():
        if len(members) < min_reports:
            continue
        cluster_id += 1
        lats = [m["latitude"] for m in members]
        lons = [m["longitude"] for m in members]
        centre_lat = float(np.mean(lats))
        centre_lon = float(np.mean(lons))
        categories = list({m.get("category", "Unknown") for m in members})
        statuses = [m.get("status", "") for m in members]
        open_count = sum(1 for s in statuses if s not in ("Resolved",))
        clusters.append({
            "cluster_id": f"HOT-{cluster_id:03d}",
            "centre_lat": round(centre_lat, 6),
            "centre_lon": round(centre_lon, 6),
            "count": len(members),
            "open_count": open_count,
            "categories": sorted(categories),
            "report_ids": [m.get("id") for m in members if m.get("id")],
            "tracking_ids": [m.get("tracking_id") for m in members],
            "description": _hotspot_description(centre_lat, centre_lon, len(members), categories, open_count),
        })

    return sorted(clusters, key=lambda c: c["count"], reverse=True)


def _try_dbscan(reports: list[dict], eps_m: float = 150.0, min_samples: int = 3) -> list[dict] | None:
    """
    Attempt DBSCAN clustering on lat/lon coordinates (converted to radians for
    haversine metric).  Returns None if sklearn DBSCAN is unavailable or if
    there are fewer reports than min_samples.
    """
    try:
        from sklearn.cluster import DBSCAN
    except ImportError:
        return None

    geo_reports = [r for r in reports if r.get("latitude") is not None and r.get("longitude") is not None]
    if len(geo_reports) < min_samples:
        return None

    coords = np.radians([[r["latitude"], r["longitude"]] for r in geo_reports])
    eps_rad = eps_m / _EARTH_RADIUS_M
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, algorithm="ball_tree", metric="haversine")
    labels = db.fit_predict(coords)

    cluster_map: dict[int, list[dict]] = defaultdict(list)
    for r, lbl in zip(geo_reports, labels):
        if lbl == -1:
            continue
        cluster_map[lbl].append(r)

    if not cluster_map:
        return None

    clusters = []
    for lbl, members in cluster_map.items():
        lats = [m["latitude"] for m in members]
        lons = [m["longitude"] for m in members]
        centre_lat = float(np.mean(lats))
        centre_lon = float(np.mean(lons))
        categories = list({m.get("category", "Unknown") for m in members})
        statuses = [m.get("status", "") for m in members]
        open_count = sum(1 for s in statuses if s not in ("Resolved",))
        clusters.append({
            "cluster_id": f"HOT-{lbl + 1:03d}",
            "centre_lat": round(centre_lat, 6),
            "centre_lon": round(centre_lon, 6),
            "count": len(members),
            "open_count": open_count,
            "categories": sorted(categories),
            "report_ids": [m.get("id") for m in members if m.get("id")],
            "tracking_ids": [m.get("tracking_id") for m in members],
            "description": _hotspot_description(centre_lat, centre_lon, len(members), categories, open_count),
        })

    return sorted(clusters, key=lambda c: c["count"], reverse=True)


def _hotspot_description(lat: float, lon: float, count: int, categories: list[str], open_count: int) -> str:
    cat_str = " and ".join(categories) if categories else "mixed issues"
    return (
        f"Hotspot at ({lat:.4f}, {lon:.4f}): {count} report(s) of {cat_str}. "
        f"{open_count} still open. Likely requires coordinated field response."
    )


def detect_hotspots(reports: list[dict]) -> list[dict]:
    """
    Cluster *reports* geographically and return hotspot summaries.

    Strategy
    --------
    1. Try DBSCAN (sklearn) with eps=150 m, min_samples=3 — best results.
    2. Fall back to a simple grid-cell approach if DBSCAN is unavailable
       or returns no clusters.

    Each returned cluster dict contains:
        cluster_id, centre_lat, centre_lon, count, open_count,
        categories (list), report_ids (list), tracking_ids (list),
        description (str, plain English)

    Known failure modes
    -------------------
    - Grid fallback uses axis-aligned tiles; reports on the border of two
      cells may end up in different clusters even if physically adjacent.
    - DBSCAN eps is fixed at 150 m; dense urban grids may merge distinct
      issues into one cluster if many unrelated reports are filed nearby.
    - Reports without lat/lon coordinates are silently excluded.
    """
    if not reports:
        return []

    result = _try_dbscan(reports)
    if result is not None:
        return result

    return _grid_cluster(reports)


# ---------------------------------------------------------------------------
# 6. GENERATE ACTION BRIEF  (rule-based, not an LLM)
# ---------------------------------------------------------------------------

_BRIEF_TEMPLATES: dict[str, str] = {
    "Waterlogging": (
        "Dispatch the drainage/pumping crew to {location}. "
        "Deploy water pumps to clear standing water. "
        "Inspect nearby drains for blockages and clear them. "
        "Estimated response: within {urgency_hours} hours."
    ),
    "Road Damage": (
        "Issue a work order for road repair at {location}. "
        "Place warning signs / barricades immediately. "
        "Schedule pothole patching or road resurfacing. "
        "Estimated response: within {urgency_hours} hours."
    ),
    "Garbage": (
        "Route a sanitation vehicle to {location} for urgent pickup. "
        "Investigate why scheduled collection was missed. "
        "Arrange for additional bins if required. "
        "Estimated response: within {urgency_hours} hours."
    ),
    "Streetlight": (
        "Dispatch electrical maintenance crew to {location}. "
        "Inspect all lamp posts in the stretch for faults. "
        "Replace faulty bulbs / repair wiring. "
        "Estimated response: within {urgency_hours} hours."
    ),
    "Drainage": (
        "Dispatch drainage crew to {location}. "
        "Clear blocked drain / replace missing manhole cover immediately. "
        "Install temporary barricades around any open manhole. "
        "Estimated response: within {urgency_hours} hours."
    ),
    "Water Supply": (
        "Alert water supply maintenance team for {location}. "
        "Identify and repair burst or leaking main pipe. "
        "Restore supply and test water quality before reopening. "
        "Estimated response: within {urgency_hours} hours."
    ),
}

_DEFAULT_BRIEF = (
    "Assign a field officer to assess the situation at {location}. "
    "Determine required department and issue work order. "
    "Estimated response: within {urgency_hours} hours."
)


def _urgency_hours(level: str) -> str:
    return {"Critical": "2", "High": "6", "Medium": "24"}.get(level, "48")


def generate_action_brief(obj: dict) -> str:
    """
    Produce a plain-English action brief for *obj*, which may be either
    a single report dict or a hotspot cluster dict.

    This function is ENTIRELY RULE-BASED — no language model is used.
    It selects the appropriate template from ``_BRIEF_TEMPLATES`` and fills
    in location and urgency-hours placeholders.

    For a cluster, it lists the unique categories and centres the brief
    on the most common one.

    Returns a multi-sentence string labelled with a disclaimer.

    Known failure modes
    -------------------
    - Template selection is based solely on category; cross-category clusters
      receive the brief of only their most common category.
    - Urgency hours are fixed by level; real operational capacity is not
      considered.
    - The brief is identical for all reports with the same category and level,
      which may miss issue-specific nuance.
    """
    # Detect whether this is a cluster (has 'tracking_ids') or a single report
    is_cluster = "tracking_ids" in obj

    if is_cluster:
        cats = obj.get("categories", [])
        # pick most representative category (first alphabetically as tie-break)
        primary_cat = sorted(cats)[0] if cats else "Unknown"
        location = f"hotspot near ({obj.get('centre_lat', '?')}, {obj.get('centre_lon', '?')})"
        count = obj.get("count", 0)
        open_count = obj.get("open_count", 0)
        level = "Critical" if open_count >= 4 else ("High" if open_count >= 2 else "Medium")
        ids_str = ", ".join(str(t) for t in (obj.get("tracking_ids") or [])[:5])
        extra = (
            f"This hotspot covers {count} report(s) ({open_count} open): {ids_str}. "
            f"Affected categories: {', '.join(sorted(cats))}."
        )
    else:
        primary_cat = obj.get("category", "")
        location = obj.get("address") or f"({obj.get('latitude', '?')}, {obj.get('longitude', '?')})"
        level = obj.get("priority_level", "Medium")
        tracking_id = obj.get("tracking_id", "N/A")
        extra = f"Report ID: {tracking_id}. Priority level: {level}."

    template = _BRIEF_TEMPLATES.get(primary_cat, _DEFAULT_BRIEF)
    body = template.format(location=location, urgency_hours=_urgency_hours(level))

    return (
        f"[Rule-based brief | Category: {primary_cat} | Level: {level}]\n"
        f"{body}\n"
        f"{extra}"
    )
