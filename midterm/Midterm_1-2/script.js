const serviceUuid = "19b10010-e8f2-537e-4f6c-d104768a1214";   // advertised service UUID of the  to search for:
const distanceUuid = "19b10012-e8f2-537e-4f6c-d104768a1214";
const microphoneUuid = "19b10014-e8f2-537e-4f6c-d104768a1214";
let distanceCharacteristic;   // characteristic that you plan to read:
let microphoneCharacteristic;   // characteristic that you plan to read:
let myBLE;    // instance of p5.ble:
let distanceVal;
let microphoneVal;
let logVal;
let connected = false;    // bool checking connectivity
let whatCharacteristic;

let currentTime = 0;
let previousTime = 0;

var update_loop = setInterval(freqChecker, 1000);   // check message frequecy every1 second

let distanceFreq = 0;   // checking frequency of distance message sent in
let distanceThreshold = 0;
let distanceThresAdjust = false;

let microphoneFreq = 0;   // checking frequency of microphone message sent in
let microphoneThreshold = 0;
let microphoneThresAdjust = false;


/* -------------- val for time -------------- */
let epoch = new Date() // Or any unix timestamp

let za = new Date(epoch),
  zaR = za.getUTCFullYear(),
  zaMth = za.getUTCMonth() + 1,
  zaDs = za.getUTCDate(),
  zaTm = za.toTimeString().substr(0, 5);

/* -------------- val for random words -------------- */
var words;
var rand;
var content;
words = ["This is interesting", "Great, thanks for watching out", "Good. Please keep an eye", "Thanks"];

function randGen() {
  return Math.floor(Math.random() * 4);
}

function sentence() {
  rand = Math.floor(Math.random() * 4);
  content = words[rand];
  return content;
};
sentence();

/* ---------------------------------------- */
function setup(event) {
  console.log('page is loaded');

  myBLE = new p5ble();      // Create a p5ble instance:
  const connectButton = document.getElementById('button');
  connectButton.addEventListener('click', connectToBle);
  connectButton.value.innerHTML = "connected";

  // const writeButton = document.getElementById('buttonWrite');
  // writeButton.addEventListener('click', writeToBle);

  // distanceVal = document.getElementById('message');
  // microphoneVal = document.getElementById('message2');

  logVal = document.getElementById('comingValue');
}

function timer(millis) {
  let date = new Date();
  var millis = date.getTime();
  // var seconds = date.getSeconds();
  // var minutes = date.getMinutes();
  return millis;
}

function connectToBle() {
  myBLE.connect(serviceUuid, readCharacteristics);     // Connect to a device by passing the service UUID
}

function gotCharacteristics(error, characteristics) {
  // console.log("got characteristics");
  if (error) {
    console.log('error', error);
    return;
  }
  console.log(characteristics);
}

// when connected to BLE, read characteristics
function readCharacteristics(error, characteristics) {
  if (error) {
    console.log('error', error);
    return;
  }

  connected = true;   // sending bool for writing 
  distanceCharacteristic = characteristics[0];    // writing
  microphoneCharacteristic = characteristics[1];  // writing

  for (c of characteristics) {

    if (c.uuid == distanceUuid) {
      // console.log("characteristics[0] = distanceUuid");
      distanceCharacteristic = c;   //
      myBLE.startNotifications(distanceCharacteristic, handleNotificationDistance, 'unit8');    //float32 does not work somehow
    }

    if (c.uuid == microphoneUuid) {
      // console.log("characteristics[1] = microphoneUuid"); 
      microphoneCharacteristic = c;
      myBLE.startNotifications(microphoneCharacteristic, handleNotificationMicrophone);
    }
    // c.addEventListener('characteristicvaluechanged', readData);
  }
}

function handleNotificationDistance(data) {
  // console.log('distance: ', data);
  // distanceVal.innerHTML = data;
  whatCharacteristic = "distance";
  logging(data);


  distanceFreq++;
  if (distanceThresAdjust) distanceThresAdjust = !distanceThresAdjust;
}

