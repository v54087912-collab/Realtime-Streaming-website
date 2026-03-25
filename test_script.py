import urllib.request
import json
data = json.dumps({'url': 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}).encode('utf-8')
req = urllib.request.Request('http://localhost:4000/api/share', data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
print(resp.read().decode())
