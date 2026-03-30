interface PostProps {
    score: number,
    created_at: string,
    text: string
}

export default function Post({ score, created_at, text }: PostProps) {
    return (
        <div className="p-4 lg:w-1/5 md:w-1/2">
            <div className="h-full flex flex-col items-center text-center">
                <div className="w-full">
                    <h2 className="title-font font-medium text-lg text-gray-900">Score: {score}</h2>
                    <h3 className="text-gray-500 mb-3">{created_at.slice(0,10)}</h3>
                    <p className="mb-4">"{text}"</p>
                </div>
            </div>
        </div>
    )
}