#!/usr/bin/env python3
"""
Hyrox Planner — Backend Server
Serves static files + proxies/parses Hyrox results from results.hyrox.com
"""

import json
import os
import re
import urllib.request
import urllib.parse
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 3000
HYROX_BASE = "https://results.hyrox.com/season-8/"


def fetch_page(url):
    """Fetch a page with browser-like headers."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"[ERROR] Fetch failed: {e}")
        return None


def parse_time_to_seconds(time_str):
    """Convert HH:MM:SS or MM:SS to total seconds."""
    if not time_str:
        return 0
    time_str = time_str.strip()
    parts = re.findall(r'\d+', time_str)
    try:
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        elif len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 1:
            return int(parts[0])
    except (ValueError, IndexError):
        return 0
    return 0


def get_filters():
    """Fetch available filter options from the Hyrox results page."""
    url = HYROX_BASE + "?pid=list&pidp=ranking_nav&lang=EN_CAP"
    html = fetch_page(url)
    if not html:
        return {"cities": [], "genders": [], "age_groups": []}

    # Cities with their events (optgroups)
    optgroups = re.findall(
        r'<optgroup[^>]*label="([^"]*)"[^>]*>(.*?)</optgroup>',
        html, re.DOTALL
    )
    cities = []
    for label, content in optgroups:
        opts = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', content)
        events = []
        for val, olabel in opts:
            olabel = re.sub(r'<[^>]+>', '', olabel).strip()
            if val:
                events.append({"value": val, "label": olabel})
        if events:
            cities.append({"city": label, "events": events})

    # Gender options
    sex_sel = re.findall(r'id="search\[sex\]".*?</select>', html, re.DOTALL)
    genders = []
    if sex_sel:
        gopts = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', sex_sel[0])
        genders = [{"value": v, "label": re.sub(r'<[^>]+>', '', l).strip()} for v, l in gopts if v]

    # Age groups
    age_sel = re.findall(r'id="search\[age_class\]".*?</select>', html, re.DOTALL)
    age_groups = []
    if age_sel:
        aopts = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', age_sel[0])
        age_groups = [{"value": v, "label": re.sub(r'<[^>]+>', '', l).strip()} for v, l in aopts if v]

    return {"cities": cities, "genders": genders, "age_groups": age_groups}


# Cache filters (they don't change during a session)
_filters_cache = None


def cached_filters():
    global _filters_cache
    if _filters_cache is None:
        _filters_cache = get_filters()
    return _filters_cache


def search_athletes(first_name="", last_name="", event="", sex="", age_class=""):
    """Search for athletes on the Hyrox results page.

    If event is provided, search within that specific event (pid=list).
    Otherwise, search across all time ranking (pid=list_overall).
    """
    if event:
        # Event-specific search
        params = {
            "pid": "list",
            "pidp": "ranking_nav",
            "lang": "EN_CAP",
            "num_results": "25",
            "event": event,
        }
    else:
        # All-time ranking search
        params = {
            "pid": "list_overall",
            "pidp": "ranking_nav",
            "lang": "EN_CAP",
            "num_results": "25",
        }
    if last_name:
        params["search[name]"] = last_name
    if first_name:
        params["search[firstname]"] = first_name
    if sex:
        params["search[sex]"] = sex
    if age_class:
        params["search[age_class]"] = age_class

    url = HYROX_BASE + "?" + urllib.parse.urlencode(params)
    print(f"[SEARCH] {url}")
    html = fetch_page(url)
    if not html:
        return [], 0

    # Extract total results count
    count_match = re.findall(r'(\d+)\s*Results?', html)
    total = int(count_match[0]) if count_match else 0

    # Parse athlete rows: <li class=" list-active list-group-item row">
    rows = re.findall(
        r'<li\s+class="[^"]*list-active\s+list-group-item\s+row[^"]*">(.*?)</li>',
        html, re.DOTALL
    )

    athletes = []
    for row in rows:
        # Rank
        place_m = re.findall(r'type-place[^"]*"[^>]*>(\d+)</div>', row)
        place = place_m[0] if place_m else ""

        # Name + detail link
        name_link = re.findall(r'<a\s+href="([^"]*)"[^>]*>([^<]+)</a>', row)
        if not name_link:
            continue
        raw_url = name_link[0][0]
        # Unescape HTML entities in the URL
        detail_url = raw_url.replace("&amp;", "&")
        name = name_link[0][1].strip()

        # City
        city_m = re.findall(r'field-gimmick_10[^"]*"[^>]*>(?:<div[^>]*>.*?</div>)?\s*([^<]+)', row, re.DOTALL)
        city = city_m[0].strip() if city_m else ""

        # Time
        time_m = re.findall(r'field-time_finish_netto[^"]*"[^>]*>(?:<div[^>]*>.*?</div>)?\s*([\d:]+)', row, re.DOTALL)
        overall_time = time_m[0].strip() if time_m else ""

        athletes.append({
            "place": place,
            "name": name,
            "city": city,
            "overall_time": overall_time,
            "detail_url": detail_url,
        })

    return athletes, total


def get_athlete_splits(detail_path):
    """Fetch an athlete's detail page and extract all split times."""
    # Decode any double-encoded URLs
    detail_path = urllib.parse.unquote(detail_path)

    if detail_path.startswith("http"):
        url = detail_path
    elif detail_path.startswith("?") or detail_path.startswith("/"):
        url = HYROX_BASE + detail_path.lstrip("/")
    else:
        url = HYROX_BASE + "?" + detail_path

    if "lang=" not in url:
        url += "&lang=EN_CAP"

    print(f"[DETAIL] {url}")
    html = fetch_page(url)
    if not html:
        return {}

    splits = {}

    # Station mapping: label in HTML → our station ID
    station_map = {
        "1000m SkiErg": "ski_erg",
        "SkiErg": "ski_erg",
        "50m Sled Push": "sled_push",
        "Sled Push": "sled_push",
        "50m Sled Pull": "sled_pull",
        "Sled Pull": "sled_pull",
        "80m Burpee Broad Jump": "burpee_broad_jump",
        "Burpee Broad Jump": "burpee_broad_jump",
        "1000m Row": "rowing",
        "Row": "rowing",
        "200m Farmers Carry": "farmers_carry",
        "Farmers Carry": "farmers_carry",
        "100m Sandbag Lunges": "sandbag_lunges",
        "Sandbag Lunges": "sandbag_lunges",
        "Wall Balls": "wall_balls",
    }

    # Extract station times: pattern is <th>Station Name</th> ... <td>HH:MM:SS</td>
    # The detail page uses <tr> rows with <th class="desc">label</th> and <td class="f-time_XX">time</td>
    tr_rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL)

    for tr in tr_rows:
        # Get the label (th with class desc, or first th)
        label_m = re.findall(r'<th[^>]*class="desc"[^>]*>(.*?)</th>', tr, re.DOTALL)
        if not label_m:
            label_m = re.findall(r'<th[^>]*>(.*?)</th>', tr, re.DOTALL)
        if not label_m:
            continue

        label = re.sub(r'<[^>]+>', '', label_m[0]).strip()

        # Get the time (first td with a time-like value)
        time_m = re.findall(r'<td[^>]*>\s*(\d{2}:\d{2}:\d{2})\s*</td>', tr)
        if not time_m:
            time_m = re.findall(r'<td[^>]*>\s*(\d{1,2}:\d{2})\s*</td>', tr)
        if not time_m:
            continue

        time_str = time_m[0]
        seconds = parse_time_to_seconds(time_str)
        if seconds == 0:
            continue

        # Check if it's a station
        for station_label, station_id in station_map.items():
            if station_label.lower() in label.lower():
                splits[station_id] = seconds
                break

        # Check if it's a run (Running 1, Running 2, etc.)
        run_m = re.match(r'Running\s+(\d)', label)
        if run_m:
            splits[f"run_{run_m.group(1)}"] = seconds

        # Roxzone
        if "roxzone" in label.lower():
            splits["roxzone"] = seconds

        # Overall / finish
        if "finish" in label.lower() or "overall" in label.lower():
            splits["overall"] = seconds

    return splits


