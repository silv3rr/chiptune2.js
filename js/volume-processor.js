const SMOOTHING_FACTOR = 0.8;
//const FRAME_PER_SECOND = 1;
const FRAME_PER_SECOND = 60;
const FRAME_INTERVAL = 1 / FRAME_PER_SECOND;


// TODO: implement clipping from old createAudioMeter in VolumeMeter class below


// Examples worklet

// Create an AudioWorkletNode
//let audioWorkletNode = new AudioWorkletNode(audioContext, 'my-audio-worklet-processor');


// Connect the AudioWorkletNode to the AudioContext
//audioContext.destination.connect(audioWorkletNode);

//let node = new AudioWorkletNode(context, 'volumeAudioProcess');

//node.port.postMessage({ type: 'setGain', value: 0.5 });


/*
class createAudioMeter extends AudioWorkletNode {
	constructor(context) {
		//super();
		//let node = new AudioWorkletNode(context, 'volumeAudioProcess');
		//audioContext.destination.connect(audioWorkletNode);
		//node.onaudioprocess = (event) => {}
		//super(context, 'volumeAudioProcess');
		let node = new AudioWorkletNode(context, 'volumeAudioProcess');
		//audioContext.destination.connect(audioWorkletNode);
		
	}
}
*/

/*
function __createAudioMeter(audioContext ,clipLevel, averaging, clipLag) {
	var processor = audioContext.createScriptProcessor(512);
	processor.onaudioprocess = volumeAudioProcess;
	processor.clipping = false;
	processor.lastClip = 0;
	processor.volume = 0;
	processor.clipLevel = clipLevel || 0.98;
	processor.averaging = averaging || 0.95;
	processor.clipLag = clipLag || 750;

	// this will have no effect, since we don't copy the input to the output,
	// but works around a current Chrome bug.
	processor.connect(audioContext.destination);

	processor.checkClipping =
		function(){
			if (!this.clipping)
				return false;
			if ((this.lastClip + this.clipLag) < window.performance.now())
				this.clipping = false;
			return this.clipping;
		};

	processor.shutdown =
		function(){
			this.disconnect();
			this.onaudioprocess = null;
		};

	return processor;
}
*/

// rewrite volume-meter.js

class VolumeMeter extends AudioWorkletProcessor {
    static get parameterDescriptors() {
    //    return [
	//		{name: 'clipping', defaultValue: false},
	//		{name: 'lastClip', defaultValue: 0},
	//		{name: 'volume', defaultValue: 0}
    //    ];
    }
	constructor() {	
		super();
		//this.event = event;
		this.window;
		this._clipping = false;
		this._lastClip = 0;
		this._volume = 0;
		this._clipLevel = 0.98;
		this._averaging = 0.95;  // SMOOTHING_FACTOR
		this._clipLag = 750;
	    this._lastUpdate = currentTime;
      	//this.port.onmessage = (event) => {
        //	console.log('DEBUG: volumeAudioProcess onmessage event =', event.data)
		//}			
	}
	process(inputs, outputs, parameters) {
		//const clipping = parameters.clipping
		//const lastClip = parameters.lastClip
		//var buf = event.inputBuffer.getChannelData(0);
		var buf = inputs[0][0]
		var bufLength = buf ? buf.length : 0;
		var sum = 0;
		var x;

		//console.log('DEBUG: buf =', buf)
		//console.log('DEBUG: buf.length =', buf.length)

		if ((bufLength > 0) && (currentTime - this._lastUpdate > FRAME_INTERVAL)) {
			//console.log('update', bufLength)
			// Do a root-mean-square on the samples: sum up the squares...
			for (var i = 0; i < bufLength; i++) {
				x = buf[i];
				//console.log('DEBUG: x =', x)
				if (Math.abs(x) >= this._clipLevel && this.window) {
					this._clipping = true;
					this._lastClip = this.window.performance.now();
				}
				sum += x * x;
			}
			//console.log('DEBUG: sum =', sum)


			// ... then take the square root of the sum.
			var rms = Math.sqrt(sum / bufLength);

			// Now smooth this out with the averaging factor applied
			// to the previous sample - take the max here because we
			// want "fast attack, slow release."
			this._volume = Math.max(rms, this._volume * this._averaging);
			//this.buf = buf;

			this._lastUpdate = currentTime;
			//console.log('DEBUG: volumeAudioProcess this._volume =', this._volume)
			this.port.postMessage({
				buffer: buf,
				volume: this._volume,
				clipping: this.clipping
			});
		}
		return true
	}
}

registerProcessor('volume-processor', VolumeMeter);
