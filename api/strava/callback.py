"""Strava OAuth2 callback — exchange code for access token."""
import os
import json
from http.server import BaseHTTPRequestHandler
import urllib.parse
import urllib.request

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        code = params.get('code', [None])[0]

        if not code:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<html><body><script>window.opener.postMessage({type:"strava_error",error:"No code received"},"*");window.close();</script></body></html>')
            return

        client_id = os.environ.get('STRAVA_CLIENT_ID', '')
        client_secret = os.environ.get('STRAVA_CLIENT_SECRET', '')

        if not client_id or not client_secret:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<html><body><script>window.opener.postMessage({type:"strava_error",error:"Server not configured"},"*");window.close();</script></body></html>')
            return

        # Exchange code for token
        token_data = json.dumps({
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'grant_type': 'authorization_code',
        }).encode()

        req = urllib.request.Request(
            'https://www.strava.com/oauth/token',
            data=token_data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read())

            # Send token back to the app via postMessage
            token_json = json.dumps({
                'type': 'strava_auth',
                'access_token': data.get('access_token', ''),
                'refresh_token': data.get('refresh_token', ''),
                'expires_at': data.get('expires_at', 0),
                'athlete': data.get('athlete', {}),
            })

            html = f'''<html><body><script>
                window.opener.postMessage({token_json}, "*");
                window.close();
            </script><p>Connected! This window will close...</p></body></html>'''

            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(html.encode())

        except Exception as e:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            error_html = f'<html><body><script>window.opener.postMessage({{type:"strava_error",error:"{str(e)}"}}, "*");window.close();</script></body></html>'
            self.wfile.write(error_html.encode())
