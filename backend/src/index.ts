import express from 'express';
import cors from 'cors';
import { SocialMediaService } from './services/socialMediaServiceClean';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize services
const socialMediaService = new SocialMediaService();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/twitter/search', async (req, res) => {
  try {
    const { query, maxResults } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const tweets = await socialMediaService.getTweetsWithSentiment(
      query as string,
      maxResults ? parseInt(maxResults as string) : undefined
    );

    res.json(tweets);
  } catch (error: any) {
    console.error('Error in Twitter search endpoint:', error);
    // If it's a known credentials error, return a helpful message to the caller
    if (error && error.message && error.message.includes('Twitter credentials not configured')) {
      return res.status(500).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/facebook/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const posts = await socialMediaService.getFacebookPostsWithSentiment(query as string);
    res.json(posts);
  } catch (error: any) {
    console.error('Error in Facebook search endpoint:', error);
    // If FB SDK returns auth/config errors, surface them
    if (error && error.message && error.message.toLowerCase().includes('fb')) {
      return res.status(500).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/social/search', async (req, res) => {
  try {
    const { query, maxResults } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const posts = await socialMediaService.getAllSocialMediaPosts(
      query as string,
      maxResults ? parseInt(maxResults as string) : undefined
    );

    res.json(posts);
  } catch (error: any) {
    console.error('Error in combined social search endpoint:', error);
    if (error && error.message && error.message.includes('Twitter credentials not configured')) {
      return res.status(500).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/bluesky/search', async (req, res) => {
  try {
    const { query, maxResults } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const posts = await socialMediaService.getBlueskyPostsWithSentiment(
      query as string,
      maxResults ? parseInt(maxResults as string) : undefined
    );

    res.json(posts);
  } catch (error: any) {
    console.error('Error in Bluesky search endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});