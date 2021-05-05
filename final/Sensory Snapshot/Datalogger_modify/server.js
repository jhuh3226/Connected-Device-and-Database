/*
  node.js and express.js datalogger server
  Accepts records from clients in JSON format and adds them
  to a text file. Responds to GET requests for the data 
  and reads the file as well.
  
  see readme.md for details of the API
  
  created 2 Apr 2021
  by Tom Igoe
*/

// include express.js:
const express = require("express");
var multer = require('multer');  // middleware for uploading file
var upload = multer({ dest: 'uploads/' })
// make a local instance of it:
const server = express();
// include body-parser:
const bodyParser = require("body-parser");
// set up an array of known users' unique IDs (uids):
// let knownClients = ["0123FAF16D37AF36EE", "AA00BB11CC22DD33EE"];

// include filesystem utilities:
const fs = require("fs");
const util = require("util");
// lets us write filesystem calls using Promises:
const appendFile = util.promisify(fs.appendFile);
// line-by-line reader library:
const readline = require("readline");

// You'll read from and write to a file 
// in the same directory as this script:
var fileName = __dirname + "/data.json";

// serve static files from /public:
server.use("/", express.static("public"));
//  body parser for  application/json from the POST request:
server.use(bodyParser.json());

// this runs after the server successfully starts:
function serverStart() {
  var port = this.address().port;
  console.log("Server listening on port " + port);
}

// handler for GET /records/:date
function getData(request, response) {
  // check to see if they sent a known UID:
  // let uid = request.params.uid;
  // if the UID is not known, send a 403 forbidden response:
  // if (!knownClients.includes(uid)) {
  //   response.status(403).send("you are not a known client");
  //   // quit this function:
  //   return;
  // }
  // get the dateTime from their request:
  let startDate = new Date(request.params.startTime);
  let endDate = new Date(request.params.endTime);
  //var jasonRecordsToSend = '{}';
  // var emptyRecordsToSend;
  let recordsToSend = new Array();

  var jsonString;

  // parameters for reading from the file:    
  var fileParams = {
    input: fs.createReadStream(fileName),
    output: process.stdout,
    terminal: false
  };
  // make a file reader:
  var file = readline.createInterface(fileParams);

  // listen for new lines in the reading:
  file.on("line", getLineFromFile);

  // new line handler:
  function getLineFromFile(line) {
    // make a JSON object from the line:
    var thisRecord = JSON.parse(line);

    // emptyRecordsToSend += JSON.stringify(thisRecord);

    // get the dateTime from the record:
    console.log("thisRecord");
    console.log(thisRecord);
    recordsToSend.push(thisRecord);

    var obj = new Object();
    obj.darkRoom = recordsToSend;
    jsonString =  JSON.stringify(obj);

    var recordDate = new Date(thisRecord.dateTime);
    // send all records from startDate to endDate:
    // if the date is between startDate and endDate,
    // add it to the response:
    // if (recordDate >= startDate &&
    //   recordDate <= endDate) {
      // jasonRecordsToSend += JSON.stringify(thisRecord);
      // jasonRecordsToSend += thisRecord;
      // jasonRecordsToSend.push(thisRecord);
    // }
  }

  // listen for the end of the file, and send the result:
  file.on("close", sendResponse);

  // file close handler:
  function sendResponse() {
    console.log("closed");
    // console.log(emptyRecordsToSend);
    // response.send(emptyRecordsToSend);
    //console.log(recordsToSend);
    //response.send(recordsToSend);

    console.log(jsonString);
    response.send(jsonString);
  }
}

// handler for  POST /data
function postData(request, response) {
  console.log("Got a POST request");

  let record = request.body;
  // if (knownClients.includes(record.uid)) {
  // make a new line of text for the data file:
  let recordString = JSON.stringify(record) + "\n";
  // append the line to the file"
  appendFile(fileName, recordString)
    .then(result => console.log("saved")) // convert response to text
    .catch(error => console.log(error)); // if there is an error

  // send the response in JSON format (to be consistent):
  response.json({ record: "received" });
  // } else {
  //   // if the client is not a known client, reject them:
  //   response.status(403)
  //     .json({ record: "rejected" });
  // }
  response.end();
}

// start the server:
server.listen(process.env.PORT || 80, serverStart);
// API endpoint listeners:
server.get("/records/:startTime/:endTime/", getData);
server.post("/data", postData);
