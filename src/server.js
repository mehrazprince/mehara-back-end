var express = require("express");
var bodyParser = require('body-parser')
var chatServer = express();
var http = require('http').Server(chatServer);
var io = require('socket.io')(http);
const fs = require('fs');

chatServer.use(express.static(__dirname));
chatServer.use(bodyParser.json());
chatServer.use(bodyParser.urlencoded({ extended: false }));
chatServer.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
const port = 3000;

//chat api
io.on("connection", socket => {
  socket.on("getUser", () => {
    let user = fs.readFileSync('./user.json', "utf-8");
    user = JSON.parse(user);
    socket.emit("user", user);
  });

  socket.on("getMessages", () => {
    let msg = fs.readFileSync('./chat.json', "utf-8");
    io.emit("messages", JSON.parse(msg));
  });

  socket.on("addMessage", (message, loggedInUser) => {
    var date = new Date().getTime();
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
});


http.listen(4000);

//login api

chatServer.post("/api/auth", (req, res) => {
  let users = fs.readFileSync('./user.json', "utf-8");
  users = JSON.parse(users);
  const { username,password } = req.body
  const login = users.filter(user => user.username === username && user.password===password && user.valid === true)
  login.length>0  ?  res.send({status:200,response:login}) : res.send({status:400,err:"Invalid username or password"})
})

chatServer.post("/api/addUser", (req, res) => {
  const { username, birthdate, age, email, valid, type,groupadmin,grouplist,admingrouplist } = req.body
  var resultSet = {
    id: Math.floor(Math.random() * 20),
    username: username,
    birthdate: birthdate,
    age: age,
    email: email,
    valid: valid,
    type: type,
    groupadmin:groupadmin,
    grouplist:grouplist,
    admingrouplist:admingrouplist
  };
  let user = fs.readFileSync('./user.json', "utf-8");
  user = JSON.parse(user);
  user.push(resultSet);
  fs.writeFileSync('./user.json', JSON.stringify(user), "utf-8", function (err, res) {
    if (err) {
      res.send({status:400,response:err});
    }
  });
  res.send({status:200,response:"saved successfully"});
})

chatServer.put("/api/updateUser", (req, res) => {
  const { username, birthdate, age, email, valid, type, userId, password,groupadmin,grouplist,admingrouplist } = req.body

  let user = fs.readFileSync('./user.json', "utf-8");
  user = JSON.parse(user);

  for (let i = 0; i < user.length; i++) {

    if (user[i].id === parseInt(userId)) {
      user[i].username = username || user[i].username
      user[i].birthdate = birthdate || user[i].birthdate
      user[i].age = age || user[i].age
      user[i].email = email || user[i].email
      user[i].password = password || user[i].password
      user[i].valid = valid || user[i].valid
      user[i].type = type || user[i].type
      user[i].groupadmin = groupadmin || user[i].groupadmin
    }
  }
  fs.writeFileSync('./user.json', JSON.stringify(user), "utf-8", function (err, res) {
    if (err) {
      res.send({status:400,response:err});
    }
  });
  res.send({status:200,response:"updated successfully"});
})


chatServer.post("/api/group", (req, res) => {
  const { groupid,userId ,groupname,userlist} = req.body
  var resultSet = {
    id: Math.floor(Math.random() * 20),
    groupname: groupname,
    userlist:userlist
  };
  let user = fs.readFileSync('./user.json', "utf-8");
  user = JSON.parse(user);
  user.push(resultSet);
  fs.writeFileSync('./user.json', JSON.stringify(user), "utf-8", function (err, res) {
    if (err) {
      res.send({status:400,response:err});
    }
  });
  res.send({status:200, response:"Saved successfully"});
})

chatServer.post("/api/user", (req, res) => {
  let user = fs.readFileSync('./user.json', "utf-8");
  const { username, type } = req.body
  user = JSON.parse(user);
  if (user.filter(name => name.username === username && name.type === "supp").length > 0)
    res.send(user)
  else
    res.send({status:400, response: null})
})


var server = chatServer.listen(port, () => {
  console.log("server is running on port", server.address().port);
});