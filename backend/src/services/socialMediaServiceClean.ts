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

  async getFacebookPostsWithSentiment(query: string): Promise<AnalyzedPost[]> {
    try {
      const response = await new Promise<{ data: FacebookPost[] }>((resolve, reject) => {
  (this.fbClient as any).api('/search', { q: query, type: 'post' }, (res: any) => {
          if (res && res.error) return reject(res.error);
          resolve(res);
        });
      });

      const posts = response && response.data ? response.data : [];

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
