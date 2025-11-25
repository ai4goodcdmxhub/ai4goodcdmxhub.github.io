// const Sentiment = require('sentiment');

// const sentiment = new Sentiment();

// // sentiment.registerLanguage('es', require('./spanish'));

// exports.analyzeSentiment = (text) => {
//     const result = sentiment.analyze(text);
//     return result;
// };



const { NlpManager, SentimentManager } = require('node-nlp');

// administrador de sentimientos
const sentiment = new SentimentManager({ languages: ['es'] });

async function analyzeSentiment(text) {
    const result = await sentiment.process('es', text);

    return {
        score: result.score,               // valor numérico
        comparative: result.comparative,   // score relativo por palabra
        vote: result.vote,                 // 'positive' | 'negative' | 'neutral'
        words: result.words                // palabras clave encontradas
    };
}

module.exports = { analyzeSentiment };