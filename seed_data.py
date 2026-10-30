"""
seed_data.py
------------
SYNTHETIC DATA ONLY — every report, address, name and coordinate in this file
is entirely fictional and was generated for development/demo purposes.

Fictional city: Greenvale (centred ~28.6200 N, 77.2100 E — a made-up grid
overlaid on a real-world coordinate zone for visual realism on a map).

Run:
    python seed_data.py

The script is idempotent: it wipes the reports and status_history tables
before inserting, so re-running always produces a clean 40-report dataset.
"""

import json
import os
import sqlite3
from datetime import datetime, timedelta, timezone
import random

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DB_PATH = os.path.join(os.path.dirname(__file__), "civicreport.db")
random.seed(42)  # reproducible synthetic data


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def ts(days_ago: float, hour: int = 9, minute: int = 0) -> str:
    """Return an ISO-8601 UTC string *days_ago* days before today."""
    t = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return t.replace(hour=hour, minute=minute, second=0, microsecond=0).isoformat(
        timespec="seconds"
    )


STATUS_FLOW = {
    "Submitted":    [],
    "Under Review": ["Submitted"],
    "Assigned":     ["Submitted", "Under Review"],
    "In Progress":  ["Submitted", "Under Review", "Assigned"],
    "Resolved":     ["Submitted", "Under Review", "Assigned", "In Progress"],
}

STATUS_NOTES = {
    "Submitted":    "Report submitted by citizen.",
    "Under Review": "Report reviewed by municipal officer.",
    "Assigned":     "Work order raised and team assigned.",
    "In Progress":  "Field crew on-site, work in progress.",
    "Resolved":     "Issue resolved and closed by supervisor.",
}

STAFF = [
    "Officer Patel", "Officer Singh", "Officer Kumar",
    "Officer Sharma", "Officer Reddy", "Officer Nair",
]


def make_history(days_ago_created: float, final_status: str, step_hours: int = 18) -> list[dict]:
    """Build status_history rows from Submitted → final_status."""
    chain = STATUS_FLOW[final_status] + [final_status]
    rows = []
    base = datetime.now(timezone.utc) - timedelta(days=days_ago_created)
    for i, s in enumerate(chain):
        t = (base + timedelta(hours=i * step_hours)).isoformat(timespec="seconds")
        rows.append({"status": s, "note": STATUS_NOTES[s], "timestamp": t})
    return rows


def priority(score: int) -> str:
    if score >= 80:
        return "Critical"
    if score >= 60:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


# ---------------------------------------------------------------------------
# Report definitions
# Each dict maps directly to `reports` columns.
# duplicate_of is set later using tracking_id references.
# ---------------------------------------------------------------------------

