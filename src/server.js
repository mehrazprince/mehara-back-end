var express = require("express");
var bodyParser = require('body-parser')
var chatServer = express();
var http = require('http').Server(chatServer);
var io = require('socket.io')(http);
const fs = require('fs');

chatServer.use(express.static(__dirname));
chatServer.use(bodyParser.json());
chatServer.use(bodyParser.urlencoded({ extended: false }));
chatServer.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
const port = 3000;
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'mydb';

// Create a new MongoClient
const client = new MongoClient(url);

// Use connect method to connect to the Server
client.connect(function (err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  const db = client.db(dbName);

  //login api

  chatServer.post("/api/auth", (req, res) => {
    db.collection("user").find({}).toArray((err, users) => {
      if (err) return res.send(400)
      const { username, password } = req.body
      const login = users.filter(user => user.username === username && user.password === password && user.valid === true)
      login.length > 0 ? res.send({ status: 200, response: login }) : res.send({ status: 400, err: "Invalid username or password" })

    });
  })

  chatServer.post("/api/addUser", (req, res) => {
    const user = req.body
    db.collection("user").insertOne(user, (err, dbres) => {

      if (err) throw err;
      let num = dbres.insertedCount;
      //send back to client number of items instered and no error message
      res.send({ status: 200, response: "saved successfully" });


    });

    // fs.writeFileSync('./user.json', JSON.stringify(user), "utf-8", function (err, res) {
    //  if (err) {
    //    res.send({status:400,response:err});
    //  }
    //});
    // res.send({status:200,response:"saved successfully"});
  })

  http.listen(4000);

  //chat api
  io.on("connection", socket => {
    socket.on("getUser", () => {
      db.collection("user").find({}).toArray((user_err, users) => {
        if (!user_err) {
          socket.emit("user", users);
        }
      });
    });

    socket.on("getMessages", () => {
      db.collection('chat').find({}).toArray((resp_err, records) => {
        if (!resp_err) {
          console.log(`Chat Records: ${JSON.stringify(records)}`);
          io.emit("messages", records);
        }
      });
      // let msg = fs.readFileSync('./chat.json', "utf-8");
    });

    socket.on("addMessage", (data) => {
      var date = new Date().getTime();

      var resultSet = {
        userId: data.userId,
        message: data.message,
        timestamp: date
      };
      console.log(resultSet);
      db.collection('chat').insertOne(resultSet, (resp_err, resp) => {
        if (!resp_err) {
          db.collection('chat').find({}).toArray((record_error, records) => {
            if (!record_error) {
              console.log(`Chat Records: ${JSON.stringify(records)}`);
              io.emit("messages", records);
            }
          });
        }
      });
      // let msg = fs.readFileSync('./chat.json', "utf-8");
      // msg = JSON.parse(msg);
      // msg.push(resultSet);
      // fs.writeFileSync('./chat.json', JSON.stringify(msg), "utf-8", function (err, res) {
      //   if (err) {
      //     res.send("An error occured while writing JSON Object to File." + err);
      //   }
      //   io.emit("messages", JSON.parse(fs.readFileSync('./chat.json', "utf-8")));
      // });
    });
  });

  chatServer.put("/api/updateUser", (req, res) => {
    const { username, birthdate, age, email, valid, type, userId, password, groupadmin, grouplist, admingrouplist } = req.body

    // let user = fs.readFileSync('./user.json', "utf-8");
    // user = JSON.parse(user);

    db.collection("user").find({ id: parseInt(userId) }, (user_err, user) => {
      db.collection("user").update({ id: parseInt(userId) }, {
        $set: {
          username: username || user.username,
          birthdate: birthdate || user.birthdate,
          age: age || user.age,
          email: email || user.email,
          password: password || user.password,
          valid: valid || user.valid,
          type: type || user.type,
          groupadmin: groupadmin || user.groupadmin
        }
      }, (update_err, update_resp) => {
        if (update_err) {
          res.send({ status: 400, response: update_err });
        } else {
          res.send({ status: 200, response: "updated successfully" });
        }
      });
    });

    // for (let i = 0; i < user.length; i++) {

    //   if (user[i].id === parseInt(userId)) {
    //     user[i].username = username || user[i].username
    //     user[i].birthdate = birthdate || user[i].birthdate
    //     user[i].age = age || user[i].age
    //     user[i].email = email || user[i].email
    //     user[i].password = password || user[i].password
    //     user[i].valid = valid || user[i].valid
    //     user[i].type = type || user[i].type
    //     user[i].groupadmin = groupadmin || user[i].groupadmin
    //   }
    // }
    // fs.writeFileSync('./user.json', JSON.stringify(user), "utf-8", function (err, res) {
    //   if (err) {
    //     res.send({ status: 400, response: err });
    //   }
    // });
    // res.send({ status: 200, response: "updated successfully" });
  })


  chatServer.post("/api/group", (req, res) => {
    const { groupid, userId, groupname, userlist } = req.body
    var resultSet = {
      id: Math.floor(Math.random() * 20),
      groupname: groupname,
      userlist: userlist
    };
    let user = fs.readFileSync('./user.json', "utf-8");
    user = JSON.parse(user);
    user.push(resultSet);
    fs.writeFileSync('./user.json', JSON.stringify(user), "utf-8", function (err, res) {
      if (err) {
        res.send({ status: 400, response: err });
      }
    });
    res.send({ status: 200, response: "Saved successfully" });
  })

  chatServer.post("/api/user", (req, res) => {
    const { username, type } = req.body
    db.collection("user").find({}).toArray((err, user) => {
      if (user.filter(name => name.username === username && name.type === "supp").length > 0)
        res.send(user)
      else
        res.send({ status: 400, response: null })
    });
  })

  // client.close();
});

var server = chatServer.listen(port, () => {
  console.log("server is running on port", server.address().port);
});