const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

app.get('/', (req, res) => {
  res.render('index');
});

io.on('connection', function(socket){
  console.log('User is connected: ' + socket.id);

  socket.on('join', function(roomName){
    var rooms = io.sockets.adapter.rooms;
    var room = rooms.get(roomName);

    if (room == undefined) {
      socket.join(roomName);
      socket.emit('created');
    } 
    else if (room.size == 1) {
      socket.join(roomName);
      socket.emit('joined');
    }
    else {
      socket.emit('full');
    }
  });

 
  socket.on('videoStream', (data) => {
    const roomName = data.roomName;
    const fileName = `video_${roomName}_${Date.now()}.webm`;
    const filePath = path.join(__dirname, 'recordings', fileName);

    fs.writeFile(filePath, data.videoStream, 'binary', (err) => {
      if (err) {
        console.error('Error saving video stream:', err);
      } else {
        console.log('Video stream saved:', filePath);
      }
    });
  });
   
  socket.on("ready", function(roomName){
    console.log("ready");
    socket.broadcast.to(roomName).emit("ready");
  });

  socket.on("candidate", function(candidate, roomName){
    console.log("candidate");
    socket.broadcast.to(roomName).emit("candidate", candidate);
  });

  socket.on("offer", function(offer, roomName){
    console.log("offer");
    socket.broadcast.to(roomName).emit("offer", offer);
  });

  socket.on("answer", function(answer, roomName){
    console.log("answer");
    socket.broadcast.to(roomName).emit("answer", answer);
  });

  socket.on('leace',function(roomName){
    socket.leave(roomName);
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