# fmt: off
REPORTS_RAW = [
    # ── Cluster: MG Road / Sector 7 (drain + waterlogging + road damage) ──
    # reports 0-5
    {
        "tracking_id": "CIV-1001",
        "title": "Drain blockage on MG Road causing overflow",
        "description": "The storm drain on MG Road near Sector 7 chowk is completely blocked with silt. Water overflows onto the footpath during any rain.",
        "summary": "Blocked storm drain causing overflow near Sector 7.",
        "category": "Drainage",
        "latitude": 28.6205, "longitude": 77.2105,
        "address": "MG Road, near Sector 7 Chowk, Greenvale",
        "priority_score": 72,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 4, "duration_days": 8, "infrastructure_damage": 2}),
        "status": "In Progress", "assigned_to": "Officer Patel",
        "days_ago": 12, "cluster_id": "CLU-MG7",
    },
    {
        "tracking_id": "CIV-1002",
        "title": "Severe waterlogging at MG Road Sector 7 intersection",
        "description": "Knee-deep water at the MG Road–Sector 7 intersection. Vehicles stalling. Shops flooded on both sides.",
        "summary": "Knee-deep waterlogging blocking MG Road–Sector 7 intersection.",
        "category": "Waterlogging",
        "latitude": 28.6208, "longitude": 77.2108,
        "address": "MG Road–Sector 7 Junction, Greenvale",
        "priority_score": 78,
        "priority_reason": json.dumps({"safety_risk": 4, "affected_population": 5, "duration_days": 8, "infrastructure_damage": 3}),
        "status": "In Progress", "assigned_to": "Officer Patel",
        "days_ago": 12, "cluster_id": "CLU-MG7",
    },
    {
        "tracking_id": "CIV-1003",
        "title": "Road surface crumbling near MG Road Sector 7",
        "description": "Persistent waterlogging has caused the road surface to break up. Large potholes now 10–15 cm deep over 20 m stretch.",
        "summary": "Road surface breaking due to waterlogging on MG Road near Sector 7.",
        "category": "Road Damage",
        "latitude": 28.6202, "longitude": 77.2102,
        "address": "MG Road, 50m south of Sector 7 Chowk, Greenvale",
        "priority_score": 65,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 4, "duration_days": 10, "infrastructure_damage": 4}),
        "status": "Assigned", "assigned_to": "Officer Singh",
        "days_ago": 10, "cluster_id": "CLU-MG7",
    },
    {
        "tracking_id": "CIV-1004",
        "title": "Blocked gutter turning road into a stream – MG Road",
        "description": "Same old story: the gutter near the old bus stand on MG Road is choked again. Water runs along the road like a river.",
        "summary": "Blocked gutter on MG Road near old bus stand.",
        "category": "Drainage",
        "latitude": 28.6207, "longitude": 77.2106,
        "address": "MG Road near Old Bus Stand, Sector 7, Greenvale",
        "priority_score": 68,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 3, "duration_days": 9, "infrastructure_damage": 2}),
        "status": "In Progress", "assigned_to": "Officer Patel",
        "days_ago": 11, "cluster_id": "CLU-MG7",
        "duplicate_of_ref": "CIV-1001",
    },
    {
        "tracking_id": "CIV-1005",
        "title": "Water not draining from MG Road after last night's rain",
        "description": "After yesterday's rain, MG Road sector 7 area still has standing water this morning. Clearly the drains are not functional.",
        "summary": "Standing water on MG Road since last night.",
        "category": "Waterlogging",
        "latitude": 28.6209, "longitude": 77.2110,
        "address": "MG Road, Sector 7, Greenvale",
        "priority_score": 70,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 4, "duration_days": 1, "infrastructure_damage": 2}),
        "status": "Under Review", "assigned_to": None,
        "days_ago": 1, "cluster_id": "CLU-MG7",
        "duplicate_of_ref": "CIV-1002",
    },
    {
        "tracking_id": "CIV-1006",
        "title": "Potholes worsened on MG Road after flooding",
        "description": "The potholes near sector 7 chowk MG Road are now dangerous. My scooter's wheel got stuck yesterday.",
        "summary": "Dangerous potholes on MG Road post-flooding.",
        "category": "Road Damage",
        "latitude": 28.6203, "longitude": 77.2103,
        "address": "MG Road, Sector 7 Chowk area, Greenvale",
        "priority_score": 62,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 3, "duration_days": 7, "infrastructure_damage": 3}),
        "status": "Submitted", "assigned_to": None,
        "days_ago": 2, "cluster_id": "CLU-MG7",
        "duplicate_of_ref": "CIV-1003",
    },

    # ── Urgent Safety Issue 1: Open Manhole ──
    {
        "tracking_id": "CIV-1007",
        "title": "Open manhole on Park Street — serious accident risk",
        "description": "The manhole cover on Park Street near the community centre has been missing for 3 days. No barricades. A child nearly fell in last evening.",
        "summary": "Uncovered manhole on Park Street with no barricades.",
        "category": "Drainage",
        "latitude": 28.6185, "longitude": 77.2145,
        "address": "Park Street, near Community Centre, Greenvale",
        "priority_score": 95,
        "priority_reason": json.dumps({"safety_risk": 5, "affected_population": 4, "duration_days": 3, "infrastructure_damage": 1}),
        "status": "Assigned", "assigned_to": "Officer Kumar",
        "days_ago": 3, "cluster_id": None,
    },

    # ── Urgent Safety Issue 2: Live Wire ──
    {
        "tracking_id": "CIV-1008",
        "title": "Live electric wire hanging low over Lake View Road",
        "description": "A snapped overhead wire is hanging about 1.5 m above the ground on Lake View Road. It is sparking when it rains. Extremely dangerous.",
        "summary": "Sparking low-hanging live wire on Lake View Road.",
        "category": "Streetlight",
        "latitude": 28.6230, "longitude": 77.2080,
        "address": "Lake View Road, near Water Tank, Greenvale",
        "priority_score": 99,
        "priority_reason": json.dumps({"safety_risk": 5, "affected_population": 5, "duration_days": 1, "infrastructure_damage": 2}),
        "status": "In Progress", "assigned_to": "Officer Sharma",
        "days_ago": 1, "cluster_id": None,
    },

    # ── Urgent Safety Issue 3: Flooded Underpass ──
    {
        "tracking_id": "CIV-1009",
        "title": "Railway underpass fully flooded — no passage possible",
        "description": "The Greenvale Railway underpass is submerged with over 4 feet of water. Vehicles attempted to cross and stalled. Needs immediate pumping.",
        "summary": "Railway underpass completely flooded, traffic blocked.",
        "category": "Waterlogging",
        "latitude": 28.6170, "longitude": 77.2060,
        "address": "Greenvale Railway Underpass, Station Road",
        "priority_score": 97,
        "priority_reason": json.dumps({"safety_risk": 5, "affected_population": 5, "duration_days": 2, "infrastructure_damage": 3}),
        "status": "In Progress", "assigned_to": "Officer Sharma",
        "days_ago": 2, "cluster_id": None,
    },

    # ── Urgent Safety Issue 4: Collapsed Road Edge ──
    {
        "tracking_id": "CIV-1010",
        "title": "Road edge collapsed near Riverside Drive bridge",
        "description": "About 1.5 m of road shoulder has collapsed into the drainage canal at Riverside Drive bridge. Guard rails are gone. One lane unusable.",
        "summary": "Road shoulder collapsed into canal at Riverside Drive bridge.",
        "category": "Road Damage",
        "latitude": 28.6155, "longitude": 77.2120,
        "address": "Riverside Drive, Near Canal Bridge, Greenvale",
        "priority_score": 93,
        "priority_reason": json.dumps({"safety_risk": 5, "affected_population": 3, "duration_days": 5, "infrastructure_damage": 5}),
        "status": "Assigned", "assigned_to": "Officer Reddy",
        "days_ago": 5, "cluster_id": None,
    },

    # ── Duplicate Group A: Garbage at Central Market (CIV-1011 primary) ──
    {
        "tracking_id": "CIV-1011",
        "title": "Garbage piling up at Central Market for 5 days",
        "description": "No garbage collection at Central Market for at least 5 days. The pile is huge and stinking. Flies everywhere.",
        "summary": "5-day garbage backlog at Central Market.",
        "category": "Garbage",
        "latitude": 28.6215, "longitude": 77.2135,
        "address": "Central Market, Main Street, Greenvale",
        "priority_score": 55,
        "priority_reason": json.dumps({"safety_risk": 2, "affected_population": 4, "duration_days": 5, "infrastructure_damage": 0}),
        "status": "Under Review", "assigned_to": None,
        "days_ago": 5, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1012",
        "title": "Waste overflowing from bins near Central Market",
        "description": "Bins near the market entrance are overflowing for days. Health hazard. Request urgent pickup.",
        "summary": "Overflowing bins at Central Market entrance.",
        "category": "Garbage",
        "latitude": 28.6217, "longitude": 77.2137,
        "address": "Central Market Entrance, Greenvale",
        "priority_score": 50,
        "priority_reason": json.dumps({"safety_risk": 2, "affected_population": 4, "duration_days": 4, "infrastructure_damage": 0}),
        "status": "Submitted", "assigned_to": None,
        "days_ago": 3, "cluster_id": None,
        "duplicate_of_ref": "CIV-1011",
    },
    {
        "tracking_id": "CIV-1013",
        "title": "No sanitation pickup at market area this week",
        "description": "Central Market area has had no sanitation truck visit in over a week. Rotting vegetables added to the smell.",
        "summary": "Week-long sanitation skip at Central Market.",
        "category": "Garbage",
        "latitude": 28.6214, "longitude": 77.2133,
        "address": "Central Market, Greenvale",
        "priority_score": 48,
        "priority_reason": json.dumps({"safety_risk": 2, "affected_population": 4, "duration_days": 7, "infrastructure_damage": 0}),
        "status": "Submitted", "assigned_to": None,
        "days_ago": 2, "cluster_id": None,
        "duplicate_of_ref": "CIV-1011",
    },

    # ── Duplicate Group B: Streetlight out on Nehru Ave (CIV-1014 primary) ──
    {
        "tracking_id": "CIV-1014",
        "title": "Three streetlights out on Nehru Avenue — dark stretch",
        "description": "Three consecutive streetlights between house #24 and #36 on Nehru Avenue have been non-functional for 10 nights. Very unsafe after dark.",
        "summary": "Three consecutive streetlights non-functional on Nehru Avenue.",
        "category": "Streetlight",
        "latitude": 28.6240, "longitude": 77.2095,
        "address": "Nehru Avenue, between #24 and #36, Greenvale",
        "priority_score": 58,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 3, "duration_days": 10, "infrastructure_damage": 1}),
        "status": "Assigned", "assigned_to": "Officer Nair",
        "days_ago": 10, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1015",
        "title": "Street completely dark near house 28 Nehru Avenue",
        "description": "The lamp posts near house 28 Nehru Ave are all off. It has been like this for over a week. Women feel unsafe walking at night.",
        "summary": "Nehru Avenue near #28 dark for a week.",
        "category": "Streetlight",
        "latitude": 28.6241, "longitude": 77.2096,
        "address": "Nehru Avenue near #28, Greenvale",
        "priority_score": 54,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 3, "duration_days": 8, "infrastructure_damage": 1}),
        "status": "Submitted", "assigned_to": None,
        "days_ago": 4, "cluster_id": None,
        "duplicate_of_ref": "CIV-1014",
    },

    # ── Duplicate Group C: Water Supply cut on Tagore Colony (CIV-1016 primary) ──
    {
        "tracking_id": "CIV-1016",
        "title": "No water supply in Tagore Colony for 3 days",
        "description": "Tagore Colony blocks A, B, and C have had zero water supply for 72 hours. Residents are buying water at high cost.",
        "summary": "72-hour water supply outage across Tagore Colony A/B/C.",
        "category": "Water Supply",
        "latitude": 28.6195, "longitude": 77.2165,
        "address": "Tagore Colony, Block A, Greenvale",
        "priority_score": 75,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 5, "duration_days": 3, "infrastructure_damage": 1}),
        "status": "In Progress", "assigned_to": "Officer Kumar",
        "days_ago": 4, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1017",
        "title": "Water pipe burst in Tagore Colony — supply disrupted",
        "description": "Appears a main pipe has burst somewhere in Tagore Colony. Block B has had no water since Tuesday.",
        "summary": "Suspected burst pipe causing water outage in Tagore Colony Block B.",
        "category": "Water Supply",
        "latitude": 28.6197, "longitude": 77.2168,
        "address": "Tagore Colony, Block B, Greenvale",
        "priority_score": 73,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 4, "duration_days": 3, "infrastructure_damage": 2}),
        "status": "In Progress", "assigned_to": "Officer Kumar",
        "days_ago": 3, "cluster_id": None,
        "duplicate_of_ref": "CIV-1016",
    },
    {
        "tracking_id": "CIV-1018",
        "title": "Tagore Colony residents without drinking water since Monday",
        "description": "No tap water in our apartment for 4 days. Municipality must fix the main immediately.",
        "summary": "4-day tap water absence in Tagore Colony.",
        "category": "Water Supply",
        "latitude": 28.6196, "longitude": 77.2166,
        "address": "Tagore Colony, Block C, Greenvale",
        "priority_score": 71,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 4, "duration_days": 4, "infrastructure_damage": 1}),
        "status": "Under Review", "assigned_to": None,
        "days_ago": 2, "cluster_id": None,
        "duplicate_of_ref": "CIV-1016",
    },

    # ── Duplicate Group D: Large pothole on Station Road (CIV-1019 primary) ──
    {
        "tracking_id": "CIV-1019",
        "title": "Huge pothole on Station Road near petrol pump",
        "description": "There is a massive crater-like pothole on Station Road right in front of the HP petrol pump. Caused two tyre punctures already this week.",
        "summary": "Large pothole causing tyre damage on Station Road near HP pump.",
        "category": "Road Damage",
        "latitude": 28.6220, "longitude": 77.2055,
        "address": "Station Road, near HP Petrol Pump, Greenvale",
        "priority_score": 66,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 4, "duration_days": 6, "infrastructure_damage": 3}),
        "status": "Under Review", "assigned_to": None,
        "days_ago": 6, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1020",
        "title": "Deep crater near petrol pump Station Road",
        "description": "The pothole near petrol station on Station Road is getting bigger. It's now about 1 foot deep and 3 feet wide.",
        "summary": "Expanding pothole near petrol station on Station Road.",
        "category": "Road Damage",
        "latitude": 28.6221, "longitude": 77.2056,
        "address": "Station Road, Greenvale",
        "priority_score": 60,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 3, "duration_days": 4, "infrastructure_damage": 3}),
        "status": "Submitted", "assigned_to": None,
        "days_ago": 2, "cluster_id": None,
        "duplicate_of_ref": "CIV-1019",
    },

    # ── Duplicate Group E: Overflowing drain on Gandhi Road (CIV-1021 primary) ──
    {
        "tracking_id": "CIV-1021",
        "title": "Open drain overflowing on Gandhi Road near school",
        "description": "The open drain on Gandhi Road opposite St. Xavier's School has been overflowing for a week. Children walk through dirty water every morning.",
        "summary": "Open drain overflow on Gandhi Road near school.",
        "category": "Drainage",
        "latitude": 28.6250, "longitude": 77.2130,
        "address": "Gandhi Road, opp. St. Xavier's School, Greenvale",
        "priority_score": 67,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 4, "duration_days": 7, "infrastructure_damage": 2}),
        "status": "Assigned", "assigned_to": "Officer Singh",
        "days_ago": 9, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1022",
        "title": "Sewage water on footpath near Gandhi Road school",
        "description": "Dirty drain water is spilling onto the footpath outside the school on Gandhi Road. Children getting wet shoes, health risk.",
        "summary": "Drain water on school footpath on Gandhi Road.",
        "category": "Drainage",
        "latitude": 28.6251, "longitude": 77.2131,
        "address": "Gandhi Road, near St. Xavier's, Greenvale",
        "priority_score": 63,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 3, "duration_days": 6, "infrastructure_damage": 1}),
        "status": "Submitted", "assigned_to": None,
        "days_ago": 3, "cluster_id": None,
        "duplicate_of_ref": "CIV-1021",
    },

    # ── Remaining 18 varied independent reports ──
    {
        "tracking_id": "CIV-1023",
        "title": "Streetlight pole tilted dangerously on Civil Lines",
        "description": "A lamp post on Civil Lines Road is tilting at about 45 degrees after the storm. Likely to fall on traffic below.",
        "summary": "Tilted lamp post on Civil Lines Road, falling risk.",
        "category": "Streetlight",
        "latitude": 28.6260, "longitude": 77.2075,
        "address": "Civil Lines Road, near Gate No. 3, Greenvale",
        "priority_score": 82,
        "priority_reason": json.dumps({"safety_risk": 4, "affected_population": 3, "duration_days": 2, "infrastructure_damage": 2}),
        "status": "Assigned", "assigned_to": "Officer Nair",
        "days_ago": 2, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1024",
        "title": "Waterlogging in Shastri Park residential area",
        "description": "Ground floor apartments in Shastri Park are flooded. Water has been standing for 2 days with no relief.",
        "summary": "Ground-floor flooding in Shastri Park for 2 days.",
        "category": "Waterlogging",
        "latitude": 28.6180, "longitude": 77.2090,
        "address": "Shastri Park, Block D, Greenvale",
        "priority_score": 70,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 4, "duration_days": 2, "infrastructure_damage": 3}),
        "status": "Under Review", "assigned_to": None,
        "days_ago": 2, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1025",
        "title": "Garbage dump near children's park on Elm Street",
        "description": "People have started illegally dumping garbage near the children's park on Elm Street. Foul smell; children can't play.",
        "summary": "Illegal garbage dumping near children's park on Elm Street.",
        "category": "Garbage",
        "latitude": 28.6235, "longitude": 77.2155,
        "address": "Elm Street, Children's Park Gate, Greenvale",
        "priority_score": 52,
        "priority_reason": json.dumps({"safety_risk": 2, "affected_population": 3, "duration_days": 4, "infrastructure_damage": 0}),
        "status": "Resolved", "assigned_to": "Officer Reddy",
        "days_ago": 20, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1026",
        "title": "Water supply irregular in Hill View Colony",
        "description": "Water supply in Hill View Colony comes only for 20 minutes a day instead of 2 hours. Pressure very low.",
        "summary": "Low-pressure, short-duration water supply in Hill View Colony.",
        "category": "Water Supply",
        "latitude": 28.6190, "longitude": 77.2180,
        "address": "Hill View Colony, Greenvale",
        "priority_score": 45,
        "priority_reason": json.dumps({"safety_risk": 2, "affected_population": 4, "duration_days": 10, "infrastructure_damage": 1}),
        "status": "Under Review", "assigned_to": None,
        "days_ago": 10, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1027",
        "title": "Road median broken and jutting out on Patel Nagar flyover",
        "description": "A concrete median divider on the Patel Nagar flyover access road is broken and sticking out. Vehicles have already scraped against it.",
        "summary": "Broken median jutting into traffic on Patel Nagar flyover road.",
        "category": "Road Damage",
        "latitude": 28.6160, "longitude": 77.2095,
        "address": "Patel Nagar Flyover Access Road, Greenvale",
        "priority_score": 74,
        "priority_reason": json.dumps({"safety_risk": 4, "affected_population": 3, "duration_days": 3, "infrastructure_damage": 3}),
        "status": "Assigned", "assigned_to": "Officer Singh",
        "days_ago": 3, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1028",
        "title": "Drainage ditch overflowing into vegetable market",
        "description": "The main drainage ditch behind the vegetable market is overflowing. Wastewater mixing with vegetable stalls — serious hygiene issue.",
        "summary": "Drainage overflow contaminating vegetable market.",
        "category": "Drainage",
        "latitude": 28.6210, "longitude": 77.2048,
        "address": "Behind New Vegetable Market, Greenvale",
        "priority_score": 77,
        "priority_reason": json.dumps({"safety_risk": 4, "affected_population": 4, "duration_days": 4, "infrastructure_damage": 2}),
        "status": "Under Review", "assigned_to": None,
        "days_ago": 4, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1029",
        "title": "Broken streetlight causing accidents near bus stop",
        "description": "The streetlight near Sector 4 Bus Stop has been off for 2 weeks. Two minor accidents have already happened there at night.",
        "summary": "Non-functional streetlight near Sector 4 bus stop, causing accidents.",
        "category": "Streetlight",
        "latitude": 28.6200, "longitude": 77.2110,
        "address": "Sector 4 Bus Stop, Greenvale",
        "priority_score": 61,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 3, "duration_days": 14, "infrastructure_damage": 1}),
        "status": "Resolved", "assigned_to": "Officer Nair",
        "days_ago": 28, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1030",
        "title": "Garbage not collected from Sunshine Apartments for 10 days",
        "description": "Sunshine Apartments on Ring Road has not had garbage collection in 10 days. Bins are overflowing into parking area.",
        "summary": "10-day garbage backlog at Sunshine Apartments.",
        "category": "Garbage",
        "latitude": 28.6225, "longitude": 77.2040,
        "address": "Sunshine Apartments, Ring Road, Greenvale",
        "priority_score": 56,
        "priority_reason": json.dumps({"safety_risk": 2, "affected_population": 3, "duration_days": 10, "infrastructure_damage": 0}),
        "status": "Resolved", "assigned_to": "Officer Reddy",
        "days_ago": 25, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1031",
        "title": "Water leaking from main pipe on Subhash Lane",
        "description": "A main water supply pipe is leaking on Subhash Lane. Large pool of water has formed. Road is getting damaged too.",
        "summary": "Main pipe leak on Subhash Lane damaging road.",
        "category": "Water Supply",
        "latitude": 28.6175, "longitude": 77.2140,
        "address": "Subhash Lane, near Post Office, Greenvale",
        "priority_score": 69,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 3, "duration_days": 2, "infrastructure_damage": 3}),
        "status": "Assigned", "assigned_to": "Officer Kumar",
        "days_ago": 2, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1032",
        "title": "Flood-like conditions near underpass on Ring Road",
        "description": "The underpass on Ring Road near Block 12 retains water every time it rains. Traffic jams for 2 km.",
        "summary": "Recurring waterlogging at Ring Road underpass.",
        "category": "Waterlogging",
        "latitude": 28.6165, "longitude": 77.2070,
        "address": "Ring Road Underpass, Block 12, Greenvale",
        "priority_score": 80,
        "priority_reason": json.dumps({"safety_risk": 4, "affected_population": 5, "duration_days": 6, "infrastructure_damage": 2}),
        "status": "In Progress", "assigned_to": "Officer Sharma",
        "days_ago": 6, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1033",
        "title": "Large stretch of road surface gone on Old Airport Road",
        "description": "Approximately 40 m of road surface has completely broken up on Old Airport Road. Not potholes — the entire asphalt layer is gone.",
        "summary": "40m of asphalt completely missing on Old Airport Road.",
        "category": "Road Damage",
        "latitude": 28.6145, "longitude": 77.2050,
        "address": "Old Airport Road, km 3, Greenvale",
        "priority_score": 85,
        "priority_reason": json.dumps({"safety_risk": 4, "affected_population": 4, "duration_days": 14, "infrastructure_damage": 5}),
        "status": "Assigned", "assigned_to": "Officer Reddy",
        "days_ago": 14, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1034",
        "title": "Drainage cover broken near school bus route",
        "description": "The drain cover near Daisy School on Lotus Road is broken. School buses pass here twice a day. Very risky.",
        "summary": "Broken drain cover on school bus route, Lotus Road.",
        "category": "Drainage",
        "latitude": 28.6270, "longitude": 77.2115,
        "address": "Lotus Road, near Daisy School, Greenvale",
        "priority_score": 79,
        "priority_reason": json.dumps({"safety_risk": 4, "affected_population": 3, "duration_days": 3, "infrastructure_damage": 1}),
        "status": "Under Review", "assigned_to": None,
        "days_ago": 3, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1035",
        "title": "No street lighting in entire sector 9 for a week",
        "description": "All streetlights in Sector 9 have been dark for 7 nights. Residents afraid to go out. Several chain snatching incidents reported.",
        "summary": "All streetlights in Sector 9 non-functional for 7 nights.",
        "category": "Streetlight",
        "latitude": 28.6150, "longitude": 77.2155,
        "address": "Sector 9, Greenvale",
        "priority_score": 76,
        "priority_reason": json.dumps({"safety_risk": 4, "affected_population": 4, "duration_days": 7, "infrastructure_damage": 1}),
        "status": "In Progress", "assigned_to": "Officer Nair",
        "days_ago": 7, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1036",
        "title": "Tap water turned yellow in Green Park locality",
        "description": "Tap water in Green Park area has been coming out yellowish-brown for 3 days. Undrinkable. Possible contamination.",
        "summary": "Discoloured (yellow) tap water in Green Park for 3 days.",
        "category": "Water Supply",
        "latitude": 28.6255, "longitude": 77.2060,
        "address": "Green Park, Block 2, Greenvale",
        "priority_score": 84,
        "priority_reason": json.dumps({"safety_risk": 4, "affected_population": 4, "duration_days": 3, "infrastructure_damage": 1}),
        "status": "In Progress", "assigned_to": "Officer Kumar",
        "days_ago": 3, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1037",
        "title": "Garbage collection van not coming to Rose Garden area",
        "description": "Our area (Rose Garden, Phase 2) is skipped by the garbage truck for the third consecutive week. Please investigate route.",
        "summary": "Garbage truck skipping Rose Garden Phase 2 for 3 weeks.",
        "category": "Garbage",
        "latitude": 28.6280, "longitude": 77.2085,
        "address": "Rose Garden, Phase 2, Greenvale",
        "priority_score": 42,
        "priority_reason": json.dumps({"safety_risk": 1, "affected_population": 3, "duration_days": 21, "infrastructure_damage": 0}),
        "status": "Resolved", "assigned_to": "Officer Reddy",
        "days_ago": 29, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1038",
        "title": "Road divider missing on Highway bypass near toll",
        "description": "The central divider on the Greenvale highway bypass near the toll plaza has been removed for construction and not replaced. Head-on collision risk.",
        "summary": "Missing central divider on highway bypass near toll — collision risk.",
        "category": "Road Damage",
        "latitude": 28.6135, "longitude": 77.2040,
        "address": "Greenvale Highway Bypass, near Toll Plaza",
        "priority_score": 88,
        "priority_reason": json.dumps({"safety_risk": 5, "affected_population": 4, "duration_days": 5, "infrastructure_damage": 3}),
        "status": "In Progress", "assigned_to": "Officer Singh",
        "days_ago": 5, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1039",
        "title": "Recurring waterlogging in basement parking of Metro View",
        "description": "Metro View Society's basement parking floods every time it rains because the drainage outlet is clogged. Cars damaged.",
        "summary": "Basement parking flood at Metro View due to clogged drain outlet.",
        "category": "Waterlogging",
        "latitude": 28.6242, "longitude": 77.2070,
        "address": "Metro View Society, Sector 11, Greenvale",
        "priority_score": 60,
        "priority_reason": json.dumps({"safety_risk": 2, "affected_population": 3, "duration_days": 15, "infrastructure_damage": 3}),
        "status": "Under Review", "assigned_to": None,
        "days_ago": 15, "cluster_id": None,
    },
    {
        "tracking_id": "CIV-1040",
        "title": "Broken water meter flooding footpath near City Hospital",
        "description": "A water meter near City Hospital main gate has burst. Water gushing onto the footpath 24/7 for 2 days. Wastage and slip hazard.",
        "summary": "Burst water meter outside City Hospital causing footpath flooding.",
        "category": "Water Supply",
        "latitude": 28.6188, "longitude": 77.2050,
        "address": "City Hospital Gate, Hospital Road, Greenvale",
        "priority_score": 72,
        "priority_reason": json.dumps({"safety_risk": 3, "affected_population": 4, "duration_days": 2, "infrastructure_damage": 2}),
        "status": "Assigned", "assigned_to": "Officer Kumar",
        "days_ago": 2, "cluster_id": None,
    },
]
# fmt: on

