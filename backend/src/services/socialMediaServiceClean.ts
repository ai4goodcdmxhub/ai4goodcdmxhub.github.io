import { TwitterApi } from 'twitter-api-v2';
import Sentiment from 'sentiment';
import FB from 'fb';
import { AtpAgent } from '@atproto/api';

type SentimentResult = {
  score: number;
  comparative: number;
  tokens: string[];
  words: string[];
  positive: string[];
  negative: string[];
}

type AnalyzedPost = {
  id: string;
  text: string;
  created_at?: string;
  sentiment: SentimentResult;
  source: 'twitter' | 'facebook' | 'bluesky';
}

type FacebookPost = {
  id: string;
  message: string;
  created_time: string;
}

type BlueskyPost = {
  uri: string;
  text: string;
  indexedAt: string;
};

export class SocialMediaService {
  private twitterClient: TwitterApi | null = null;
  private fbClient: any;
  private sentimentAnalyzer: any;

  constructor() {
    // Helper to check if credentials are properly configured
    const hasValidCredentials = (v?: string) => !!v && !v.startsWith('your_') && v.length > 0;

    // Check Twitter credentials
    const bearer = process.env.TWITTER_BEARER_TOKEN;
    const appKey = process.env.TWITTER_API_KEY;
    const appSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

    if (hasValidCredentials(bearer)) {
      console.log('Initializing Twitter client with Bearer Token');
      this.twitterClient = new TwitterApi(bearer as string);
    } else if (hasValidCredentials(appKey) && hasValidCredentials(appSecret) && 
               hasValidCredentials(accessToken) && hasValidCredentials(accessSecret)) {
      console.log('Initializing Twitter client with OAuth credentials');
      this.twitterClient = new TwitterApi({
        appKey: appKey as string,
        appSecret: appSecret as string,
        accessToken: accessToken as string,
        accessSecret: accessSecret as string,
      });
    } else {
      console.log('No valid Twitter credentials found - mock data will be used');
      this.twitterClient = null;
    }

    // Initialize Facebook client only if credentials are provided
    const fbAppId = process.env.FACEBOOK_APP_ID;
    const fbAppSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (hasValidCredentials(fbAppId) && hasValidCredentials(fbAppSecret)) {
      console.log('Initializing Facebook client');
      this.fbClient = (FB as any).extend({
        appId: fbAppId,
        appSecret: fbAppSecret,
      });
    } else {
      console.log('No valid Facebook credentials found - mock data will be used');
      this.fbClient = null;
    }

    // Initialize sentiment analyzer
    this.sentimentAnalyzer = new Sentiment();
  }

  private getMockTweets(query: string): any[] {
    // Mock data for development without API credentials
    return [
      {
        id: '1',
        text: `Just attended an amazing #${query} workshop! Learning how technology can make a positive impact.`,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        text: `Excited to be part of the #${query} community! Working on sustainable solutions for our future.`,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        text: `Great discussions at #${query} about using AI to solve social challenges.`,
        created_at: new Date().toISOString()
      }
    ];
  }

  private getMockFacebookPosts(query: string): FacebookPost[] {
    // Mock data for development without API credentials
    return [
      {
        id: 'fb1',
        message: `Nuestra comunidad ${query} está creciendo! Únete a nuestro próximo evento virtual.`,
        created_time: new Date().toISOString()
      },
      {
        id: 'fb2',
        message: `${query} México: Impactando positivamente a través de la tecnología e innovación social.`,
        created_time: new Date().toISOString()
      },
      {
        id: 'fb3',
        message: `Colaboración exitosa entre ${query} y organizaciones locales para proyectos sostenibles.`,
        created_time: new Date().toISOString()
      }
    ];
  }

  async getTweetsWithSentiment(query: string, maxResults: number = 100): Promise<AnalyzedPost[]> {
    try {
      let tweets: any[] = [];

      if (!this.twitterClient) {
        console.log('Using mock data for Twitter (no credentials configured)');
        tweets = this.getMockTweets(query);
      } else {
        const response: any = await this.twitterClient.v2.search(query, {
          max_results: maxResults,
          'tweet.fields': ['created_at', 'text']
        });

        if (Array.isArray(response)) {
          tweets = response;
        } else if (Array.isArray(response.data)) {
          tweets = response.data;
        } else if (Array.isArray(response.tweets)) {
          tweets = response.tweets;
        } else {
          console.warn('Unexpected Twitter API response (defaulting to empty array)');
          console.debug('Raw response keys:', Object.keys(response || {}));
          tweets = [];
        }
      }

      return tweets.map((t: any) => ({
        id: t.id,
        text: t.text,
        created_at: t.created_at,
        sentiment: this.analyzeSentiment(t.text),
        source: 'twitter' as const
      }));
    } catch (error) {
      console.error('Error fetching tweets:', error);
      throw error;
    }
  }

