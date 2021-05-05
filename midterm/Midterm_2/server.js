// import node package and express is one them
var express = require('express')
// decode the post data
var bodyParser = require('body-parser');
const { Console } = require('console');
var app = express();

// specify kind of bodyParser
// extended: Unicorn character
var urlencodedBodyParser = bodyParser.urlencoded({ extended: true });
// use middleware - telling express to use the decoder
app.use(urlencodedBodyParser);

var submittedData = [];

// anything in the public directory it will run - middle ware
app.use(express.static('public'));

// do this when user puts /
// default route
app.get('/', function (req, res) {
    res.send('Hello World');
});

// route receiving the data when somebody submit the form
app.post('/formdata', function (req, res) {
    //console.log(req.body.data);
    //console.log(req.query.data);

    /* storing data
    var dataToSave = new Object();
    dataToSave = req.body.data
    */

    // random word generator to assist journal
    // refer:https://codepen.io/chiragbhansali/pen/EWppvy?__cf_chl_captcha_tk__=2bba37ba415db3540512b721e5547653eed3ce3a-1613442593-0-AQ3W6nBRrdIEkbxtY-UDm8bYk617R1iqixsRG8pHlVMWQqmqXSfQhgucy0p1IAQG886iTAFqXT8YTNEmtwa2F0hSN-T5Y98r_yA7cGahFPmTg34X9u9OHh-jgjGddsfX3z0HtDX1s023SJi8Ga--7E4UWkNqt76ZaYkGyAQb2siRCkO1SzCzVgnCUMWKrEaj3jiWRUrCp8Tn7Wshwy-vqU2v2aAvOGScm4FJBkxoFaLLgM4oLN7_zBYuNByalyQC41R9C2HMqDs3C-8BK2RhpFKHhho3svHn48JSwCECTGCaFOr-TtZ56ubI1LaSA4GYYxUzHDoUGhoUeqMkRLzgGJ-tju5_Ip5G6jdZklm7qvhcuGzCPBhyNSBCV5GACMVCZTX4U-ROrWAj88RU21hIRsb7L8Ao-w57VQpht5uy5hLZkubZPHnXWrOAjAwP1_Xzbke6HV5-T7yiCyOWClnMCJ7nM3S10QRN3wPSTtf20POn8GBuqWNqE27otXN7FBzJrZoNrpuD2oV6TXquvZnW1et7lmsBksh6HPo4J5jX3yjy9a2MZkOon6BTFXwTFruGNTAbDjqrt-DZvaTKyYZNuY27TyxcdzFUnUsplErgSsui
    var words;
    var rand;
    var content;
    words = ["Why?", "For what?", "With who?", "How was it?", "Oh that happend"];

    function randGen() {
        return Math.floor(Math.random() * 5);
    }

    function sentence() {
        rand = Math.floor(Math.random() * 5);
        content = words[rand];
    };

    sentence();
    //console.log(content);

    // JSON method
    var dataToSave = {
        time: req.body.time,
        text: req.body.paragraph_text,
        color: req.body.color
    };

    // storing input data and push
    submittedData.push(dataToSave);
    console.log(submittedData);

    // output the result
    var output = "<html><body>"
    output += "<h3 style='padding: 14px 16px'> Your Journal </h3>";
    for (var i = 0; i < submittedData.length; i++) {
        //"div { background-color: #d5f4e6;}"
        output += "<div style = 'color: " + submittedData[i].color + "; padding: 14px 16px'>" + submittedData[i].text + "<br>" + submittedData[i].time + "</div>"
    }
    output += "</body></html>";

    var goBackBT = "<html><body>" + "<p style='padding: 14px 16px'>Try to answer the question if you are stuck and back to continue your journal</p>" + "</body></html>";
    var leadingQuestion = "<html><body>" + "<div style = 'padding: 14px 16px'>" + content + "</div>" + "</body></html>";
    res.send(output + leadingQuestion + goBackBT);

    //send back
    //res.send("Got your data! You submitted: " + req.body.name + "phone" + req.body.phone + req.body.color);
});

// 30 developement, 80 is default
app.listen(8080, function () {
    console.log('Example app listening on port 8080!');
});
