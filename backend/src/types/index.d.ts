declare module 'sentiment' {
  interface SentimentResult {
    score: number;
    comparative: number;
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }
  
  class Sentiment {
    analyze(text: string): SentimentResult;
  }
  
  export = Sentiment;
}

declare module 'fb' {
  interface FacebookPost {
    id: string;
    message: string;
    created_time: string;
  }
  
  interface FacebookResponse {
    data: FacebookPost[];
  }
  
  interface FB {
    api(path: string, callback: (response: FacebookResponse) => void): void;
    api(path: string): Promise<FacebookResponse>;
    extend(options: { appId: string; appSecret: string }): FB;
  }
  
  const fb: FB;
  export = fb;
}