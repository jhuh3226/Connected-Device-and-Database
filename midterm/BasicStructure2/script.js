let intro = 'Today is ';
let message;
let myDiv;
let myLineBreak;

function setup() {
    myDiv = document.getElementById('txtfield');
    myLineBreak = document.getElementById('lineBreak');
    let myButton = document.getElementById('pressy');
    myButton.addEventListener('click', changeText);
}

function changeText() {
    message = intro + new Date() + "<br>";
    myDiv.innerHTML = message + "<br>" + myDiv.innerHTML;
}

// not used
// myDiv.innerHTML += message
// myDiv.style.direction = "ctl";

window.addEventListener('DOMContentLoaded', setup);