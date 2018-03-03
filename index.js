var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql'); 

var port = process.env.PORT || 1337; 

var cs = process.env.MYSQLCONNSTR_localdb ? process.env.MYSQLCONNSTR_localdb.split(';') : null; 
var con = process.env.MYSQLCONNSTR_localdb ? mysql.createConnection({
    host: cs[1].substring(12).split(':')[0],
    port: cs[1].substring(12).split(':')[1],
    user: cs[2].substring(8),
    password: cs[3].substring(9),
    database: cs[0].substring(9)
}) : null;

/*
  profile: {
    name : string,
    tags : [],
    ratings : [] 
  }
}
 */
var allProfiles = []; 
if(process.env.MYSQLCONNSTR_localdb) {
    con.connect(function(err) {        
        con.query("SELECT * FROM Profiles", function (err, profiles) {
            for(var profile in profiles) {
                var id = allProfiles.push({name: profile.Name, tags: [], ratings: []}) - 1; 
                con.query("SELECT Tag FROM Tags WHERE ProfileID = " + profile.ProfileID, function (err, tags) {
                    allProfiles[id].tags = tags; 
                }); 
                con.query("SELECT Score FROM Ratings WHERE ProfileID = " + profile.ProfileID, function (err, ratings) {
                    allProfiles[id].ratings = ratings; 
                });
            }
        });
    });
}

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

connectedUsers.push({profile:{name:'Tadas',tags:[{name:'cooking', rating:5, ratingCount:1},{name:'developing', rating:4, ratingCount:2}]},socketId:'fgsdgsrgs'});
connectedUsers.push({profile:{name:'Mantas',tags:[{name:'cooking', rating:3, ratingCount:2},{name:'treking', rating:10, ratingCount:2}]},socketId:'ugiuog'});
connectedUsers.push({profile:{name:'Jons',tags:[{name:'racing',rating:16, ratingCount:4},{name:'treking', rating:16, ratingCount:6}]},socketId:'uhoiugpoigp'});
connectedUsers.push({profile:{name:'Karlassss',tags:[]},socketId:'uiogoiugpoiugupogupo'});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');  
});

io.on('connection', function(socket){
  var data = getConnectedUsers();
  socket.emit('user list', data);

  socket.on('chat message', function(msg){
    io.emit('chat message', msg + socket.id + " " + allProfiles[0].Name);
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
      tags : generateTags(user.profile.tags), 
      socketId : user.socketId}));
}

function generateTags(tags) {
  return tags.map(tag => Object({
    name: tag.name,
    rating: precisionRound(tag.rating / tag.ratingCount, 2)
  }));
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