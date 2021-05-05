// express is a node module for building HTTP servers
var express = require('express');       // import the module express
var bodyParser = require('body-parser');        // decode the post data
const { Console } = require('console');
// const { resolveNaptr } = require('node:dns');
var server = express();        // app is the running server

var urlencodedBodyParser = bodyParser.urlencoded({ extended: true });       // building the decoder
server.use(urlencodedBodyParser);      // use middleware - telling express to use the decoder

server.use(express.static("public"));      // tell express to look in the public  directory from any files first


function respondToClient(req, res) {
    var req = "request: " + JSON.stringify(req.query);
    res.writeHead(200, { "ContentType": "text/html" });
    res.write(req);
    res.end();
}

function checkData(req, res) {
    var lux;
    if (req.method === "POST") {
        lux = req.body.lux;
        console.log("post method!");
    }

    var responseString = "";
    responseString = lux + "\n";

    res.writeHead(200, { "ContentType": "text/html" });
    res.write(responseString);
    res.end();
}

server.get('/', respondToClient);
server.post('/postData', checkData);

// // app.use(express.static("public"));      // tell express to look in the public  directory from any files first

// var submittedData = [];

// // if user put /, then run function(what to do)
// server.get("/", function (req, res) {
//     res.send("Hello, thank  you for connecting! Testing local server");
// });

// // route receiving the data when somebody submit the form
// server.post('/postData', function (req, res) {
//     console.log(req.body)

//     // JSON method
//     var dataToSave = {
//         lux: req.body.lux
//     };
//     submittedData.push(dataToSave);         // push stored data to submittedData array
//     // res.send("Got your data! You submitted: " + submittedData[0].lux);
//     res.send("Got your data! You submitted: " + req.body.lux);
// });

server.listen(80);     // start listening for port

