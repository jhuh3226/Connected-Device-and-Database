/*
  The circuit:
   SD card attached to SPI bus as follows:
 ** MOSI - pin 11
 ** MISO - pin 12
 ** CLK - pin 13
 ** CS - pin 10 (for Arduino Nano 33IoT)
*/

//Include libraries
#include <SPI.h>
#include <SD.h>
#include <Arduino_JSON.h>
#include "avdweb_Switch.h"

#include <WiFiNINA.h>       // use this for MKR1010 and Nano 33 IoT boards
#include "arduino_secrets.h"
#include <ArduinoHttpClient.h>

/*Sensors*/
#include <Wire.h>
#include "Adafruit_TCS34725.h"
#include "DHT.h"
#include <RTCZero.h>
#include <Arduino_JSON.h>
#include <ArduinoLowPower.h>    // works only on SAMD boards, set arduino to sleep mode

/*Display*/
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
Adafruit_SSD1306 display = Adafruit_SSD1306(128, 64, &Wire);
//#define BUTTON_A  9
//#define BUTTON_B  6
//#define BUTTON_C  5

#include <ECCX08.h>   // include crypto chip library:

/*Server*/
WiFiClient netSocket;               // network socket to server
const char server[] = SECRET_SERVER;  // server name
const int port = 80;
String route = "/data";   // API route:
const char contentType[] = "application/json";    // set the content type:
bool postingData = false;

/*SD card*/
File root;    //define data read write variables
File entry;
String fileName = "";
int randNumber;
int sumRandNumber;
String data;

String fileNameByDate = "";

Switch Shutter = Switch(4);  // GPIO 4, create Switch button
int shutterLedPin = 7;  // LED Pin for shutter
int wifiSwitchPin = 6;
int lastwifiSwitchState = 1;    // previous state of the switch pin
int wifiLedPin = 8;  // LED pin for wifi status

const int PRESS_TIME  = 5000;   // variables for time thresholds

// variables for button states
unsigned long pressedTime  = 0;
unsigned long releasedTime = 0;
bool isPressing = false;
bool isDetected = false;
bool record = false;
bool timeRecorded = false;   // this will be used to record only first value of the time reading

HttpClient client(netSocket, server, port);   // the HTTP client is global so you can use it in multiple functions below:
JSONVar bodyPieces;
JSONVar body;
// a unique ID string for this client.
// since you're using the ECCX08 chip, the ID will be
//a 9-byte number in hexadecimal format:
String uid;

/*RGB*/
/*Initialise with specific int time and gain values*/
Adafruit_TCS34725 tcs = Adafruit_TCS34725(TCS34725_INTEGRATIONTIME_700MS, TCS34725_GAIN_1X);
uint16_t r, g, b, c, colorTemp, lux;  // variables used
uint16_t sumR, sumG, sumB, sumColorTemp, sumLux;  // sensor values added during the 5 seconds
float sumH, sumT, sumHic;

/*TEMP*/
#define DHTPIN 2     // Digital pin connected to the DHT sensor
#define DHTTYPE DHT11   // DHT 11
DHT dht(DHTPIN, DHTTYPE);

/*RTC*/
RTCZero rtc;    // make an instance of the library
String dateTime = "";   // make a String for printing:
String firstDateTime = "";
long lastRequestTime = 0;   // request timestamp in minutes:
int lastSecond = 0;   // last second:
int sendInterval = 1;   // interval between requests, in minutes:
bool label = true;

/*---------------------------------------------------------------------------------------------*/
void setup() {
  /*---------------------------------------------------------------*/
  Serial.begin(9600);  // Open serial communications
  dht.begin();  // start DHT11
  rtc.begin(); // initialize RTC

  /*---------------------------------------------------------------*/
  /*Wifi*/
  // start the crypto chip and use its serial number as a unique ID:
  ECCX08.begin();
  uid = ECCX08.serialNumber();
  // Serial.println(uid);
  connectToNetwork();

  /*---------------------------------------------------------------*/
  /*SD card*/
  // Initialization on pin10
  Serial.print("Initializing SD card...");
  if (!SD.begin(10)) {
    Serial.println("initialization failed!");
    while (1);
  }
  Serial.println("initialization done.");

  /*---------------------------------------------------------------*/
  /*Sensors*/
  if (tcs.begin()) {
    Serial.println("Found sensor");
  } else {
    Serial.println("No TCS34725 or DHT11 found ... check your connections");
    while (1);
  }

  /*---------------------------------------------------------------*/
  /*Display*/
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C); // Address 0x3C for 128x32
  Serial.println("OLED begun");
  display.display();
  delay(10);

  /*---------------------------------------------------------------*/
  /*Wifi switch*/
  pinMode(wifiSwitchPin, INPUT);
  pinMode(wifiLedPin, OUTPUT);

  /*---------------------------------------------------------------*/
  root = SD.open("/");

  Serial.println("IO test");

  //  pinMode(BUTTON_A, INPUT_PULLUP);
  //  pinMode(BUTTON_B, INPUT_PULLUP);
  //  pinMode(BUTTON_C, INPUT_PULLUP);

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.clearDisplay();   // Clear the buffer.
  display.setCursor(0, 0);
  display.println("Sensory Snapshot");
  display.display(); // actually display all of the above
}

