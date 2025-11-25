const analyzeSentiment = require("../util/sentimentAnalysis");




const youtubeService = require('../API/youtubeAPI');

exports.getIAMexicoVideos = async (req, res) => {
  try {
    const videos = await youtubeService.fetchVideos();


    res.json({ ok: true, videos });
  } catch (err) {

    res.status(500).json({ ok: false, error: 'Error fetching videos' });
  }
};


exports.getCommentsForIAVideos = async (req, res) => {
  try {
    const id = req.params.id;

    // const allComments = {};
    const comments = await youtubeService.getVideoComments(id);

    res.json(comments);

  } catch (err) {

    res.status(500).json({ error: "No se pudieron obtener comentarios" });
  }
};




exports.getSentimentText = async (req, res) => {

    const { text } = req.body || '';
    const result = await analyzeSentiment.analyzeSentiment(text);
    res.json(result);

}







exports.getSentimentYoutube = async (req, res, next) => {

    
    // const text = req.params.text || 'hola';
    // console.log("Received text for sentiment analysis:", text);
    // const sentimentResult = analyzeSentiment.analyzeSentiment(text);

    // console.log("Sentiment Result:", sentimentResult);

    res.render("sentimentYoutube", {
        titulo: "Sentiment Analysis YouTube",
        sentimiento: 0,
        // csrfToken: req.csrfToken(),
    });
}


// exports.postYoutube = async (req, res, next) => {

//     const youtubeUrl = req.body.youtubeUrl;
//     console.log("Received YouTube URL for sentiment analysis:", youtubeUrl);

//         // const text = req.params.text || 'hola';
//     // console.log("Received text for sentiment analysis:", text);
//     const sentimentResult = analyzeSentiment.analyzeSentiment(youtubeUrl);

//     // console.log("Sentiment Result:", sentimentResult);

//     res.render("sentimentYoutube", {
//         titulo: "Sentiment Analysis YouTube",
//         sentimiento: sentimentResult.score,
//         // csrfToken: req.csrfToken(),
//     });


// }