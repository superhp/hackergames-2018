var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 1337;
var connectedUsers = []

io.origins(['https://learnfromme.azurewebsites.net:443']); 

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  socket.on('private', function(receiverId, message){ 
    console.log(receiverId + " " + message);
    socket.broadcast.to(receiverId).emit('private', {senderId: socket.id, message: message}); 
  });

  socket.on('disconnect', function(){ 
    console.log("client id=" + socket.id + " disconnected"); 
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
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});