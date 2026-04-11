"""Strava OAuth2 — redirect user to Strava authorization page."""
import os
from http.server import BaseHTTPRequestHandler
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        client_id = os.environ.get('STRAVA_CLIENT_ID', '')
        redirect_uri = os.environ.get('STRAVA_REDIRECT_URI', '')

        if not client_id or not redirect_uri:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error":"STRAVA_CLIENT_ID and STRAVA_REDIRECT_URI not configured in Vercel env vars"}')
            return

        params = urllib.parse.urlencode({
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'activity:read_all,profile:read_all',
            'approval_prompt': 'auto',
        })

        auth_url = f'https://www.strava.com/oauth/authorize?{params}'
        self.send_response(302)
        self.send_header('Location', auth_url)
        self.end_headers()
