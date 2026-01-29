import re
import httpx
from typing import Optional, Tuple


def extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


async def get_video_metadata(video_id: str) -> Tuple[str, str]:
    """Get video title and thumbnail URL using oEmbed API."""
    oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(oembed_url)
            response.raise_for_status()
            data = response.json()
            
            title = data.get("title", "Untitled")
            # Use maxresdefault thumbnail, fallback to hqdefault
            thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
            
            return title, thumbnail_url
        except httpx.HTTPError:
            # Fallback values
            return "Untitled Video", f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"


async def process_youtube_url(url: str) -> Optional[dict]:
    """Process a YouTube URL and return video info."""
    video_id = extract_video_id(url)
    if not video_id:
        return None
    
    title, thumbnail_url = await get_video_metadata(video_id)
    
    return {
        "video_id": video_id,
        "title": title,
        "thumbnail_url": thumbnail_url,
    }
