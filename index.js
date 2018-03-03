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

connectedUsers.push({profile:{name:'Tadas',tags:['cooking','developing']},socketId:'fgsdgsrgs'});
connectedUsers.push({profile:{name:'Mantas',tags:['cooking','treking']},socketId:'ugiuog'});
connectedUsers.push({profile:{name:'Jons',tags:['racing','treking']},socketId:'uhoiugpoigp'});
connectedUsers.push({profile:{name:'Karlassss',tags:[]},socketId:'uiogoiugpoiugupogupo'});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg + socket.id);
  });

  socket.on('private message', function(receiverId, message){ 
    console.log(receiverId + " " + message);
    io.broadcast.to(receiverId).emit('private message', {senderId: socket.id, message: message}); 
  });

  socket.on('rate', function(rating){ 
    console.log(rating.receiverId + " was rated " + rating.score);
    // calculate rating  
    var data = getConnectedUsers();
    io.emit('user list', data);
  });

  socket.on('disconnect', function(){ 
    logout(socket);
  });

  socket.on('logout', function(){ 
    logout(socket);
  });

  socket.on('login', function(profile){
    connectedUsers.push({profile : profile, socketId : socket.id})
    var data = getConnectedUsers();
    io.emit('user list', data);
  });
});

function logout(socket) {
  console.log(connectedUsers);
  console.log("client id=" + socket.id + " disconnected"); 
  connectedUsers = connectedUsers.filter(x => x.socketId !== socket.id); 
  var data = getConnectedUsers();
  io.emit('user list', data);
}

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function getConnectedUsers(){
  return connectedUsers.map(user => Object({name : user.profile.name, tags : user.profile.tags, socketId : user.socketId}))
}