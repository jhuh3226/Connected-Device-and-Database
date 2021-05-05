// express is a node module for building HTTP servers
// import the module express
var express = require('express');
// app is the running server
var app = express();

// tell express to look in the public  directory forn ayy  files first
app.use(express.static("public"));

// if user put /, then run function(what to do)
app.get("/", function (req, res) {
    res.send("Hello, thank  you for connecting! Testing local server");
});

// route receiving the data when somebody submit the form
app.get('/formdata', function (req, res) {
    console.log(req.query.time);
    res.send("Got your data! You submitted: " + req.query.time);
});

// start listening for port
// port: virutal private server to connect to, express normally is 80
app.listen(80);

