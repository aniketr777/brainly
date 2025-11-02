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
    raise ValueError("YT_API_KEY environment variable not set.")

app = FastAPI(
    title="YouTube Transcript API",
    description="An API to fetch YouTube video transcripts and metadata."
)

try:
    youtube_api = build("youtube", "v3", developerKey=YT_API_KEY)
except Exception as e:
    raise RuntimeError(f"Failed to initialize YouTube API client: {e}")




def extract_video_id(link: str):
    """
    Extracts the YouTube video ID from various URL formats.
    """

    match = re.search(r"v=([a-zA-Z0-9_-]{11})", link)
    if match:
        return match.group(1)
    
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
        # api = YouTubeTranscriptApi()
        transcript_list = YouTubeTranscriptApi.list(video_id)
        transcript = transcript_list.find_transcript([prefer_lang])
        return transcript.fetch()

    except(IndexError, NoTranscriptFound):
             raise HTTPException(status_code=404, detail="No transcripts were found for this video.")

    except TranscriptsDisabled:
        raise HTTPException(status_code=403, detail="Transcripts are disabled for this video.")
    except Exception as e:
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
        stats = video.get("statistics", {}) 
        
        return {
            "title": snippet.get("title"),
            "channel": snippet.get("channelTitle"),
            "publish_date": snippet.get("publishedAt"),
            "description": snippet.get("description"),
            "views": stats.get("viewCount"),
            "likes": stats.get("likeCount"),
        }
    except Exception as e:
        print(f"Error fetching metadata: {e}")
        return {"error": "Could not fetch video metadata."}




class YouTubeRequest(BaseModel):
    link: str
    lang: str = "en"


@app.post("/get-transcript")
def get_youtube_data(request: YouTubeRequest):

    video_id = extract_video_id(request.link)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube link provided.")

    
    transcript_data = fetch_transcript_from_api(video_id, prefer_lang=request.lang)
    metadata = fetch_video_metadata(video_id)

    transcript_text = " ".join([item.text for item in transcript_data])
    

    return {
        "metadata": metadata,
        "transcript": transcript_text,
    }

