/* eslint-disable no-restricted-globals */
import {
    CPU,
    avrInstruction,
    AVRIOPort,
    portDConfig,
    PinState,
    AVRTimer,
    timer0Config,
} from 'avr8js';

import { parseHex } from './hex-parser';
import { Events, PinsOfColors } from "./utils";

export const ARDUINO_CODE = `
// LEDs connected to pins 8..13

byte leds[] = {2, 3, 4, 5, 6, 7};
void setup() {
  for (byte i = 0; i < sizeof(leds); i++) {
    pinMode(leds[i], OUTPUT);
  }
}

int i = 0;
void loop() {
    digitalWrite(leds[i % 6], HIGH);
    delay(100);
    digitalWrite(leds[i % 6], LOW);
    delay(200);
    i += 1;
}`;


const buildHex = async () => {
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

const runner = async () => {
    try {
        postMessage({ "eventCode": 4, "message": "Worker is Alive!!" })

        const hex = await buildHex();

        let program = new Uint16Array(0x8000); // 0x800 neede here.(library specific.)
        parseHex(hex, new Uint8Array(program.buffer));
        postMessage({ "eventCode": Events.info, "message": `Program successfully compiled. Instruction Codes: ${program} ` });

        const cpu = new CPU(program);
        const port = new AVRIOPort(cpu, portDConfig);
        const timer = new AVRTimer(cpu, timer0Config);

        const ledEventListener = () => {
            let led_states = {};
            for (let [color, pin_number] of Object.entries(PinsOfColors)) {
                led_states[color] = port.pinState(pin_number) === PinState.High ? true : '';
            }
            postMessage({ "eventCode": Events.ledChange, "message": led_states });

        }
        port.addListener(ledEventListener);

        let counter = 0; // Approximate real time counter
        const clock_speed = 16000000; // Default Clock Frequency of arduino

        // Run nearly every 1 second and measure how cpu time
        setInterval(() => {
            counter += 1;
            postMessage({ "eventCode": Events.info, "message": `Normal Time: ${counter}, CPU time: ${cpu.cycles / clock_speed}, type: ${typeof cpu.cycles}` })
        }, 1000)

        while (true) {
            // avrInstruction(cpu);
            // cpu.tick();
            for (let i = 0; i < clock_speed; i++) {
                avrInstruction(cpu);
                cpu.tick();
            }
            await new Promise((resolve) => setTimeout(resolve));
        }
    } catch (err) {
        postMessage({ "eventCode": Events.error, "message": err })
    }
}


self.addEventListener('message', (e) => {
    if (e.data.eventCode === Events.start) {
        runner()
    }
}, false);