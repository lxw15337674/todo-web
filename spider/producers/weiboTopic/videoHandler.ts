interface VideoUrls {
  '高清 1080P'?: string;
  '高清 720P'?: string;
  '标清 480P'?: string;
  '流畅 360P'?: string;
}

interface VideoResponse {
  data: {
    Component_Play_Playinfo: {
      urls: VideoUrls;
      id: string;
      // ... other fields
    }
  }
}

export async function handleVideoUrl(objectId: string): Promise<string> {
  try {
    // Fetch video details from Weibo TV endpoint
    const response = await fetch(`https://weibo.com/tv/show/${objectId}`);
    const data: VideoResponse = await response.json();

    const urls = data.data.Component_Play_Playinfo.urls;
    
    // Try to get highest quality available, falling back to lower qualities
    const videoUrl = urls['高清 1080P'] || 
                    urls['高清 720P'] || 
                    urls['标清 480P'] || 
                    urls['流畅 360P'];

    if (!videoUrl) {
      throw new Error('No valid video URL found');
    }

    // Add host if URL is relative
    if (videoUrl.startsWith('//')) {
      return `https:${videoUrl}`;
    }

    return videoUrl;
  } catch (error) {
    console.error('Error handling video URL:', error);
    throw error;
  }
}
