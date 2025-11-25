const express = require("express");
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// servir estáticos desde /public (necesario para /js/liveChatSocket.js)
// app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, "/public")));

// const passport = require("passport");
// require("./passportSetup");
// const isAuth = require("./util/is-auth");

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// const session = require("express-session");

app.use(function (req, res, next) {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

// app.use(
//   session({
//     secret: process.env.SECRET,
//     resave: false,
//     saveUninitialized: false,
//   })
// );

//passportjs para usar google login
// app.use(passport.initialize());
// app.use(passport.session());

// const path = require("path");

// const bodyParser = require("body-parser");
// app.use(bodyParser.urlencoded({ extended: false }));

// app.use(bodyParser.json());

// const multer = require("multer");
// //fileStorage: Es nuestra constante de configuración para manejar el almacenamiento
// const fileStorage = multer.diskStorage({
//   destination: (request, file, callback) => {
//     //'public/uploads': Es el directorio del servidor donde se subirán los archivos
//     callback(null, "public/uploads/usuarios");
//   },
//   filename: (request, file, callback) => {
//     //aquí configuramos el nombre que queremos que tenga el archivo en el servidor,
//     //para que no haya problema si se suben 2 archivos con el mismo nombre concatenamos el timestamp
//     callback(null, file.originalname);
//   },
// });
// app.use(multer({ storage: fileStorage }).single("image"));


//PROTECCION CONTRA CROSS-SITE REQUEST FORGERY
// const csrf = require("csurf");
// const csrfProtection = csrf();
// app.use(csrfProtection);

//FIN CSRF


// Implementación de WebSocket

const http = require("http");
const { Server } = require("socket.io");

// const app = express();
const server = http.createServer(app); // Crear servidor HTTP

// const io = new Server(server); // Inicializar Socket.IO

// io.on("connection", (socket) => {
//   // console.log("Socket conectado:", socket.id);

//   socket.on("startLive", (videoId) => {
//     // console.log("Iniciando live para video ID:", videoId);
//     socket.emit("liveComment", { author: "Servidor", text: "Conectado al live: " + videoId });
//   });

//   socket.on("disconnect", () => {
//     // console.log("Socket desconectado:", socket.id);
//   });
// });



// const youtubeAPI = require("./util/youtubeAPI");

// io.on("connection", (socket) => {
//   // console.log("Socket conectado:", socket.id);

//   socket.on("startLive", async (videoId) => {
//     try {
//       const liveChatId = await youtubeAPI.getLiveChatId(videoId);
//       if (!liveChatId) {
//         socket.emit("errorLive", "No se encontró un chat en vivo para este video.");
//         return;
//       }

//       let nextPageToken = "";
//       const poller = setInterval(async () => {
//         try {
//           const { items, nextPageToken: newPageToken } = await youtubeAPI.fetchLiveChatMessages(liveChatId, nextPageToken);
//           nextPageToken = newPageToken;

//           items.forEach((item) => {
//             const author = item.authorDetails.displayName;
//             const text = item.snippet.displayMessage;
//             socket.emit("liveComment", { author, text });
//           });
//         } catch (err) {
//           // console.error("Error al obtener mensajes del chat:", err.message);
//         }
//       }, 5000);

//       socket.on("disconnect", () => {
//         clearInterval(poller);
//         // console.log("Socket desconectado:", socket.id);
//       });
//     } catch (err) {
//       // console.error("Error al iniciar live:", err.message);
//       socket.emit("errorLive", "Error al conectar con el chat en vivo.");
//     }
//   });
// });



const routesSentimentAnalysis = require("./routes/sentiment.routes");

// Define las rutas más específicas primero
app.use("/api", routesSentimentAnalysis);

// const { read } = require("fs");


app.use((request, response, next) => {//isAuth,(request, response, next) => {
  response.status(404);
  response.render("404", {
    titulo: "Error 404",
    // permisos: request.session.permisos || [],
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto: ${PORT}`);
});
