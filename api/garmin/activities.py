"""Garmin activities endpoint for Vercel."""
import json


def handler(event, context):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }

    # TODO: Implement with stored OAuth tokens
    # 1. Look up user's Garmin access token
    # 2. Fetch activities from Garmin Health API
    # 3. Return formatted activity list
    body = json.dumps({
        "error": "Not implemented — use demo mode for testing",
        "activities": []
    })
    return {"statusCode": 501, "headers": headers, "body": body}