/*---------------------------------------------------------------------------------------------*/
void loop() {
  // if you disconnected from the network, reconnect:
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_BUILTIN, LOW);
    Serial.println("trying to connect");
    connectToNetwork();
  }

  //------------------if shutter is pressed--------------------//
  Shutter.poll();

  // enable button press only when it's not sending data
  if (!postingData) {
    if (Shutter.released()) {
      Serial.println("Button was pressed");
      pressedTime = millis();
      isPressing = true;
      isDetected = false;
      digitalWrite(shutterLedPin, HIGH);

      // randNumber = random(1, 50);
      // sumRandNumber += randNumber;
      // creating new file name
      fileNameCreator();    // function generating file name based on RTC
      fileName = String(fileNameByDate);

      record = true;  // start recording
    }
  }

  //---------------------button is released---------------------//
  // enable button press only when it's not sending data
  if (!postingData) {
    if (Shutter.pushed()) {
      Serial.println("Button was released");
      isPressing = false;
      releasedTime = millis();
      long pressDuration = releasedTime - pressedTime;
      timeRecorded = false;

      digitalWrite(shutterLedPin, LOW);

      // if press time is shorter than 5 seconds, do nothing
      if ( pressDuration < PRESS_TIME) {
        record = false;  // stop recording
        display.clearDisplay();
        displayNotRecorded();   // tell user that data is not recorded
        displayWifiStatus();
        displaySDCardStatus();
        displayTime();

        Serial.println("Button was pressed for less than 5 seconds. Recording failed.");
      }

      // resetting  values
      // initialize all sum values to 0
      sumColorTemp = 0;
      sumLux = 0;
      sumR = 0;
      sumG = 0;
      sumB = 0;
      sumH = 0;
      sumT = 0;
      sumHic = 0;
      fileNameByDate = "";  // set file name to empty
    }

    //----------if press duration is longer than 5 seconds----------//
    else if (isPressing == true && isDetected == false) {
      long pressDuration = millis() - pressedTime;
      Serial.println("recording");

      if ( pressDuration > PRESS_TIME ) {
        record = false;   // if user presses more than 5 seconds, stop recording the sensor value

        // make JSON object with the recorded data
        bodyPieces["dateTime"]   = firstDateTime;
        bodyPieces["colorTemp"] = sumColorTemp / 7;
        bodyPieces["lux"] = sumLux / 7;
        bodyPieces["r"] = sumR / 7;
        bodyPieces["g"] = sumB / 7;
        bodyPieces["b"] = sumB / 7;
        bodyPieces["humidity"] = sumH / 7;
        bodyPieces["temperature"] = sumT / 7;
        bodyPieces["heatIndex"] = sumHic / 7;

        display.clearDisplay();
        displayRecorded();    // tell user status
        displayWifiStatus();
        displaySDCardStatus();
        displayTime();

        Serial.println("Recording data");
        Serial.println("Button was pressed for more than 5 seconds.");

        // Create new file
        Serial.print("Creating new file named ");
        Serial.print(fileName + String(".txt"));
        Serial.println(".....");

        // open the file. note that only one file can be open at a time,
        // so you have to close this one before opening another.
        root = SD.open(fileName + String(".txt"), FILE_WRITE);

        // if the file opened okay, write to it:
        if (root) {
          Serial.print("Writing to data.txt...");
          body["data"][0] = bodyPieces;
          root.println(JSON.stringify(body));
          Serial.println("Written: " + JSON.stringify(body));
          root.close();   //close the file
          Serial.println("Writing done. Closed.");
        } else {
          //  if the file didn't open, print an error:
          Serial.println("error opening file");
        }
        isDetected = true;
      }
    }
  }

  if (record)
  {
    readSensor();
  }

  // seems this does not work
  // display data storage status
  //checkDataStoreStatus();

  /*---------------------------------------------------------------*/
  /*Posting data to server and get request*/
  // if bt pressed, don't do anything with old file.
  // or if reading  ignore button
  // check if processor is awake
  // if the wifi switch status has changed,
  // LOW is on
  if (digitalRead(wifiSwitchPin) != lastwifiSwitchState) {
    if (digitalRead(wifiSwitchPin) == LOW) {
      serverConnect();
    }
  }
  lastwifiSwitchState = digitalRead(wifiSwitchPin);

  /*---------------------------------------------------------------*/
  /*wifiStatus LED*/
  if (digitalRead(wifiSwitchPin) == HIGH) {
    //      wake();
    digitalWrite(wifiLedPin, LOW);
  } else {
    //      sleep ();
    digitalWrite(wifiLedPin, HIGH);
  }
}

