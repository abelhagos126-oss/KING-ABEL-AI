
import os
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from google import genai

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)

SIGNATURE = "There was one king, and his name is Abel."

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

# Faster Gemini model
MODEL_NAME = "gemini-3.1-flash-lite"


@app.route("/", methods=["GET"])
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "reply": SIGNATURE + "\n\nPlease enter a message."
        }), 400

    if not client:
        return jsonify({
            "reply": SIGNATURE + "\n\nAPI key not found. Check your .env file."
        }), 500

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=(
                "You are THE KING ABEL AI. "
                "Reply briefly and naturally. "
                "Understand and respond in English or Amharic. "
                "Always use the language of the user. "
                "Do not repeat the signature.\n\n"
                + message
            ),
            config={"max_output_tokens": 150}
        )

        answer = response.text or "I could not generate a response."

        return jsonify({
            "reply": SIGNATURE + "\n\n" + answer
        })

    except Exception as error:
        print("Gemini error:", str(error))

        return jsonify({
            "reply": (
                SIGNATURE
                + "\n\nGemini is temporarily unavailable. "
                + "Please try again in a little while."
            )
        }), 503


@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


if __name__ == "__main__":
    print("Starting THE KING ABEL AI...")
    app.run(host="127.0.0.1", port=5001, debug=False)
