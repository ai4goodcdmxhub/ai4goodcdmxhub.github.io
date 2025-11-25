const axios = require("axios");
const apiKey = process.env.YOUTUBE_API_KEY;

async function getLiveChatId(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`;
  const response = await axios.get(url);
  const liveChatId = response.data.items[0]?.liveStreamingDetails?.activeLiveChatId;
  return liveChatId || null;
}

async function fetchLiveChatMessages(liveChatId, pageToken = "") {
  const url = `https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet,authorDetails&liveChatId=${liveChatId}&key=${apiKey}&pageToken=${pageToken}`;
  const response = await axios.get(url);
  return {
    items: response.data.items || [],
    nextPageToken: response.data.nextPageToken || null,
    pollingIntervalMillis: response.data.pollingIntervalMillis || 5000,
  };
}

module.exports = { getLiveChatId, fetchLiveChatMessages };