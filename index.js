var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, { origins: '*:*'});
var port = process.env.PORT || 1337;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  socket.on('private', function(id, msg){ 
    socket.broadcast.to(id).emit('private', msg); 
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});