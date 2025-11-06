# Social Media Analysis Backend

This backend service provides integration with social media APIs and sentiment analysis capabilities.

## Available Social Media APIs

Currently, the backend supports:

1. Twitter API (v2)
   - Tweet search
   - Sentiment analysis of tweets

2. Facebook API (Graph API v18.0)
   - Post retrieval
   - Page information
   - Sentiment analysis of posts

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create a .env file with your API credentials:
\`\`\`
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
\`\`\`

3. Build the project:
\`\`\`bash
npm run build
\`\`\`

4. Start the server:
\`\`\`bash
npm start
\`\`\`

For development:
\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

### Twitter

- GET `/api/twitter/search`
  - Query Parameters:
    - query (required): Search term
    - maxResults (optional): Maximum number of tweets to return

## Sentiment Analysis

The backend uses the 'sentiment' package to analyze text sentiment, providing:

- Score: Overall sentiment score
- Comparative: Normalized sentiment score
- Tokens: Words analyzed
- Positive/Negative words identified