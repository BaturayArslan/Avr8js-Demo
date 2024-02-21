import React from 'react';

import { Events, PinsOfColors } from './utils';
import { ARDUINO_CODE } from './simulation';
import '@wokwi/elements';

export default function App() {

	const [rlState, setRlState] = React.useState('');
	const [blState, setBlState] = React.useState('');
	const [grState, setGrState] = React.useState('');
	const [whState, setWhState] = React.useState('');
	const [ylState, setYlState] = React.useState('');
	const [orState, setOrState] = React.useState('');

	const COLORS = {
		'red': [rlState, setRlState],
		'blue': [blState, setBlState],
		'green': [grState, setGrState],
		'white': [whState, setWhState],
		'yellow': [ylState, setYlState],
		'orange': [orState, setOrState],
	};

	let ledHTML = [];

	for (let [color, [state, setState]] of Object.entries(COLORS)) {
		ledHTML.push(<wokwi-led color={color} value={state} label={PinsOfColors[color]} />)
	}


	const setupWorker = (worker) => {
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

					for (let [color, [ledState, setState]] of Object.entries(COLORS)) {
						if (ledState !== updatedLedStates[color]) {
							// Light state flipped.
							console.log(`${color} light turned ${ledState === '' ? 'ON' : 'OFF'}`);
							setState(updatedLedStates[color]);
							COLORS[color][0] = updatedLedStates[color]
						}
					}
					break;
				default:
					break;
			};
		}
	}

	const runWorker = () => {
		const sim_worker = new Worker(new URL('./simulation.js', import.meta.url));
		setupWorker(sim_worker);
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
		</div>
	);
}