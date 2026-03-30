import Post from './post'
import { usePosts } from '../hooks/usePosts'

export default function Showcase() {
    const { posts, loading, error } = usePosts('');
    return (
        <section className="text-gray-600 body-font">
            <div className="container px-5 py-24 mx-auto">
                <div className="flex flex-col text-center w-full mb-20">
                    <h1 className="text-2xl font-medium title-font mb-4 text-gray-900">API SHOWCASE</h1>
                    <p className="lg:w-2/3 mx-auto leading-relaxed text-base">Social media posts, along with their sentiment score made by the sentiment analysis API, will be displayed here.</p>
                </div>
                
                {loading && <p className="text-enter w-full">Loading posts...</p>}
                {error && <p className="text-centeer w-full text-red-600">{error}</p>}

                <div className="flex flex-wrap -m-4">
                    {!loading &&
                        !error &&
                        posts.slice(0,5).map((post) => (
                            <Post 
                                key={post.id}
                                score={post.sentiment.score}
                                created_at={post.created_at ?? '2026-01-01'}
                                text={post.text}
                            />
                    ))}
                </div>
            </div>
        </section>
    )
}