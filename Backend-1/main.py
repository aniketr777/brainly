import os
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
from googleapiclient.discovery import build

# Load environment variables from .env file
load_dotenv()

# --- Environment Variable Setup ---
# It's good practice to check for all required environment variables at startup.
YT_API_KEY = os.getenv("YT_API_KEY")

if not YT_API_KEY:
    raise ValueError("YT_API_KEY environment variable not set.")

# --- FastAPI App Initialization ---
app = FastAPI(
    title="YouTube Transcript API",
    description="An API to fetch YouTube video transcripts and metadata."
)

# --- YouTube API Setup ---
try:
    youtube_api = build("youtube", "v3", developerKey=YT_API_KEY)
except Exception as e:
    raise RuntimeError(f"Failed to initialize YouTube API client: {e}")


# ---------------- Helper Functions ----------------

def extract_video_id(link: str):
    """
    Extracts the YouTube video ID from various URL formats.
    """
    # Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    match = re.search(r"v=([a-zA-Z0-9_-]{11})", link)
    if match:
        return match.group(1)
    
    # Shortened URL: https://youtu.be/VIDEO_ID
    match = re.search(r"youtu\.be/([a-zA-Z0-9_-]{11})", link)
    if match:
        return match.group(1)
        
    return None

def fetch_transcript_from_api(video_id: str, prefer_lang: str = "en"):
    """
    Fetches the transcript for a given video ID.
    This version creates an instance of the API client to be compatible with
    different library versions.
    """
    try:
        # CORRECTED: Create an instance of the API client
        api = YouTubeTranscriptApi()
        # Get the list of all available transcripts
        transcript_list = api.list(video_id)
        
        # Try to find a transcript in the preferred language
        transcript = transcript_list.find_transcript([prefer_lang])
        return transcript.fetch()

    except(IndexError, NoTranscriptFound):
             raise HTTPException(status_code=404, detail="No transcripts were found for this video.")

    except TranscriptsDisabled:
        # If transcripts are disabled for the video.
        raise HTTPException(status_code=403, detail="Transcripts are disabled for this video.")
    except Exception as e:
        # Catch any other unexpected errors.
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


def fetch_video_metadata(video_id: str):
    """
    Fetches video metadata (title, channel, stats) from the YouTube Data API.
    """
    try:
        request = youtube_api.videos().list(part="snippet,statistics", id=video_id)
        response = request.execute()
        
        if not response.get("items"):
            return None
            
        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {}) # Use .get for safety
        
        return {
            "title": snippet.get("title"),
            "channel": snippet.get("channelTitle"),
            "publish_date": snippet.get("publishedAt"),
            "description": snippet.get("description"),
            "views": stats.get("viewCount"),
            "likes": stats.get("likeCount"),
        }
    except Exception as e:
        # If the API call fails, we can return a partial error or raise
        print(f"Error fetching metadata: {e}")
        return {"error": "Could not fetch video metadata."}


# ---------------- API Endpoint ----------------

class YouTubeRequest(BaseModel):
    link: str
    lang: str = "en"


# Using standard 'def' is better here as the helper functions are synchronous (blocking).
# FastAPI will run this in a separate thread pool automatically.
@app.post("/get-transcript")
def get_youtube_data(request: YouTubeRequest):

    video_id = extract_video_id(request.link)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube link provided.")

    # Fetch transcript and metadata
    transcript_data = fetch_transcript_from_api(video_id, prefer_lang=request.lang)
    metadata = fetch_video_metadata(video_id)
    # print(transcript_data)
    # Combine the transcript text into a single string
    transcript_text = " ".join([item.text for item in transcript_data])
    
    # Corrected the dictionary keys to be strings
    return {
        "metadata": metadata,
        "transcript": transcript_text,
        # "full_transcript_data": transcript_data # Also returning the timed data
    }

# To run this app, save it as a file (e.g., main.py) and run:
# uvicorn main:app --reload
