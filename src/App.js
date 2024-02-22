import React from 'react';
import '@wokwi/elements';

import { Events, PinsOfColors } from './utils';
import { ARDUINO_CODE } from './build';

export default function App() {

	const [rlState, setRlState] = React.useState('');
	const [blState, setBlState] = React.useState('');
	const [grState, setGrState] = React.useState('');
	const [whState, setWhState] = React.useState('');
	const [ylState, setYlState] = React.useState('');
	const [orState, setOrState] = React.useState('');
	const [pvmState, setPvmState] = React.useState('');
	const [lcdState, setLcdState] = React.useState('');

	const ledStates = {
		'red': [rlState, setRlState],
		'blue': [blState, setBlState],
		'green': [grState, setGrState],
		'white': [whState, setWhState],
		'yellow': [ylState, setYlState],
		'orange': [orState, setOrState],
	};

	const pvmLedStates = {
		"pvm11": [pvmState, setPvmState],
	};

	const screenStates = {
		"lcdScreen": [lcdState, setLcdState],
	};

	let ledHTML = [];
	for (let [color, [state, setState]] of Object.entries(ledStates)) {
		ledHTML.push(<wokwi-led color={color} value={state} label={PinsOfColors[color]} />)
	}
	ledHTML.push(<wokwi-led color="blue" value={pvmState} brightness={pvmState} label="PVM 11" />) // Add pvm led.



	const runWorker = () => {
		const sim_worker = new Worker(new URL('./simulation.js', import.meta.url));
		setupWorker(sim_worker, ledStates, pvmLedStates, screenStates);
		sim_worker.postMessage({ eventCode: Events.start, message: "" });
	}

	return (
		<div>
			<h1>Arduino ve Avr8js 101</h1>
			{ledHTML}
			<button onClick={runWorker} style={{ display: 'block', marginTop: '32px' }}>
				Run
			</button>
			<textarea
				value={ARDUINO_CODE}
				readonyl
				style={{ width: '100%' }}
				rows="20"

			/>
			<textarea
				value={"Console:\n" + lcdState}
				readonyl
				style={{ width: '100%' }}
				rows="20"

			/>

		</div>
	);
}


const setupWorker = (worker, ledStates, pvmLedStates, screenStates) => {
	let lastPvmEventTime = 0;
	let isFirstPvmEvent = true;

	worker.onmessage = (e) => {
		switch (e.data.eventCode) {
			case Events.info:
				console.log(e.data.message);
				break;

			case Events.stop:
				worker.terminate();
				break;

			case Events.error:
				console.log(e.data.message);
				worker.terminate();
				console.log("Worker Stopped.");
				break;

			case Events.ledChange:
				let updatedLedStates = e.data.message;

				for (let [color, [state, setState]] of Object.entries(ledStates)) {
					if (state !== updatedLedStates[color]) {
						// Light state flipped.
						//console.log(`${color} light turned ${state === '' ? 'ON' : 'OFF'}`);
						setState(updatedLedStates[color]);
						ledStates[color][0] = updatedLedStates[color]
					}
				}
				break;

			case Events.pvm:
				let { pvm11 } = pvmLedStates;
				let [state, setState] = pvm11;
				let brightness = e.data.message;

				setState(brightness);

				if (isFirstPvmEvent) {
					lastPvmEventTime = new Date();
					isFirstPvmEvent = false;
				} else {
					let currentTime = new Date();
					console.log(`Brightness of pvm led: ${brightness} and ${currentTime - lastPvmEventTime} milisecond passed after last event.`)
					lastPvmEventTime = currentTime;
				}
				break;

			case Events.printScreen:
				const character = e.data.message;
				const { lcdScreen } = screenStates;
				let [lcdState, setLcdState] = lcdScreen;

				setLcdState((state, props) => {
					return state + character;
				});

				break;

			default:
				break;
		};
	}
}