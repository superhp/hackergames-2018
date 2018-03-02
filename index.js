var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 1337;

/*
user {
  profile: {
    name : string,
    tags : []
  },
  sockedId : string
}
 */
var connectedUsers = []; 


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
    var data = getConnectedUsers()
    io.emit('user list', data)
  });

  socket.on('login', function(profile){
    connectedUsers.push({profile : profile, socketId : socket.id})
    var data = getConnectedUsers()
    io.emit('user list', data)
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function getConnectedUsers(){
  return connectedUsers.map(user => Object({name : user.profile.name, tags : user.profile.tags, socketId : user.socketId}))
}