/*---------------------------------------------------------------------------------------------*/
void readSensor() {
  tcs.getRawData(&r, &g, &b, &c);
  // colorTemp = tcs.calculateColorTemperature(r, g, b);
  colorTemp = tcs.calculateColorTemperature_dn40(r, g, b, c);
  lux = tcs.calculateLux(r, g, b);

  /*TEMP*/
  // Reading temperature or humidity takes about 250 milliseconds!
  // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
  float h = dht.readHumidity();
  float t = dht.readTemperature();      // Read temperature as Celsius (the default)
  float f = dht.readTemperature(true);    // Read temperature as Fahrenheit (isFahrenheit = true)

  // Check if any reads failed and exit early (to try again).
  if (isnan(h) || isnan(t) || isnan(f)) {
    Serial.println(F("Failed to read from DHT sensor!"));
    return;
  }

  float hic = dht.computeHeatIndex(t, h, false);  // Compute heat index in Celsius (isFahreheit = false)

  // recording first line of time value only;
  if (!timeRecorded) {
    firstDateTime = getISOTimeString();
    timeRecorded  = true;
  }

  // adding colorTemp
  // those values will be divided by 7, when the records are being stored
  sumColorTemp += colorTemp;
  sumLux += lux;
  sumR += r;
  sumG += g;
  sumB += b;
  sumH += h;
  sumT += t;
  sumHic += hic;
}

/*---------------------------------------------------------------------------------------------*/
/*RTC*/
String getISOTimeString() {
  // ISO8601 string: yyyy-mm-ddThh:mm:ssZ
  String timestamp = "20";
  if (rtc.getYear() <= 9) timestamp += "0";
  timestamp += rtc.getYear();
  timestamp += "-";
  if (rtc.getMonth() <= 9) timestamp += "0";
  timestamp += rtc.getMonth();
  timestamp += "-";
  if (rtc.getDay() <= 9) timestamp += "0";
  timestamp += rtc.getDay();
  timestamp += "T";
  if (rtc.getHours() <= 9) timestamp += "0";
  timestamp += rtc.getHours();
  timestamp += ":";
  if (rtc.getMinutes() <= 9) timestamp += "0";
  timestamp += rtc.getMinutes();
  timestamp += ":";
  if (rtc.getSeconds() <= 9) timestamp += "0";
  timestamp += rtc.getSeconds();
  timestamp += "Z";
  return timestamp;
}

/*creates name of the txt file*/
// using only date, hour, seconds to generate name, due to file name length limit
void fileNameCreator() {
  if (rtc.getDay() <= 9) fileNameByDate += "0";
  fileNameByDate += rtc.getDay();
  if (rtc.getHours() <= 9) fileNameByDate += "0";
  fileNameByDate += rtc.getHours();
  if (rtc.getSeconds() <= 9) fileNameByDate += "0";
  fileNameByDate += rtc.getSeconds();
}

