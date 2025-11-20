class ChiptuneProcessor extends AudioWorkletProcessor{
  constructor() {
      super();
  }
  process(inputs, outputs, params) {

		if (!this.modulePtr || !this.leftPtr || !this.rightPtr || this.paused) return true	//silence


    //var outputL = outputs.outputBuffer.getChannelData(0);
    //var outputR = outputs.outputBuffer.getChannelData(1);

    const outputL = outputs[0][0]
		const outputR = outputs[0][1]


    var framesToRender = outputL.length;
    if (this.ModulePtr == 0) {
      for (var i = 0; i < framesToRender; ++i) {
        outputL[i] = 0;
        outputR[i] = 0;
      }
      this.disconnect();
      this.cleanup();
      return;
    }
    if (this.paused) {
      for (var i = 0; i < framesToRender; ++i) {
        outputL[i] = 0;
        outputR[i] = 0;
      }
      return;
    }
    var framesRendered = 0;
    var ended = false;
    var error = false;
    while (framesToRender > 0) {
      var framesPerChunk = Math.min(framesToRender, maxFramesPerChunk);
      var actualFramesPerChunk = libopenmpt._openmpt_module_read_float_stereo(this.modulePtr, this.context.sampleRate, framesPerChunk, this.leftBufferPtr, this.rightBufferPtr);
      if (actualFramesPerChunk == 0) {
        ended = true;
        // modulePtr will be 0 on openmpt: error: openmpt_module_read_float_stereo: ERROR: module * not valid or other openmpt error
        error = !this.modulePtr;
      }
      var rawAudioLeft = libopenmpt.HEAPF32.subarray(this.leftBufferPtr / 4, this.leftBufferPtr / 4 + actualFramesPerChunk);
      var rawAudioRight = libopenmpt.HEAPF32.subarray(this.rightBufferPtr / 4, this.rightBufferPtr / 4 + actualFramesPerChunk);
      for (var i = 0; i < actualFramesPerChunk; ++i) {
        outputL[framesRendered + i] = rawAudioLeft[i];
        outputR[framesRendered + i] = rawAudioRight[i];
      }
      for (var i = actualFramesPerChunk; i < framesPerChunk; ++i) {
        outputL[framesRendered + i] = 0;
        outputR[framesRendered + i] = 0;
      }
      framesToRender -= framesPerChunk;
      framesRendered += framesPerChunk;
    }
    if (ended) {
      this.disconnect();
      this.cleanup();
      error ? processNode.player.fireEvent('onError', {type: 'openmpt'}) : processNode.player.fireEvent('onEnded');
    }
    //return processNode;
    return true;
  }
}

registerProcessor('chiptune-processor', ChiptuneProcessor);