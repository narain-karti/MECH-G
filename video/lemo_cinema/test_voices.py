import urllib.request, json
req = urllib.request.Request('https://api.elevenlabs.io/v1/voices', headers={'xi-api-key': 'sk_83d3bccc2d129c6d6db3f5bb6c6fa2e34f4164305507d1f8'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        for v in data.get('voices', []):
            labels = v.get('labels', {})
            print(f"{v['name']} ({labels.get('gender')}, {labels.get('accent')}): {v['voice_id']}")
except Exception as e:
    print('Error:', e)
