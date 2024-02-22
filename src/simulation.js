/* eslint-disable no-restricted-globals */
import { PinState } from "avr8js";


import { AVRBoard } from "./board";
import { ARDUINO_CODE, buildHex } from "./build";
import { Events, PinsOfColors } from "./utils";



const runner = async () => {
    try {
        postMessage({ "eventCode": 4, "message": "Worker is Alive!!" })

        const hex = await buildHex();
        let board = new AVRBoard(hex);

        const ledEventListener = () => {
            let led_states = {};
            for (let [color, pin_number] of Object.entries(PinsOfColors)) {
                led_states[color] = board.portD.pinState(pin_number) === PinState.High ? true : '';
            }
            postMessage({ "eventCode": Events.ledChange, "message": led_states });

        }
        board.portD.addListener(ledEventListener);

        let lastState = PinState.Low;
        let lastStateCycles = 0;
        let ledHighCycles = 0;
        let ledLowCycles = 0;
        let highSpikeCount = 0;
        const pvmLedEventListener = () => {
            const pin11State = board.portB.pinState(3); // Port 11 corresponds to portB 3 
            if (lastState !== pin11State) {
                const delta = board.cpu.cycles - lastStateCycles;
                if (lastState === PinState.High) {
                    ledHighCycles += delta;
                } else {
                    ledLowCycles += highSpikeCount && delta; // In order to calculate pulse width correctly ignore trailing lows at the beggining of sequnce.
                    highSpikeCount += 1;
                }
                lastState = pin11State;
                lastStateCycles = board.cpu.cycles;

                // 2 sequencial low to high pulse spike mean 1 full widht pulse. Since arduino default pvm period is 2ms 
                // This block exptected to run every (pulseCount - 1)*2 ms (if microcontroller runs on 16 MHZ).
                const pulseCount = 50;
                if (highSpikeCount % pulseCount === 0) {
                    let new_brightness = ledHighCycles / (ledHighCycles + ledLowCycles);
                    highSpikeCount = 1;
                    ledHighCycles = 0;
                    ledLowCycles = 0;
                    postMessage({ "eventCode": Events.pvm, "message": new_brightness });
                }
            }
        }
        board.portB.addListener(pvmLedEventListener);

        board.usart.onByteTransmit = (value) => {
            postMessage({ "eventCode": Events.printScreen, "message": String.fromCharCode(value) });
        }

        board.execute();
    } catch (err) {
        postMessage({ "eventCode": Events.error, "message": err })
    }
}



self.addEventListener('message', (e) => {
    if (e.data.eventCode === Events.start) {
        runner()
    }
}, false);

