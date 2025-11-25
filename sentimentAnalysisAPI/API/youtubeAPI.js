const fetch = require('node-fetch');

const API_KEY = process.env.YOUTUBE_API_KEY;

// search.list to get recent and popular IA videos in Mexico
exports.fetchVideos = async () => {
    const query = 'inteligencia artificial mexico';
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&regionCode=MX&q=${encodeURIComponent(query)}&maxResults=20&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map(v => ({
        id: v.id.videoId,
        title: v.snippet.title,
        description: v.snippet.description,
        thumbnail: v.snippet.thumbnails.medium.url
    }));
};


exports.getVideoComments = async (videoId) => {
  const url = `https://youtube.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.items) return [];

  return data.items.map(item => ({
    author: item.snippet.topLevelComment.snippet.authorDisplayName,
    text: item.snippet.topLevelComment.snippet.textDisplay,
    likeCount: item.snippet.topLevelComment.snippet.likeCount,
    publishedAt: item.snippet.topLevelComment.snippet.publishedAt
  }));
}