import os
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled
from googleapiclient.discovery import build

load_dotenv()

YT_API_KEY = os.getenv("YT_API_KEY")

if not YT_API_KEY:
    raise ValueError("YT_API_KEY not found")

app = FastAPI(title="YouTube Transcript API")

try:
    youtube_api = build("youtube", "v3", developerKey=YT_API_KEY)
except Exception as e:
    raise RuntimeError(f"Failed to initialize YouTube API: {e}")


def extract_video_id(link: str):
    match = re.search(r"v=([a-zA-Z0-9_-]{11})", link)
    if match:
        return match.group(1)
    match = re.search(r"youtu\.be/([a-zA-Z0-9_-]{11})", link)
    if match:
        return match.group(1)
    return None


def fetch_transcript_from_api(video_id: str, prefer_lang: str = "en"):
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        transcript = transcript_list.find_transcript([prefer_lang])
        return transcript.fetch()
    except (IndexError, NoTranscriptFound):
        raise HTTPException(status_code=404, detail="No transcripts found")
    except TranscriptsDisabled:
        raise HTTPException(status_code=403, detail="Transcripts disabled")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def fetch_video_metadata(video_id: str):
    try:
        request = youtube_api.videos().list(part="snippet,statistics", id=video_id)
        response = request.execute()
        if not response.get("items"):
            return None
        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})
        return {
            "title": snippet.get("title"),
            "channel": snippet.get("channelTitle"),
            "publish_date": snippet.get("publishedAt"),
            "description": snippet.get("description"),
            "views": stats.get("viewCount"),
            "likes": stats.get("likeCount"),
        }
    except Exception:
        return {"error": "Failed to fetch metadata"}


class YouTubeRequest(BaseModel):
    link: str
    lang: str = "en"


@app.post("/get-transcript")
def get_youtube_data(request: YouTubeRequest):
    video_id = extract_video_id(request.link)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube link")
    transcript_data = fetch_transcript_from_api(video_id, prefer_lang=request.lang)
    metadata = fetch_video_metadata(video_id)
    transcript_text = " ".join([item.text for item in transcript_data])
    return {
        "metadata": metadata,
        "transcript": transcript_text
    }

@app.get("/")
def starting():
    print("port 8000 working")
    return {"message": "Server running on port 8000"}