assert len(REPORTS_RAW) == 40, f"Expected 40 reports, got {len(REPORTS_RAW)}"


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------
def ensure_tables(conn: sqlite3.Connection) -> None:
    """Create tables if they don't exist (mirrors app.py init_db)."""
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS reports (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_id     TEXT    NOT NULL UNIQUE,
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
            priority_reason TEXT,
            duplicate_of    INTEGER REFERENCES reports(id),
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
    conn.commit()


def seed():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    ensure_tables(conn)

    # Wipe existing data for idempotence
    cur.execute("DELETE FROM status_history")
    cur.execute("DELETE FROM reports")
    cur.execute("DELETE FROM sqlite_sequence WHERE name IN ('reports','status_history')")
    conn.commit()

    # Collect duplicate refs before mutating dicts
    dup_refs: dict[str, str] = {
        r["tracking_id"]: r["duplicate_of_ref"]
        for r in REPORTS_RAW
        if "duplicate_of_ref" in r
    }

    # First pass: insert all reports (duplicate_of stays NULL)
    tracking_to_id: dict[str, int] = {}
    for r in REPORTS_RAW:
        days_ago = r.pop("days_ago")
        r.pop("duplicate_of_ref", None)
        created = ts(days_ago, hour=random.randint(8, 18), minute=random.randint(0, 59))
        updated = ts(days_ago / 2, hour=random.randint(8, 18), minute=random.randint(0, 59))

        cur.execute(
            """
            INSERT INTO reports (
                tracking_id, title, description, summary, category,
                latitude, longitude, address,
                priority_score, priority_level, priority_reason,
                cluster_id, status, assigned_to, created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                r["tracking_id"], r["title"], r["description"],
                r.get("summary"), r["category"],
                r["latitude"], r["longitude"], r["address"],
                r["priority_score"], priority(r["priority_score"]),
                r["priority_reason"],
                r.get("cluster_id"), r["status"], r.get("assigned_to"),
                created, updated,
            ),
        )
        row_id = cur.lastrowid
        tracking_to_id[r["tracking_id"]] = row_id

        # Status history
        history = make_history(days_ago, r["status"])
        for h in history:
            cur.execute(
                "INSERT INTO status_history (report_id, status, note, timestamp) VALUES (?,?,?,?)",
                (row_id, h["status"], h["note"], h["timestamp"]),
            )

    conn.commit()

    # Second pass: set duplicate_of and increment duplicate_count on primary
    for tid, ref in dup_refs.items():
        if ref:
            primary_id = tracking_to_id[ref]
            dup_id = tracking_to_id[tid]
            cur.execute("UPDATE reports SET duplicate_of = ? WHERE id = ?", (primary_id, dup_id))
            cur.execute(
                "UPDATE reports SET duplicate_count = duplicate_count + 1 WHERE id = ?",
                (primary_id,),
            )

    conn.commit()
    conn.close()

    print(f"[OK] Seeded {len(REPORTS_RAW)} synthetic reports into {DB_PATH}")
    print("  Duplicate groups: A(CIV-1011), B(CIV-1014), C(CIV-1016), D(CIV-1019), E(CIV-1021)")
    print("  + MG Road cluster duplicates: CIV-1004>1001, CIV-1005>1002, CIV-1006>1003")
    print("  Geographic cluster (CLU-MG7): CIV-1001 to CIV-1006")
    print("  Urgent safety issues: CIV-1007 (manhole), CIV-1008 (live wire),",
          "CIV-1009 (flooded underpass), CIV-1010 (collapsed road edge)")


if __name__ == "__main__":
    seed()
