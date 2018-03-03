var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql'); 

var port = process.env.PORT || 1337; 

var con = mysql.createConnection({
    host: 'hg-db.mysql.database.azure.com',
    user: 'hg@hg-db',
    password: 'Slaptazodis1',
    database: 'hg'
});

/*
  profile: {
    name : string,
    email : string, 
    tags : [],
    ratings : [] 
  }
}
 */
var allProfiles = []; 
con.connect(function(err) {        
    con.query("SELECT * FROM Profiles", function (err, profiles) {
        profiles.forEach(profile => {
            var id = allProfiles.push({name: profile.Name, email: profile.Email, tags: [], ratings: []}) - 1; 
            con.query("SELECT Name FROM Tags WHERE ProfileID = " + profile.ProfileID, function (err, tags) {
                allProfiles[id].tags = tags.map(x => x.Name); 
                console.log(allProfiles[id].tags);
            }); 
            con.query("SELECT Score FROM Ratings WHERE ProfileID = " + profile.ProfileID, function (err, ratings) {
                allProfiles[id].ratings = ratings.map(x => x.Score); 
            });
        })
    });
});

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
var requestMessages = [];

connectedUsers.push({profile:{name:'Tadas',tags:[{name:'cooking', rating:5, ratingCount:1},{name:'developing', rating:4, ratingCount:2}]},socketId:'fgsdgsrgs'});
connectedUsers.push({profile:{name:'Mantas',tags:[{name:'cooking', rating:3, ratingCount:2},{name:'treking', rating:10, ratingCount:2}]},socketId:'ugiuog'});
connectedUsers.push({profile:{name:'Jons',tags:[{name:'racing',rating:16, ratingCount:4},{name:'treking', rating:16, ratingCount:6}]},socketId:'uhoiugpoigp'});
connectedUsers.push({profile:{name:'Karlassss',tags:[]},socketId:'uiogoiugpoiugupogupo'});

requestMessages.push({userId: 'fgsdgsrgs', requestMessages: [{socketId: '123', message: 'Please talk to me'}, {socketId: 'heyheyho', message: 'I want to talk to you'}]})
requestMessages.push({userId: 'ugiuog', requestMessages: [{socketId: '345', message: 'Please talk to me'}, {socketId: 'heyheyho', message: 'I want to talk to you'}]})

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');  
});

io.on('connection', function(socket){
  var data = getConnectedUsers();
  socket.emit('user list', data);

  socket.on('chat message', function(msg){
    io.emit('chat message', msg + socket.id + " " + allProfiles[0].name + " " );
  });

  socket.on('private message', function(receiverId, message){ 
    console.log(receiverId + " " + message);
    io.broadcast.to(receiverId).emit('private message', {senderId: socket.id, message: message}); 
  });

  socket.on('rate', function(rating){ 
    // TODO update rating on both all users and db 

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
    // TODO. 1. check if the user is in allUsers. 
    // if exists, just add loggedin attribute to the user 
    // if not, create a new user, add it to both allUsers and db 

    connectedUsers.push({profile : profile, socketId : socket.id})
    var data = getConnectedUsers();
    io.emit('user list', data);
  });

  socket.on('send request message', function(mentorSocketId, requesterSocketId, reqMessage) {
    //TODO: add reqMessage to DB
    //message should not be a duplicate
    var selectedMentor;
    selectedMentor = requestMessages.find(x => x.userId === mentorSocketId);
    if (!selectedMentor) {
        selectedMentor = {userId: mentorSocketId, requestMessages: []};
        requestMessages.push(selectedMentor);
    }
    selectedMentor.requestMessages.push({socketId: requesterSocketId, message: reqMessage});

    socket.broadcast.to(mentorSocketId).emit('request messages', selectedMentor.requestMessages);
  })
});

function logout(socket) {
  // TODO change user loggedin field to false in allUsers list 

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
    // TODO do a mapping from allProfiles where loggedin attribute in true 

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