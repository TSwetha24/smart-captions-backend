import sys
import whisper
import json

audio_path = sys.argv[1]

model = whisper.load_model("small")

# Transcribe audio
result = model.transcribe(audio_path)

# Print segments as JSON (Node.js will read this)
print(json.dumps(result["segments"]))