  async getFacebookPostsWithSentiment(query: string, maxResults: number = 100): Promise<AnalyzedPost[]> {
    try {
      let posts: FacebookPost[] = [];

      // Use mock data if credentials are missing
      if (!this.fbClient) {
        console.log('Using mock data for Facebook (no credentials configured)');
        posts = this.getMockFacebookPosts(query).slice(0, maxResults);
      } else {

        const fbAppId = process.env.FACEBOOK_APP_ID;
        const fbAppSecret = process.env.FACEBOOK_APP_SECRET;

        // Get app access token for searching posts
        const tokenRes = await new Promise<any>((resolve, reject) => {
          (this.fbClient as any).api('oauth/access_token', {
            client_id: fbAppId,
            client_secret: fbAppSecret,
            grant_type: 'client_credentials'
          }, (res: any) => {
            if (res && res.error) return reject(res.error);
            resolve(res);
          });
        });

        const accessToken = tokenRes.access_token;
        if (!accessToken) throw new Error('Could not obtain Facebook access token');

        // Search for posts
        const response = await new Promise<{ data: FacebookPost[] }>((resolve, reject) => {
          (this.fbClient as any).api(`v18.0/search`, {
            q: query,
            type: 'post',
            access_token: accessToken,
            limit: maxResults
          }, (res: any) => {
            if (res && res.error) return reject(res.error);
            resolve(res);
          });
        });

        posts = response && response.data ? response.data.slice(0, maxResults) : [];
      }
      
      // Return analyzed posts
      return posts.map((p: any) => ({
        id: p.id,
        text: p.message,
        created_at: p.created_time,
        sentiment: this.analyzeSentiment(p.message || ''),
        source: 'facebook' as const
      }));
    } catch (error) {
      console.error('Error fetching Facebook posts:', error);
      throw error;
    }
  }

  async getBlueskyPostsWithSentiment(query: string, maxResults: number = 50): Promise<AnalyzedPost[]> {
    try {

      // Initialize Bluesky client
      const username = process.env.BLUESKY_USERNAME;
      const password = process.env.BLUESKY_APP_PASSWORD;
      const api = new AtpAgent({ service: 'https://bsky.social' });

      if (!username || !password || username.startsWith('your_') || password.startsWith('your_')) {
        throw new Error('Bluesky credentials not configured');
      }

      await api.login({ identifier: username, password });

      // Search for posts

      const response = await api.app.bsky.feed.searchPosts({ q: query, limit: maxResults });
      const posts = (response.data.posts || []).map((p: any) => ({
        uri: p.uri,
        text: p.record?.text || '',
        indexedAt: p.indexedAt
      }));

      // Return analyzed posts

      return posts.map((p: BlueskyPost) => ({
        id: p.uri,
        text: p.text,
        created_at: p.indexedAt,
        sentiment: this.analyzeSentiment(p.text || ''),
        source: 'bluesky' as const
      }));
    } catch (error) {
      console.error('Error fetching Bluesky posts:', error);
      throw error;
    }
  }

  private analyzeSentiment(text: string): SentimentResult {
    const result = this.sentimentAnalyzer.analyze(text || '');
    return {
      score: result.score,
      comparative: result.comparative,
      tokens: result.tokens,
      words: result.words,
      positive: result.positive,
      negative: result.negative
    };
  }

  async getAllSocialMediaPosts(query: string, maxResults: number = 100): Promise<AnalyzedPost[]> {
    const [tweets, fbPosts, blueskyPosts] = await Promise.all([
      this.getTweetsWithSentiment(query, maxResults),
      this.getFacebookPostsWithSentiment(query, maxResults),
      this.getBlueskyPostsWithSentiment(query, maxResults)
    ]);

    return [...tweets, ...fbPosts, ...blueskyPosts];
  }
}