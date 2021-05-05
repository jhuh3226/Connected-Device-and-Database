// express is a node module for building HTTP servers
var express = require('express');       // import the module express
var bodyParser = require('body-parser');        // decode the post data
const { Console } = require('console');
var app = express();        // app is the running server

var urlencodedBodyParser = bodyParser.urlencoded({ extended: true });       // building the decoder
app.use(urlencodedBodyParser);      // use middleware - telling express to use the decoder

app.use(express.static("public"));      // tell express to look in the public  directory forn ayy  files first

var submittedData = [];

// if user put /, then run function(what to do)
app.get("/", function (req, res) {
    res.send("Hello, thank  you for connecting! Testing local server");
});

// route receiving the data when somebody submit the form
app.post('/formdata', function (req, res) {
    console.log(req.body)

    // JSON method
    var dataToSave = {
        time: req.body.time
    };
    submittedData.push(dataToSave);         // push stored data to submittedData array
    // res.send("Got your data! You submitted: " + submittedData[0].time);
    res.send("Got your data! You submitted: " + req.body.time);
});

app.listen(80);     // start listening for port

