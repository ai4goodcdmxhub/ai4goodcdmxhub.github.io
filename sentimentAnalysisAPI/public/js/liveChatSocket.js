const socket = io(); // Carga desde /socket.io/socket.io.js

function startLive(videoId) {
  socket.emit("startLive", videoId);
}

socket.on("liveComment", (data) => {
  const box = document.getElementById("liveCommentBox");
  if (!box) return;
  box.value = `${data.author}: ${data.text}`;
});

socket.on("errorLive", (msg) => {
  console.error("Error en live:", msg);
  alert(msg);
});