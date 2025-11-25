// Available social media APIs and their endpoints
export const SUPPORTED_SOCIAL_MEDIA = {
  TWITTER: {
    name: 'Twitter',
    apiVersion: 'v2',
    endpoints: {
      tweets: '/tweets',
      users: '/users',
    }
  },
  // Facebook's Graph API
  FACEBOOK: {
    name: 'Facebook',
    apiVersion: 'v18.0',
    endpoints: {
      posts: '/posts',
      pages: '/pages',
    }
  },

  BLUESKY: {
    name: 'Bluesky',
    apiVersion: 'v1',
    endpoints: {
      posts: '/app/bsky/feed/searchPosts',
    }
  }
  // Additional social media platforms can be added here
};