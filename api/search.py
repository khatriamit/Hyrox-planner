"""Vercel serverless function: Search Hyrox athletes."""

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
    except Exception as e:
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


def search_athletes(first_name="", last_name="", event="", sex="", age_class=""):
    if event:
        params = {"pid": "list", "pidp": "ranking_nav", "lang": "EN_CAP", "num_results": "25", "event": event}
    else:
        params = {"pid": "list_overall", "pidp": "ranking_nav", "lang": "EN_CAP", "num_results": "25"}

    if last_name:
        params["search[name]"] = last_name
    if first_name:
        params["search[firstname]"] = first_name
    if sex:
        params["search[sex]"] = sex
    if age_class:
        params["search[age_class]"] = age_class

    url = HYROX_BASE + "?" + urllib.parse.urlencode(params)
    html = fetch_page(url)
    if not html:
        return [], 0

    count_match = re.findall(r'(\d+)\s*Results?', html)
    total = int(count_match[0]) if count_match else 0

    rows = re.findall(
        r'<li\s+class="[^"]*list-active\s+list-group-item\s+row[^"]*">(.*?)</li>',
        html, re.DOTALL
    )

    athletes = []
    for row in rows:
        place_m = re.findall(r'type-place[^"]*"[^>]*>(\d+)</div>', row)
        place = place_m[0] if place_m else ""
        name_link = re.findall(r'<a\s+href="([^"]*)"[^>]*>([^<]+)</a>', row)
        if not name_link:
            continue
        detail_url = name_link[0][0].replace("&amp;", "&")
        name = name_link[0][1].strip()
        city_m = re.findall(r'field-gimmick_10[^"]*"[^>]*>(?:<div[^>]*>.*?</div>)?\s*([^<]+)', row, re.DOTALL)
        city = city_m[0].strip() if city_m else ""
        time_m = re.findall(r'field-time_finish_netto[^"]*"[^>]*>(?:<div[^>]*>.*?</div>)?\s*([\d:]+)', row, re.DOTALL)
        overall_time = time_m[0].strip() if time_m else ""
        athletes.append({"place": place, "name": name, "city": city, "overall_time": overall_time, "detail_url": detail_url})

    return athletes, total


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)

        first = query.get("first_name", [""])[0]
        last = query.get("last_name", [""])[0]
        event = query.get("event", [""])[0]
        sex = query.get("sex", [""])[0]
        age_class = query.get("age_class", [""])[0]

        if not first and not last:
            self._json({"error": "Provide first_name or last_name"}, 400)
            return

        try:
            athletes, total = search_athletes(first_name=first, last_name=last, event=event, sex=sex, age_class=age_class)
            self._json({"athletes": athletes, "count": total})
        except Exception as e:
            self._json({"error": str(e)}, 500)

    def _json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)