/*---------------------------------------------------------------------------------------------*/
/*Posting data to server and get request*/
void serverConnect() {
  while (WiFi.status() == WL_CONNECTED) {
    entry = root.openNextFile();     // open the next file in the root directory:
    //    Serial.print("entry: ");
    //    Serial.println(entry);
    if (!entry) {
      // no more files
      // when done rewind reset to the pointer.
      break;
    } else {
      // set a 10ms timeout for reading strings from the file
      // (this speeds up reading the strings a bit):
      entry.setTimeout(10);
      // if the file is not a directory:s
      if (!entry.isDirectory()) {
        Serial.println(entry.name());   // print the file name

        // read from the file until there's nothing else in it:
        while (entry.available()) {
          Serial.println("After reading all lines: ");
          data = entry.readString();
          Serial.println(data);
        }
        client.post(route, contentType, data);    // send to server
      }
      entry.close();    // close the file

      delay(250);
      if (client.available()) {
        // read the status code and body of the response
        int statusCode = client.responseStatusCode();
        String response = client.responseBody();

        // print out the response:
        Serial.print("Status code: ");
        Serial.println(statusCode);
        Serial.print("Response: " );
        Serial.println(response);
        // close the request:
        client.stop();
        // timestamp the request if you got a good response:
        if (statusCode == 200) {
          lastRequestTime = rtc.getMinutes();

          // delete the file only when client did a succesful post
          Serial.println("Removing data.txt...");
          SD.remove(entry.name());
          Serial.println("Finished removing...");
        } else {
          root.rewindDirectory();   // didn't get the 200, then rewind the directory
        }
      }

      // check still posting is in progress
      postingData = true;
    }
    postingData = false;
  }
}
/*---------------------------------------------------------------------------------------------*/
/*display*/
/*display shows
  1) Wifi connected status
  2) SD card status
  3) Recorded or not recorded status
  4) Recorded time
  5) Sucess on sending file to the server*/

void displayWifiStatus() {
  display.setCursor(0, 0);
  display.setTextSize(1);
  if (WiFi.status() == WL_CONNECTED) {
    display.print("Wifi connected");
  } else {
    display.print("Wifi disconnected");
  }
  display.display();
}

void displaySDCardStatus() {
  display.setCursor(0, 14);
  display.setTextSize(1);
  if (SD.begin(10)) {
    display.print("SD card working");
  } else {
    display.print("SD card N/A");
  }
  display.display();
}

void displayRecorded() {
  display.setCursor(0, 28);
  display.setTextSize(1);
  display.println("Recorded");
  display.display();
  //  draw_text(0, 35, dateTime.toCharArray(), 1);
}

void displayNotRecorded() {
  display.setCursor(0, 28);
  display.setTextSize(1);
  display.println("Not recorded");
  display.display();
  //  draw_text(0, 35, dateTime.toCharArray(), 1);
}

void displayTime() {
  display.setCursor(0, 42);
  display.setTextSize(1);
  display.print(firstDateTime);
  display.display();
}

void displayFileRemain() {
  display.setCursor(0, 56);
  display.setTextSize(1);
  display.print("Data stored");
  display.display();
}

void displayFileNone() {
  display.setCursor(0, 56);
  display.setTextSize(1);
  display.print("No data stored");
  display.display();
}

void draw_text(byte x_pos, byte y_pos, char *text, byte text_size) {
  display.setCursor(x_pos, y_pos);
  display.setTextSize(text_size);
  display.print(text);
  display.display();
}


void checkDataStoreStatus() {
  entry = root.openNextFile();     // open the next file in the root directory:
  if (entry) {
    displayFileRemain();
  } else {
    displayFileNone();
  }
}
/*---------------------------------------------------------------------------------------------*/
/*Wifi connection*/
void connectToNetwork() {
  // try to connect to the network:
  while ( WiFi.status() != WL_CONNECTED) {
    Serial.println("Attempting to connect to: " + String(SECRET_SSID));
    //Connect to WPA / WPA2 network:
    WiFi.begin(SECRET_SSID, SECRET_PASS);
    delay(2000);
  }
  Serial.println("connected to: " + String(SECRET_SSID));
  // You're connected, turn on the LED:
  digitalWrite(LED_BUILTIN, HIGH);

  // set the time from the network:
  unsigned long epoch;
  do {
    Serial.println("Attempting to get network time");
    epoch = WiFi.getTime();
    delay(2000);
  } while (epoch == 0);

  rtc.setEpoch(epoch - 14400);    // -14400 to calculate EST time
  //  Serial.println(getISOTimeString());
  IPAddress ip = WiFi.localIP();
  Serial.print(ip);
  Serial.print("  Signal Strength: ");
  Serial.println(WiFi.RSSI());
}

/*---------------------------------------------------------------------------------------------*/
// this is currently not used
void setSleep () {
  // switch off
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.disconnect();
  }
  // turn off the status LED:
  digitalWrite(LED_BUILTIN, LOW);
  LowPower.sleep(); // sleep:
}

void setWake() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToNetwork();
  }
}
