import {
    CPU,
    avrInstruction,
    AVRIOPort,
    portDConfig,
    portBConfig,
    PinState,
    AVRTimer,
    timer0Config,
    timer1Config,
    timer2Config,
    portCConfig,
    AVRUSART,
    usart0Config,
} from 'avr8js';

import { parseHex } from './hex-parser';


export class AVRBoard {
    constructor(hex) {
        this.program = new Uint16Array(0x8000); // 0x800 neede here.(library specific.)
        parseHex(hex, new Uint8Array(this.program.buffer));

        this.CLOCK_SPEED = 16e6; // scientific notation of default clock speed of arduino.

        this.cpu = new CPU(this.program);
        this.portD = new AVRIOPort(this.cpu, portDConfig);
        this.portB = new AVRIOPort(this.cpu, portBConfig);
        this.timer0 = new AVRTimer(this.cpu, timer0Config);
        this.timer1 = new AVRTimer(this.cpu, timer1Config); // Neede for pvm functionality.
        this.timer2 = new AVRTimer(this.cpu, timer2Config); // Needed for pvm functionality.
        this.portB = new AVRIOPort(this.cpu, portBConfig);
        this.portC = new AVRIOPort(this.cpu, portCConfig);
        this.portD = new AVRIOPort(this.cpu, portDConfig);
        this.usart = new AVRUSART(this.cpu, usart0Config, this.CLOCK_SPEED);

    }

    execute() {
        while (true) {
            avrInstruction(this.cpu);
            this.cpu.tick();
        }
    }
}