function handleNotificationMicrophone(data) {
  let buffer = new ArrayBuffer(32);
  let view = new DataView(buffer);
  view.setFloat32(0, data);
  data = view.getFloat32(0, true);
  let d = data.toFixed(2);    // this somewhat does not work. typeof data is number

  // console.log('microphone: ', data);
  // microphoneVal.innerHTML = data;
  whatCharacteristic = "microphone";
  logging(data);

  microphoneFreq++;
  if (microphoneThresAdjust) microphoneThresAdjust = !microphoneThresAdjust;
}

function freqChecker() {
  currentTime = timer();
  if (currentTime - previousTime >= 2000) {

    if (distanceFreq >= 4) {
      // console.log("too frequently passing the data, prone for threshold change");
      distanceThresAdjust = true;
      distanceThreshold++;
      writeToBleDistance(distanceThreshold);
      distanceFreq = 0;
    }

    if (microphoneFreq >= 4) {
      // console.log("too frequently passing the data, prone for threshold change");
      microphoneThresAdjust = true;
      microphoneThreshold++;
      writeToBleMicrophone(microphoneThreshold);
      microphoneFreq = 0;
    }
    previousTime = currentTime;
  }
}

// if message is sending too frequently within the short time, increase the threshold
function writeToBleDistance(distanceThreshold) {
  if (connected) {
    console.log("writing new dis threshold: " + distanceThreshold);
    myBLE.write(distanceCharacteristic, 10 * distanceThreshold);
  }
}
function writeToBleMicrophone() {
  if (connected) {
    console.log("writing new mic threshold: " + microphoneThreshold);
    myBLE.write(microphoneCharacteristic, microphoneThreshold);
  }
}

function readData(event, error) {
  if (error) {
    console.log('error: ', error);
    return;
  }

  // console.log("changed");
  // console.log("readData1: " + typeof sensorVal + " readData2: " + typeof sensorVal)

  let buffer = new ArrayBuffer(32);
  let view = new DataView(buffer);
  view.setFloat32(0, event.target.value);

  if (event.target.uuid = distanceCharacteristic) {
    // distanceVal.innerHTML = sensorVal.getUint8(0);
    // let sensorVal = view.getFloat32(0,true);
    let sensorVal = event.target.value.getUint8(0);

    distanceVal.innerHTML = sensorVal;
    // console.log("readData1: " + sensorVal);
  }

  if (event.target.uuid = microphoneCharacteristic) {
    // let sensorVal = event.target.value.getFloat32(0,true);
    let sensorVal = view.getFloat32(0, true);

    microphoneVal.innerHTML = sensorVal;
    // console.log("readData2: " + sensorVal);
  }
}

function logging(data) {
  let lineBreak = document.createElement('div');
  lineBreak.id = 'lineBreak';
  let date = document.createElement('div');
  date.id = 'date';
  let newLogDistance = document.createElement('div');
  newLogDistance.id = 'newLogDistance';
  let newLogMicrophone = document.createElement('div');
  newLogMicrophone.id = 'newLogMicrophone';
  let feedback = document.createElement('div');
  feedback.id = 'feedback';
  let feedbackThresAdjust = document.createElement('div');
  feedbackThresAdjust.id = 'feedbackThresAdjust';


  lineBreak.textContetent = " "
  newLogDistance.textContent = "Hey Look. She's moving. Check out data: " + data + "mm";
  newLogMicrophone.textContent = "Hey, I hear something. Check out data: " + data;
  feedbackThresAdjust.textContent = "Re: You are so noisy. Check for more remarkable changes";
  feedback.textContent = "Re: " + sentence();
  date.textContent = zaR + "-" + zaMth + "-" + zaDs + " " + zaTm;

  // logVal.appendChild(newLog);    // adding new element to the DOM in order
  // reverse order
  if (distanceThresAdjust || microphoneThresAdjust) {
    logVal.insertBefore(feedbackThresAdjust, logVal.firstChild);
  } else logVal.insertBefore(feedback, logVal.firstChild);

  if (whatCharacteristic == "distance") {
    logVal.insertBefore(newLogDistance, logVal.firstChild);
  } else logVal.insertBefore(newLogMicrophone, logVal.firstChild);

  logVal.insertBefore(date, logVal.firstChild);
  logVal.insertBefore(lineBreak, logVal.firstChild);
}

window.addEventListener('DOMContentLoaded', setup);