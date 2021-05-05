/*
  WiFi Status check
  Context: Arduino, with WINC1500 module
  This sketch is not identical with the ESP8266WiFi library.
  Check that library's online examples for changes.
  Some changes are noted in the comments below
*/

#include <SPI.h>
//#include <WiFi101.h>        // use this for MKR1000 boards
//#include <ESP8266WiFi.h>  // use this instead of WiFi101 for ESP8266 modules
#include <WiFiNINA.h>       // use this for MKR1010 and Nano 33 IoT boards
#include "arduino_secrets.h"

/*display*/
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display = Adafruit_SSD1306(128, 64, &Wire);

long rssi = 0;
int currentRssi = 0;
int lastRssi = 0;

// OLED FeatherWing buttons map to different pins depending on board:
#if defined(ESP8266)
#define BUTTON_A  0
#define BUTTON_B 16
#define BUTTON_C  2
#elif defined(ESP32)
#define BUTTON_A 15
#define BUTTON_B 32
#define BUTTON_C 14
#elif defined(ARDUINO_STM32_FEATHER)
#define BUTTON_A PA15
#define BUTTON_B PC7
#define BUTTON_C PC5
#elif defined(TEENSYDUINO)
#define BUTTON_A  4
#define BUTTON_B  3
#define BUTTON_C  8
#elif defined(ARDUINO_FEATHER52832)
#define BUTTON_A 31
#define BUTTON_B 30
#define BUTTON_C 27
#else // 32u4, M0, M4, nrf52840 and 328p
#define BUTTON_A  9
#define BUTTON_B  6
#define BUTTON_C  5
#endif

void setup() {
  Serial.begin(9600);
  while (!Serial);        // wait for serial monitor to open

  // while you're not connected to a WiFi AP,
  while ( WiFi.status() != WL_CONNECTED) {
    Serial.print("Attempting to connect to Network named: ");
    Serial.println(SECRET_SSID);           // print the network name (SSID)
    WiFi.begin(SECRET_SSID, SECRET_PASS);  // try to connect
    delay(5000);                    // wait 2 seconds before next attempt
  }

  /*display*/
  Serial.println("OLED FeatherWing test");
  // SSD1306_SWITCHCAPVCC = generate display voltage from 3.3V internally
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C); // Address 0x3C for 128x32

  Serial.println("OLED begun");

  // Show image buffer on the display hardware.
  // Since the buffer is intialized with an Adafruit splashscreen
  // internally, this will display the splashscreen.
  display.display();
  delay(10);

  // Clear the buffer.
  display.clearDisplay();
  display.display();

  Serial.println("IO test");

  pinMode(BUTTON_A, INPUT_PULLUP);
  pinMode(BUTTON_B, INPUT_PULLUP);
  pinMode(BUTTON_C, INPUT_PULLUP);

  // text display tests
  // use \n for line break
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Connected");
  //display.setCursor(0, 0);
  display.display(); // actually display all of the above
}

void loop() {
  /*display*/
  if (!digitalRead(BUTTON_A)) display.print("A");
  if (!digitalRead(BUTTON_B)) display.print("B");
  if (!digitalRead(BUTTON_C)) display.print("C");

  printWiFiStatus();

  currentRssi = rssi;

  if (currentRssi  != lastRssi)
  {
    // keep on clearing input
    for (int y = 7; y < 64; y++)
    {
      for (int x = 0; x < 127; x++)
      {
        display.drawPixel(x, y, BLACK);
      }
    }
    display.setCursor(0, 21);
    display.print("Strength: ");
    display.println(rssi);
    delay(5);
    yield();

    lastRssi = currentRssi;
  }
  display.display();
  delay(5000);
}

void printWiFiStatus() {
  // print the SSID of the WiFi AP to which you're attached:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print the gateway address of the WiFi AP to which you're attached:
  IPAddress ip = WiFi.gatewayIP();
  Serial.print("Gateway IP Address: ");
  Serial.println(ip);

  // print the subnet mask of the WiFi AP to which you're attached:
  IPAddress subnet = WiFi.subnetMask();
  Serial.print("Netmask: ");
  Serial.println(subnet);

  // print the MAC address of the WiFi AP to which you're attached:
  // note: BSSID won't work on the ESP8266, so comment this block out for that processor
  byte apMac[6];
  WiFi.BSSID(apMac);
  Serial.print("BSSID (Base station's MAC address): ");
  for (int i = 0; i < 5; i++) { // loop from 0 to 4
    if (apMac[i] < 0x10) {      // if the byte is less than 16 (0x0A hex)
      Serial.print("0");        // print a 0 to the string
    }
    Serial.print(apMac[i], HEX);// print byte of MAC address
    Serial.print(":");          // add a colon
  }
  Serial.println(apMac[5], HEX);// println final byte of address


  // print your MAC address:
  byte mac[6];
  WiFi.macAddress(mac);
  Serial.print("Device MAC address: ");

  /*
     NOTE: ESP stores MAC address in the reverse order that WIFi101 does.
     For WiFi101, loop from mac[5] to mac[0]. For ESP, loop from
     mac[0] to mac[5]

  */
  for (int i = 5; i > 0; i--) { // loop from 5 to 1  -- for WiFi101
    //    for (int i = 0; i < 5; i++) { // loop from 1 to 5 -- for ESP8266

    if (mac[i] < 0x10) {        // if the byte is less than 16 (0x0A hex)
      Serial.print("0");        // print a 0 to the string
    }
    Serial.print(mac[i], HEX);  // print byte of MAC address
    Serial.print(":");          // add a colon
  }
  Serial.println(mac[0], HEX);  // println final byte of address  -- for WiFi101
  //Serial.println(mac[5], HEX);  // println final byte of address  -- for ESP8266

  // print your  IP address:
  IPAddress gateway = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(gateway);

  // print the received signal strength from the WiFi AP:
  rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
  Serial.println();
}
