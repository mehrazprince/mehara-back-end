var express = require("express");
var bodyParser = require('body-parser')
var chatServer = express();
var http = require('http').Server(chatServer);
var io = require('socket.io')(http);
const fs = require('fs');


chatServer.use(express.static(__dirname));
chatServer.use(bodyParser.json());
chatServer.use(bodyParser.urlencoded({ extended: false }))
const port = 3000;

io.on("connection", socket => { //socket connection
  socket.on("getUser", () => { //return login user
    let user = fs.readFileSync('./user.json', "utf-8");
    user = JSON.parse(user);
    socket.emit("user", user);
  });

  socket.on("getMessages", () => { //return chat message
    let msg = fs.readFileSync('./chat.json', "utf-8");
    io.emit("messages", JSON.parse(msg));
  });

  socket.on("addMessage", data => {//add message
    var date = new Date().getTime();
    var loggedInUser = data.id;
    var message = data.message;
    var resultSet = {
      userId: loggedInUser,
      message: message,
      timestamp: date
    };
    let msg = fs.readFileSync('./chat.json', "utf-8");
    msg = JSON.parse(msg);
    msg.push(resultSet);
    fs.writeFileSync('./chat.json', JSON.stringify(msg), "utf-8", function (err, res) {
      if (err) {
        res.send("An error occured while writing JSON Object to File." + err);
      }
      io.emit("messages", JSON.parse(fs.readFileSync('./chat.json', "utf-8")));
    });
  });
});   //socket

http.listen(4000);

var server = chatServer.listen(port, () => {//start server
  console.log("server is running on port", server.address().port);
});