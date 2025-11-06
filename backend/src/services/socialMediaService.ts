import { TwitterApi } from 'twitter-api-v2';
import Sentiment from 'sentiment';
import FB from 'fb';

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
  source: 'twitter' | 'facebook';
}

type FacebookPost = {
  id: string;
  message: string;
  created_time: string;
}

export class SocialMediaService {
  private twitterClient: TwitterApi | null;
  private fbClient: any;
  private sentimentAnalyzer: any;

  constructor() {
    // Helper to check if a value looks configured (not the placeholder)
    const isConfigured = (v?: string) => !!v && !v.startsWith('your_');

    // Prefer TWITTER_BEARER_TOKEN (app-only) if provided
    const bearer = process.env.TWITTER_BEARER_TOKEN;
    const appKey = process.env.TWITTER_API_KEY;
    const appSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

    if (isConfigured(bearer)) {
      // App-only auth (bearer token)
      this.twitterClient = new TwitterApi(bearer as string);
      console.log('Twitter client configured using TWITTER_BEARER_TOKEN');
    } else if (isConfigured(appKey) && isConfigured(appSecret) && isConfigured(accessToken) && isConfigured(accessSecret)) {
      // Full user auth (OAuth 1.0a)
      this.twitterClient = new TwitterApi({
        appKey: appKey as string,
        appSecret: appSecret as string,
        accessToken: accessToken as string,
        accessSecret: accessSecret as string,
      });
      console.log('Twitter client configured using API keys and access tokens');
    } else {
      this.twitterClient = null;
      console.warn('Twitter credentials are not configured. Set TWITTER_BEARER_TOKEN or the API key/secret + access token/secret in .env');
    }

    // Initialize Facebook client
    this.fbClient = (FB as any).extend({
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || '',
    });

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
        tweets = response && response.data ? response.data : [];
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

  async getFacebookPostsWithSentiment(query: string): Promise<AnalyzedPost[]> {
    try {
      let posts: FacebookPost[] = [];

      if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET || 
          process.env.FACEBOOK_APP_ID === 'your_facebook_app_id') {
        console.log('Using mock data for Facebook (no credentials configured)');
        posts = this.getMockFacebookPosts(query);
      } else {
        const response = await new Promise<{ data: FacebookPost[] }>((resolve, reject) => {
          (this.fbClient as any).api('/search', { q: query, type: 'post' }, (res: any) => {
            if (res && res.error) return reject(res.error);
            resolve(res);
          });
        });
        posts = response && response.data ? response.data : [];
      }

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
    const [tweets, fbPosts] = await Promise.all([
      this.getTweetsWithSentiment(query, maxResults),
      this.getFacebookPostsWithSentiment(query)
    ]);

    return [...tweets, ...fbPosts];
  }
}
