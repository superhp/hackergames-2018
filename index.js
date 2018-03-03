var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 1337;

/*
user {
  profile: {
    name : string,
    tags : [],
    rating : int,
    ratingCount : int,
  },
  sockedId : string
}
 */
var connectedUsers = []; 

connectedUsers.push({profile:{name:'Tadas',tags:['cooking','developing'], rating: 7, ratingCount: 2},socketId:'fgsdgsrgs'});
connectedUsers.push({profile:{name:'Mantas',tags:['cooking','treking'], rating: 16, ratingCount: 4},socketId:'ugiuog'});
connectedUsers.push({profile:{name:'Jons',tags:['racing','treking'], rating: 12, ratingCount: 4},socketId:'uhoiugpoigp'});
connectedUsers.push({profile:{name:'Karlassss',tags:[], rating: 20, ratingCount: 4},socketId:'uiogoiugpoiugupogupo'});

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
    var receiver = connectedUsers.find(receiver => receiver.socketId === rating.receiverId)
    if(receiver.profile.rating && receiver.profile.ratingCount) {
      receiver.profile.rating += rating.score;
      receiver.profile.ratingCount++;
    }
    else{
      receiver.profile.rating = rating.score;
      receiver.profile.ratingCount = 1;  
    }
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
    return connectedUsers.map(user => Object({
      name : user.profile.name, 
      rating : getRating(user.profile), 
      tags : user.profile.tags, 
      socketId : user.socketId}));
}

function getRating(profile){
    if(profile.rating && profile.ratingCount)
      return precisionRound(profile.rating / profile.ratingCount, 2);
    else
      return 0;
}

function precisionRound(number, precision) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}