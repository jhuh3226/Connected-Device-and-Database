function setup(event) {
    const button = document.getElementById("bt")
    button.addEventListener('click',stackUp)
    var log = document.getElementById('log')
}

class Stack {
    constructor() {
        this.items = []
        this.count = 0
    }

    push(element) {
        this.items[this.count] = element
        this.count += 1
        console.log(`${element} added to ${this.count}`)
        // console.log(typeof element)
        return this.count - 1
    }

}

const stack = new Stack()

function stackUp() {
    
    for(var c=0; c<log.innerHTML.length;c++) console.log(log.innerHTML[c])
    // console.log(log.innerHTML.substring(0)) // convert to substring
    stack.push(log.innerHTML.substring(0))
    log.innerHTML = stack;
}

window.addEventListener('DOMContentLoaded', setup)