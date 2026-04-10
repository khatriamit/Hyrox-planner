"""Vercel serverless function: Get Hyrox filter options (cities, genders, age groups)."""

import json
import re
import urllib.request
from http.server import BaseHTTPRequestHandler

HYROX_BASE = "https://results.hyrox.com/season-8/"


def fetch_page(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception:
        return None


def get_filters():
    url = HYROX_BASE + "?pid=list&pidp=ranking_nav&lang=EN_CAP"
    html = fetch_page(url)
    if not html:
        return {"cities": [], "genders": [], "age_groups": []}

    optgroups = re.findall(r'<optgroup[^>]*label="([^"]*)"[^>]*>(.*?)</optgroup>', html, re.DOTALL)
    cities = []
    for label, content in optgroups:
        opts = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', content)
        events = [{"value": v, "label": re.sub(r'<[^>]+>', '', l).strip()} for v, l in opts if v]
        if events:
            cities.append({"city": label, "events": events})

    sex_sel = re.findall(r'id="search\[sex\]".*?</select>', html, re.DOTALL)
    genders = []
    if sex_sel:
        gopts = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', sex_sel[0])
        genders = [{"value": v, "label": re.sub(r'<[^>]+>', '', l).strip()} for v, l in gopts if v]

    age_sel = re.findall(r'id="search\[age_class\]".*?</select>', html, re.DOTALL)
    age_groups = []
    if age_sel:
        aopts = re.findall(r'<option[^>]*value="([^"]*)"[^>]*>(.*?)</option>', age_sel[0])
        age_groups = [{"value": v, "label": re.sub(r'<[^>]+>', '', l).strip()} for v, l in aopts if v]

    return {"cities": cities, "genders": genders, "age_groups": age_groups}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            filters = get_filters()
            self._json(filters)
        except Exception as e:
            self._json({"error": str(e)}, 500)

    def _json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "s-maxage=3600")
        self.end_headers()
        self.wfile.write(body)
