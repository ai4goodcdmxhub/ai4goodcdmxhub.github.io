import { useEffect, useMemo, useState } from 'react';
import {
  fetchBlueskyPosts,
  type SocialPost,
} from '../lib/api';

const DEFAULT_QUERY = 'ai';

export function usePosts(searchTerm: string) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function reloadPosts(query = DEFAULT_QUERY) {
    try {
      setLoading(true);
      setError('');
      const data = await fetchBlueskyPosts({ query, maxResults: 10 });
      setPosts(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error al recargar posts');
      throw loadError;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return posts;

    return posts.filter((post) =>
      post.text.toLowerCase().includes(normalized) ||
      post.source.toLowerCase().includes(normalized)
    );
  }, [posts, searchTerm]);

  return {
    posts,
    filteredPosts,
    loading,
    error,
    reloadPosts,
  };
}