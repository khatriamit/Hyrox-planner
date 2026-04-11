"""Garmin OAuth initiation endpoint for Vercel."""
import json
import os


def handler(event, context):
    garmin_key = os.environ.get("GARMIN_KEY", "")
    garmin_secret = os.environ.get("GARMIN_SECRET", "")

    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }

    if not garmin_key or not garmin_secret:
        body = json.dumps({
            "error": "Garmin API credentials not configured",
            "hint": "Set GARMIN_KEY and GARMIN_SECRET in Vercel environment variables"
        })
        return {"statusCode": 501, "headers": headers, "body": body}

    # TODO: Implement full OAuth 1.0a request token flow
    # 1. Request token from Garmin
    # 2. Store token secret in session/DB
    # 3. Return auth_url for user redirect
    body = json.dumps({
        "error": "Garmin OAuth 1.0a flow not yet implemented",
        "hint": "Use demo mode for testing"
    })
    return {"statusCode": 501, "headers": headers, "body": body}
