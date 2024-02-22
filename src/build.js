import { Events } from "./utils";

export const ARDUINO_CODE = `

byte leds[] = {2, 3, 4, 5, 6, 7, 11};
unsigned long oldTime = 0;

void setup() {
  Serial.begin(115200);    
  for (byte i = 0; i < sizeof(leds); i++) {
    pinMode(leds[i], OUTPUT);
  }
}

int i = 0;
byte brightness = 0;
bool digital_reset = true;

unsigned long screenTimeCounter = 0;
unsigned long pvmLedTimeCounter = 0;
unsigned long digitalLedCounter = 0;

const int PVM_DELAY = 20;
const int SCREEN_DELAY = 1000;
const int LED_DELAY = 100;


void loop() {
    unsigned long deltaTime = calculateDeltaTime();
    screenTimeCounter += deltaTime;
    pvmLedTimeCounter += deltaTime;
    digitalLedCounter += deltaTime;
    
    if(screenTimeCounter > SCREEN_DELAY){
        Serial.println("Hello World");
        screenTimeCounter = 0;
    }
    
    if(pvmLedTimeCounter > PVM_DELAY){
        analogWrite(11, brightness);
        delay(20);
        brightness++;
        pvmLedTimeCounter = 0;
    }    
    
    if(digital_reset){
        digitalWrite(leds[i % 6], HIGH);
        digital_reset = false;
        
    } else if(digitalLedCounter > 200){
        i += 1;
        digital_reset = true;
        digitalLedCounter = 0;
    } else if(digitalLedCounter > 100){
        digitalWrite(leds[i % 6], LOW);
        
    }

}

float calculateDeltaTime(){
    unsigned long currentTime = millis();
    unsigned long deltaTime = currentTime - oldTime;
    oldTime = currentTime;
    return deltaTime;
}`;


export const buildHex = async () => {
    try {
        const result = await fetch('https://hexi.wokwi.com/build', {
            method: 'post',
            body: JSON.stringify({ sketch: ARDUINO_CODE }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const { hex, stderr } = await result.json();
        if (!hex) {
            throw stderr;
        }

        return hex;
    } catch (err) {
        postMessage({ "eventCode": Events.error, "message": err })
    }
}