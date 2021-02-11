// variables for the DOM elements:
let portSelector;
let startButton;
// variable for the serialport object:
let serial;
// previous state of the serial input from the button:
let lastButtonState = 0;

function setup(event) {
    // loop
    //setInterval(setTime, 1000);

    startButton = document.getElementById('start');
    //checking the user action click, if there's action then run numberIncrease function
    //startButton.addEventListener('click', numberIncrease);

    // initialize the serialport object:
    serial = new p5.SerialPort(); // new instance of the serialport library
    serial.on('list', printList); // callback function for serialport list event
    serial.on('data', serialEvent); // callback function for serialport data event
    serial.list(); // list the serial ports
}

function numberIncrease(event) {
    //when the button is pressed, increase the value
    console.log("button clicked");

    clicks++;
    let clicksElement = document.getElementById("clicks");
    clicksElement.innerHTML = clicks;
    clicksElement.style.paddingLeft = clicks * 10 + "px";

    if (clicks >= 10) {
        clicksElement.innerHTML = "yay!"
    }

    // how do I access the position of the "clicks?"
}

// make a serial port selector object:
function printList(portList) {
    console.log("hello");
    // create a select object:
    portSelector = document.getElementById('portSelector');
    // portList is an array of serial port names
    for (var i = 0; i < portList.length; i++) {
        // add this port name to the select object:
        var option = document.createElement("option");
        option.text = portList[i];
        portSelector.add(option);
    }
    // set an event listener for when the port is changed:
    portSelector.addEventListener('change', openPort);
}

function openPort() {
    let item = portSelector.value;
    // if there's a port open, close it:
    if (serial.serialport != null) {
        serial.close();
    }
    // open the new port:
    serial.open(item);
}

function serialEvent() {
    // read a line of incoming data:
    var inData = serial.readLine();
    // if the line is not empty, parse it to JSON:
    if (inData) {
        console.log("data coming in");
        var sensors = JSON.parse(inData);
        
        // button value:
        // if the button's changed and it's pressed, take action:
        if (sensors.button !== lastButtonState) {
            if (sensors.button === 1) {

                numberIncrease();
            }
            // save button value for next time:
            lastButtonState = sensors.bt;
        }
    }
}

// This is a listener for the page to load.
// This is the command that actually starts the script:
window.addEventListener('DOMContentLoaded', setup);
//window.addEventListener('load', init);