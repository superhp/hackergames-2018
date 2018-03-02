var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, { origins: '*:*'});
var port = process.env.PORT || 1337;
var connectedUsers = []

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

  socket.on('user list', function(){
    var data = connectedUsers.map(user => Object({name : user.profile.name, socketId : user.socketId}))
    io.emit('user list', data)
  });

  socket.on('login', function(profile){
    connectedUsers.push({profile : profile, socketId : socket.id})
    var data = connectedUsers.map(user => Object({name : user.profile.name, socketId : user.socketId}))
    io.emit('user list', data)
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});