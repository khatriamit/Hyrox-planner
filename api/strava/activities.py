"""Strava API — fetch athlete activities with access token."""
import os
import json
from http.server import BaseHTTPRequestHandler
import urllib.parse
import urllib.request

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        access_token = params.get('token', [None])[0]
        page = params.get('page', ['1'])[0]
        per_page = params.get('per_page', ['30'])[0]

        if not access_token:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"error":"Missing token parameter"}')
            return

        try:
            url = f'https://www.strava.com/api/v3/athlete/activities?page={page}&per_page={per_page}'
            req = urllib.request.Request(url, headers={
                'Authorization': f'Bearer {access_token}'
            })

            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read())

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())

        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e), 'code': e.code}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
