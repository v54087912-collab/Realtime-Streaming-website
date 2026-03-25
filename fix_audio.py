# The user wants "Audio Change Feature like MX Player to Chage the audio of Dual Audio Movie"
# The existing initAudioTracks works natively if video.audioTracks is supported.
# But what if HLS is used? Let's check if Hls.js audio track API is integrated.

import re

with open('player.js', 'r') as f:
    content = f.read()

# Let's see if HLS is loaded:
print("HLS usage:", bool(re.search(r'hls\.js', content, re.IGNORECASE)))
