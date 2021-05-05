// advertised service UUID of the  to search for:
const serviceUuid = "19b10010-e8f2-537e-4f6c-d104768a1214";
// characteristic that you plan to read:
let myCharacteristic;
// instance of p5.ble:
let myBLE;
// DOM elements to interact with:
let connectButton;
let distanceValue;
let microphoneValue;
let lineBreak;

var words;
var rand;
var content;
words = ["This is interesting", "Nah, I'll just ignore that", "Stop continuosly sending me the data"];

function randGen() {
  return Math.floor(Math.random() * 3);
}

function sentence() {
  rand = Math.floor(Math.random() * 3);
  content = words[rand];
  return content;
};
sentence();

// this function is called when the page is loaded. 
// event listener functions are initialized here:
function setup(event) {
  console.log('page is loaded');
  // Create a p5ble instance:
  myBLE = new p5ble();
  // Create a 'Connect' button
  const connectButton = document.getElementById('connect');
  connectButton.addEventListener('click', connectToBle);
  distanceValue = document.getElementById('messages');
  microphoneValue = document.getElementById('messages2');
  lineBreak = document.getElementById('lineBreak');
}

function connectToBle() {
  // Connect to a device by passing the service UUID
  myBLE.connect(serviceUuid, gotCharacteristics);
}

// A function that will be called once got characteristics
function gotCharacteristics(error, characteristics) {
  // if there's an error, 
  // notify the user and quit the function:
  if (error) {
    console.log(error);
    distanceValue.innerHTML = 'error: ' + error;
    return;
  }

  console.log('characteristics: ', characteristics);
  myCharacteristic = characteristics[0];
  // Read the value of the first characteristic
  myBLE.read(myCharacteristic, gotValue);

  // for (c of characteristics){
  // c.addEventListener('characteristicvalueChanged', gotValue);
  // }

  
}

let counter = 0;
// A function that will be called once got values
function gotValue(error, value) {
  // if there's an error, 
  // notify the user and quit the function:
  if (error) {
    distanceValue.innerHTML = 'error: ' + error;
    return;
  }
  // After getting a value, call p5ble.read() again to get the value again
  distanceValue.innerHTML = value;
  microphoneValue.innerHTML = "<br>" + content;

  counter++;
  console.log(counter);
  if (counter % 49 == 0) {
    lineBreak.innerHTML += "<br><br>";
    sentence();
  }

  myBLE.read(myCharacteristic, gotValue);

  // if(event.target.uuid == "19B10012-E8F2-537E-4F6C-D104768A1214") {

  // }
}

function logging() {
  lineBreak.innerHTML = "Look what I have found. The distance is" + distanceValue.innerHTML + "<br><br>";
}

// This is a listener for the page to load.
// This is the command that actually starts the script:
window.addEventListener('DOMContentLoaded', setup);