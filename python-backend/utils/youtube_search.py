"""
YouTube search utility to find real, playable career videos.
"""

import os
import logging
from typing import List, Dict, Any
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


def search_career_videos(career_name: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """
    Search YouTube for real "day in the life" videos for a career.

    Args:
        career_name: The career to search for
        max_results: Maximum number of videos to return

    Returns:
        List of video dictionaries with videoId, title, and channel
    """
    # Get YouTube API key from environment
    api_key = os.getenv("YOUTUBE_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if not api_key:
        logger.warning("No YouTube API key found. Using fallback video search.")
        return _fallback_search(career_name, max_results)

    try:
        # Build YouTube API client
        youtube = build('youtube', 'v3', developerKey=api_key)

        # Search for videos
        search_query = f"day in the life {career_name}"

        search_response = youtube.search().list(
            q=search_query,
            part='id,snippet',
            maxResults=max_results,
            type='video',
            order='relevance',
            videoEmbeddable='true',  # Only embeddable videos
            videoSyndicated='true',   # Only videos that can be played outside YouTube
            relevanceLanguage='en'
        ).execute()

        videos = []
        for search_result in search_response.get('items', []):
            if search_result['id']['kind'] == 'youtube#video':
                videos.append({
                    'videoId': search_result['id']['videoId'],
                    'title': search_result['snippet']['title'],
                    'channel': search_result['snippet']['channelTitle']
                })

        logger.info(f"Found {len(videos)} YouTube videos for '{career_name}'")
        return videos

    except HttpError as e:
        logger.error(f"YouTube API error: {e}")
        return _fallback_search(career_name, max_results)
    except Exception as e:
        logger.error(f"Error searching YouTube: {e}", exc_info=True)
        return _fallback_search(career_name, max_results)


def _fallback_search(career_name: str, max_results: int) -> List[Dict[str, Any]]:
    """
    Fallback method when YouTube API key is not available.
    Returns empty list - user needs to set up YOUTUBE_API_KEY in .env
    """
    logger.warning(f"No videos returned for '{career_name}' - YouTube API key required")
    logger.info("To enable YouTube videos: Set YOUTUBE_API_KEY or GOOGLE_API_KEY in your .env file")
    return []
