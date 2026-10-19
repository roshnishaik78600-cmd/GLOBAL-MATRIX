"""Integration checks; reads runtime secrets without printing credentials or URLs."""
import os
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
import requests

base = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/"
key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
headers = {"apikey": key, "Content-Type": "application/json"}
if not key.startswith("sb_"):
    headers["Authorization"] = "Bearer " + key

def call(path, data, method="POST"):
    result = requests.request(method, base + path, headers=headers, json=data, timeout=20)
    if not result.ok:
        raise AssertionError("Database claim test request failed: " + str(result.status_code))
    return result.json() if result.content else None

users = [str(uuid.uuid4()), str(uuid.uuid4())]
hashes = [hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest() for _ in range(2)]
try:
    for _ in range(5):
        assert call("rpc/claim_request_window", {"p_key": hashes[0], "p_limit": 5, "p_window_seconds": 3600})["ok"]
    denied = call("rpc/claim_request_window", {"p_key": hashes[0], "p_limit": 5, "p_window_seconds": 3600})
    assert denied["ok"] is False and denied["waitSeconds"] > 0
    def claim(_):
        return call("rpc/claim_request_window", {"p_key": hashes[1], "p_limit": 5, "p_window_seconds": 3600})["ok"]
    with ThreadPoolExecutor(max_workers=8) as pool:
        assert sum(pool.map(claim, range(8))) == 5
    before = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
    call("brief_claims", [{"user_id": users[0], "at": before} for _ in range(5)])
    assert call("rpc/reserve_brief_claim", {"p_user_id": users[0], "p_daily_limit": 5, "p_interval_ms": 20000})["reason"] == "daily_limit"
    call("brief_claims", [{"user_id": users[1], "at": before} for _ in range(201)])
    assert call("rpc/reserve_brief_claim", {"p_user_id": users[1], "p_daily_limit": 0, "p_interval_ms": 20000})["ok"]
    assert call("rpc/reserve_brief_claim", {"p_user_id": users[1], "p_daily_limit": 0, "p_interval_ms": 20000})["reason"] == "interval"
    summary = call("rpc/public_source_summary", {})
    assert isinstance(summary["runs"], list)
    for row in summary["runs"]:
        assert set(row) == {"source_id", "key", "ok", "retrieved_at", "problem"}
        assert row["problem"] is None or row["problem"] == "The latest refresh did not return usable data. Cached readings remain available with their original dates."
    print("PASS: five/hour, concurrent claim ceiling, free five/day, unlimited Business, interval protection, sanitized summary")
finally:
    for user in users:
        call("brief_claims?user_id=eq." + user, None, "DELETE")
    for hashed in hashes:
        call("request_windows?key_hash=eq." + hashed, None, "DELETE")