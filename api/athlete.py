"""Vercel serverless function: Get athlete split times."""

import json
import re
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler

HYROX_BASE = "https://results.hyrox.com/season-8/"


def fetch_page(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception:
        return None


def parse_time_to_seconds(time_str):
    if not time_str:
        return 0
    parts = re.findall(r'\d+', time_str.strip())
    try:
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        elif len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
    except (ValueError, IndexError):
        pass
    return 0


def get_athlete_splits(detail_path):
    if detail_path.startswith("http"):
        url = detail_path
    elif detail_path.startswith("?") or detail_path.startswith("/"):
        url = HYROX_BASE + detail_path.lstrip("/")
    else:
        url = HYROX_BASE + "?" + detail_path

    if "lang=" not in url:
        url += "&lang=EN_CAP"

    html = fetch_page(url)
    if not html:
        return {}

    station_map = {
        "1000m SkiErg": "ski_erg", "SkiErg": "ski_erg",
        "50m Sled Push": "sled_push", "Sled Push": "sled_push",
        "50m Sled Pull": "sled_pull", "Sled Pull": "sled_pull",
        "80m Burpee Broad Jump": "burpee_broad_jump", "Burpee Broad Jump": "burpee_broad_jump",
        "1000m Row": "rowing", "Row": "rowing",
        "200m Farmers Carry": "farmers_carry", "Farmers Carry": "farmers_carry",
        "100m Sandbag Lunges": "sandbag_lunges", "Sandbag Lunges": "sandbag_lunges",
        "Wall Balls": "wall_balls",
    }

    splits = {}
    tr_rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL)

    for tr in tr_rows:
        label_m = re.findall(r'<th[^>]*class="desc"[^>]*>(.*?)</th>', tr, re.DOTALL)
        if not label_m:
            label_m = re.findall(r'<th[^>]*>(.*?)</th>', tr, re.DOTALL)
        if not label_m:
            continue
        label = re.sub(r'<[^>]+>', '', label_m[0]).strip()

        time_m = re.findall(r'<td[^>]*>\s*(\d{2}:\d{2}:\d{2})\s*</td>', tr)
        if not time_m:
            time_m = re.findall(r'<td[^>]*>\s*(\d{1,2}:\d{2})\s*</td>', tr)
        if not time_m:
            continue

        seconds = parse_time_to_seconds(time_m[0])
        if seconds == 0:
            continue

        for station_label, station_id in station_map.items():
            if station_label.lower() in label.lower():
                splits[station_id] = seconds
                break

        run_m = re.match(r'Running\s+(\d)', label)
        if run_m:
            splits[f"run_{run_m.group(1)}"] = seconds
        if "roxzone" in label.lower():
            splits["roxzone"] = seconds
        if "finish" in label.lower() or "overall" in label.lower():
            splits["overall"] = seconds

    return splits


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        url = query.get("url", [""])[0]

        if not url:
            self._json({"error": "Provide url parameter"}, 400)
            return

        try:
            splits = get_athlete_splits(url)
            self._json({"splits": splits})
        except Exception as e:
            self._json({"error": str(e)}, 500)

    def _json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)
