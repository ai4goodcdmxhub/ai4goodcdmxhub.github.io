const express = require("express");
const router = express.Router();
// const csrf = require("csurf");
// const csrfProtection = csrf();
const controllers = require("../controllers/sentiment.controller");
// const isAuth = require("../util/is-auth");
// const canView = require("../util/can-view");

// router.use(csrfProtection)

router.get("/youtube", controllers.getSentimentYoutube);
// router.post("/youtube", controladores.postYoutube);
router.get('/ia-mexico/videos', controllers.getIAMexicoVideos);
router.get('/ia-mexico/comments/:id', controllers.getCommentsForIAVideos);
router.post('/sentiment', controllers.getSentimentText);

module.exports = router;