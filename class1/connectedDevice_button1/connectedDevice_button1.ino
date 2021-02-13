#include <Arduino_JSON.h>

const int buttonPin = 3;
int lastButtonState = LOW;
// volatile makes sure

// if the inputs have changed:
bool inputsChanged = false;

JSONVar outgoing;

void setup() {
  Serial.begin(9600);

  //while there is no serial, don't do anything
  while (!Serial)
  {
    //do nothing
  }

  // put your setup code here, to run once:
  pinMode(buttonPin, INPUT_PULLUP);
  outgoing["button"] = 0;

  // look for change of pin and run the function
  // interrupt have bounces
  // attachInterrupt(buttonPin, buttonChange, FALLING);
}

void loop() {
  //if there's no serial go back to starting loop
  if (!Serial) return;

  // put your main code here, to run repeatedly:
  int buttonState = digitalRead(buttonPin);

  // if there's change in the button state
  if (buttonState != lastButtonState)
  {
    outgoing["button"] = buttonState;
    delay(5);
    //Serial.println(buttonState);

    //if(Serial) Serial.println(button);
    //if(Serial) Serial.println(JSON.stringify(outgoing));
    //if(Serial) Serial.print(",");

    lastButtonState = buttonState;
    // set change flag so serial will send:
    inputsChanged = true;
  }

  // if either sensor has changed, send it:
  if (inputsChanged) {
    Serial.println(outgoing);
    // clear the change flag:
    inputsChanged = false;
  }

}

//void buttonChange(){
//  Serial.println("button pressed");
//}
