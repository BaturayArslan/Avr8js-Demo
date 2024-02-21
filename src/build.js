import { Events } from "./utils";

export const ARDUINO_CODE = `

byte leds[] = {2, 3, 4, 5, 6, 7, 11};
void setup() {
  for (byte i = 0; i < sizeof(leds); i++) {
    pinMode(leds[i], OUTPUT);
  }
}

int i = 0;
byte brightness = 0;
void loop() {
    // digitalWrite(leds[i % 6], HIGH);
    // delay(100);
    // digitalWrite(leds[i % 6], LOW);
    // delay(200);
    // i += 1;
    analogWrite(11, brightness);
    delay(20);
    brightness++;

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