# ============================================================
# HTTP Server
# ============================================================

class HyroxHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)

        if parsed.path == "/api/filters":
            self._handle_filters()
        elif parsed.path == "/api/search":
            self._handle_search(query)
        elif parsed.path == "/api/athlete":
            self._handle_athlete(query)
        else:
            super().do_GET()

    def _handle_filters(self):
        try:
            filters = cached_filters()
            self._json(filters)
        except Exception as e:
            print(f"[ERROR] Filters: {e}")
            self._json({"error": str(e)}, 500)

    def _handle_search(self, query):
        first = query.get("first_name", [""])[0]
        last = query.get("last_name", [""])[0]
        event = query.get("event", [""])[0]
        sex = query.get("sex", [""])[0]
        age_class = query.get("age_class", [""])[0]
        if not first and not last:
            self._json({"error": "Provide first_name or last_name"}, 400)
            return
        try:
            athletes, total = search_athletes(
                first_name=first, last_name=last,
                event=event, sex=sex, age_class=age_class
            )
            self._json({"athletes": athletes, "count": total})
        except Exception as e:
            print(f"[ERROR] Search: {e}")
            self._json({"error": str(e)}, 500)

    def _handle_athlete(self, query):
        url = query.get("url", [""])[0]
        if not url:
            self._json({"error": "Provide url parameter"}, 400)
            return
        try:
            splits = get_athlete_splits(url)
            self._json({"splits": splits})
        except Exception as e:
            print(f"[ERROR] Detail: {e}")
            self._json({"error": str(e)}, 500)

    def _json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        if "/api/" in str(args[0]):
            print(f"[API] {args[0]}")


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), HyroxHandler)
    print(f"Hyrox Planner running at http://localhost:{PORT}")
    print(f"  GET /api/search?last_name=Smith")
    print(f"  GET /api/athlete?url=<detail_path>")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.shutdown()
