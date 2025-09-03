
// Source: https://github.com/deskjet/chiptune2.js/pull/46

/* Docs: https://lib.openmpt.org/doc/group__libopenmpt__ext__c.html
         https://lib.openmpt.org/doc/structopenmpt__module__ext__interface__interactive.html
        
  Parameters openmpt_module_ext_get_interface

      mod_ext	The module handle to work on.
      interface_id	The name of the extension interface to retrieve (e.g. LIBOPENMPT_EXT_C_INTERFACE_PATTERN_VIS).
      interface	Appropriate structure of interface function pointers which is to be filled by this function (e.g. a pointer to a openmpt_module_ext_interface_pattern_vis structure).
      interface_size	Size of the interface's structure of function pointers (e.g. sizeof(openmpt_module_ext_interface_pattern_vis)). 

  Structs

  interactive
    [0] int(* 	set_current_speed )(openmpt_module_ext *mod_ext, int32_t speed)
    [1] int(* 	set_current_tempo )(openmpt_module_ext *mod_ext, int32_t tempo)
    [2] int(* 	set_tempo_factor )(openmpt_module_ext *mod_ext, double factor)
    [3] double(* 	get_tempo_factor )(openmpt_module_ext *mod_ext)
    [4] int(* 	set_pitch_factor )(openmpt_module_ext *mod_ext, double factor)
    [5] double(* 	get_pitch_factor )(openmpt_module_ext *mod_ext)
    [6] int(* 	set_global_volume )(openmpt_module_ext *mod_ext, double volume)
    [7] double(* 	get_global_volume )(openmpt_module_ext *mod_ext)
    [8] int(* 	set_channel_volume )(openmpt_module_ext *mod_ext, int32_t channel, double volume)    
    [9] double(* 	get_channel_volume )(openmpt_module_ext *mod_ext, int32_t channel)
    [10] int(* 	set_channel_mute_status )(openmpt_module_ext *mod_ext, int32_t channel, int mute)    
    [11] int(* 	get_channel_mute_status )(openmpt_module_ext *mod_ext, int32_t channel)    
    [12] int(* 	set_instrument_mute_status )(openmpt_module_ext *mod_ext, int32_t instrument, int mute)    
    [13] int(* 	get_instrument_mute_status )(openmpt_module_ext *mod_ext, int32_t instrument)    
    [14] int32_t(* 	play_note )(openmpt_module_ext *mod_ext, int32_t instrument, int32_t note, double volume, double panning)    
    [15] int(* 	stop_note )(openmpt_module_ext *mod_ext, int32_t channel)
    
  interactive2
    [0] int(* 	note_off )(openmpt_module_ext *mod_ext, int32_t channel)
    [1] int(* 	note_fade )(openmpt_module_ext *mod_ext, int32_t channel)
    [2] int(* 	set_channel_panning )(openmpt_module_ext *mod_ext, int32_t channel, double panning)
    [3] double(* 	get_channel_panning )(openmpt_module_ext *mod_ext, int32_t channel)
    [4] int(* 	set_note_finetune )(openmpt_module_ext *mod_ext, int32_t channel, double finetune)
    [5] double(* 	get_note_finetune )(openmpt_module_ext *mod_ext, int32_t channel)
  
  interactive3
    [0] int(* 	set_current_tempo2 )(openmpt_module_ext *mod_ext, double tempo)

  pattern_vis
    [0] int(* 	get_pattern_row_channel_volume_effect_type )(openmpt_module_ext *mod_ext, int32_t pattern, int32_t row, int32_t channel)
    [1] int(* 	get_pattern_row_channel_effect_type )(openmpt_module_ext *mod_ext, int32_t pattern, int32_t row, int32_t channel)
*/

const interfaceFunctionIndex = {}
  
interfaceFunctionIndex['interactive'] = {
  set_current_speed: 0,
  //set_current_tempo: 1,    // deprecated
  set_tempo_factor: 2,
  get_tempo_factor: 3,
  set_pitch_factor: 4,
  get_pitch_factor: 5,
  set_global_volume: 6,
  get_global_volume: 7,
  set_channel_volume: 8,
  get_channel_volume: 9,
  set_channel_mute_status: 10,
  get_channel_mute_status: 11,
  set_instrument_mute_status: 12,
  get_instrument_mute_status: 13,
  play_note: 14,
  stop_note: 15
}

// TODO: fix other interfaces, these do not work

/*
interfaceFuncIndex['interactive2'] = {
  note_off: 0,
  note_fade: 1,
  set_channel_panning: 2,
  get_channel_panning: 3,
  set_note_finetune: 4,
  get_note_finetune: 5

}
interfaceFuncIndex['interactive3'] = {
  set_current_tempo2: 0
}

interfaceFuncIndex['pattern_vis'] = {
  get_pattern_row_channel_effect_type: 0,
  get_pattern_row_channel_volume_effect_type: 1
}
*/


// add to func createLibopenmptNode from chiptune2.js:
//   libopenmpt._openmpt_module_ext_create_from_memory(ptrToFile, byteArray.byteLength, 0, 0, 0, 0, 0, 0, 0);
//   (and destroy on cleanup)

// override (disabled)
ChiptuneJsPlayer.prototype.__createLibopenmptNode = function(buffer, config) {
  // TODO error checking in this whole function

  var maxFramesPerChunk = 4096;
  var processNode = this.context.createScriptProcessor(2048, 0, 2);
  processNode.config = config;
  processNode.player = this;
  var byteArray = new Int8Array(buffer);
  var ptrToFile = libopenmpt._malloc(byteArray.byteLength);
  libopenmpt.HEAPU8.set(byteArray, ptrToFile);
  processNode.modulePtr = libopenmpt._openmpt_module_create_from_memory(ptrToFile, byteArray.byteLength, 0, 0, 0);
  // add extModulePtr (for openmpt_module_ext_get_interface)
  processNode.extModulePtr = libopenmpt._openmpt_module_ext_create_from_memory(ptrToFile, byteArray.byteLength, 0, 0, 0, 0, 0, 0, 0);
  processNode.paused = false;
  processNode.leftBufferPtr  = libopenmpt._malloc(4 * maxFramesPerChunk);
  processNode.rightBufferPtr = libopenmpt._malloc(4 * maxFramesPerChunk);
  processNode.cleanup = function() {
    if (this.modulePtr != 0) {
      libopenmpt._openmpt_module_destroy(this.modulePtr);
      this.modulePtr = 0;
    }
    if (this.extModulePtr != 0) {
      libopenmpt._openmpt_module_ext_destroy(this.extModulePtr);
      this.extModulePtr = 0;
    }
    if (this.leftBufferPtr != 0) {
      libopenmpt._free(this.leftBufferPtr);
      this.leftBufferPtr = 0;
    }
    if (this.rightBufferPtr != 0) {
      libopenmpt._free(this.rightBufferPtr);
      this.rightBufferPtr = 0;
    }
  }
  processNode.stop = function() {
    this.disconnect();
    this.cleanup();
  }
  processNode.pause = function() {
    this.paused = true;
  }
  processNode.unpause = function() {
    this.paused = false;
  }
  processNode.togglePause = function() {
    this.paused = !this.paused;
  }
  processNode.onaudioprocess = function(e) {
    var outputL = e.outputBuffer.getChannelData(0);
    var outputR = e.outputBuffer.getChannelData(1);
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
      // var actualFramesPerChunk = libopenmpt._openmpt_module_read_interleaved_float_stereo(this.modulePtr, this.context.sampleRate, framesPerChunk, this.leftBufferPtr, this.rightBufferPtr);
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
  }
  return processNode;
}



// XXX: passes args to interface function (e.g. tempo, factor, volume etc)
//      calls interface function with wasmTable.get(func)(modulePtr, args) and returns result
//      (or uint32Array[idx])

ChiptuneJsPlayer.prototype.getInterface = function(interface_id) {
  //console.log('DEBUG: wasmtable =', wasmTable)
  //console.log('DEBUG: interface_id =', interface_id)
  const ptrToInterfaceId = libopenmpt._malloc(interface_id.length+1)
  writeAsciiToMemory(interface_id, ptrToInterfaceId)
  const structInterfaceBuf = new Int8Array(64)
  const ptrToStructInterfaceBuf = libopenmpt._malloc(structInterfaceBuf.length); 
  const structInterface = libopenmpt.HEAPU8.subarray(ptrToStructInterfaceBuf, ptrToStructInterfaceBuf + structInterfaceBuf.length);
  const result = libopenmpt._openmpt_module_ext_get_interface(this.currentPlayingNode.extModulePtr, ptrToInterfaceId, ptrToStructInterfaceBuf, structInterfaceBuf.length);
  libopenmpt._free(ptrToInterfaceId)
  libopenmpt._free(ptrToStructInterfaceBuf)
  if (result == 1) {
    const uint32Array = new Uint32Array(structInterface.buffer, structInterface.byteOffset, (structInterface.byteLength));
    //console.log('DEBUG: uint32Array =', uint32Array)
    //console.log('DEBUG: uint32Array[index] =', uint32Array[index])
    //console.log(wasmTable.get(uint32Array[7])(this.currentPlayingNode.extModulePtr))
    //console.log(wasmTable.get(uint32Array[7]))
    //console.log(libopenmpt.dynCall_ji(uint32Array[7], this.currentPlayingNode.extModulePtr));
    return uint32Array 
  } else {
    console.error('ERROR:', interface_id, result)
  }
}

ChiptuneJsPlayer.prototype.getInterfaceFunctions = function(interface_id) {
  return this.getInterface(interface_id)
}

ChiptuneJsPlayer.prototype.getInterfaceFunctionAddr = function(interface_id, function_name) {
  let index = interfaceFunctionIndex[interface_id][function_name];
  const functions = this.getInterfaceFunctions(interface_id)
  //console.log('DEBUG: index =', index)
  return functions[index]
}

ChiptuneJsPlayer.prototype.interfaceFunction = function(interface_id, function_name, ...args) {
  const func_addr = this.getInterfaceFunctionAddr(interface_id, function_name)
  return wasmTable.get(func_addr)(this.currentPlayingNode.extModulePtr, ...args)
}


// example functions that call specific interface function

// global volume
ChiptuneJsPlayer.prototype.setGlobalVolume = function(volume) {
  let func_addr = this.getInterfaceFunctionAddr('interactive', 'set_global_volume')
  return wasmTable.get(func_addr)(this.currentPlayingNode.extModulePtr, volume);
}
ChiptuneJsPlayer.prototype.getGlobalVolume = function() {
  let func_addr = this.getInterfaceFunctionAddr('interactive', 'get_global_volume')
  return wasmTable.get(func_addr)(this.currentPlayingNode.extModulePtr);
}


// TODO: wrapper for all functions for 'inactive' interface

ChiptuneJsPlayer.prototype.interactiveFunction = function() {

  //constructor(){
  //  const uint32Array = this.getInterfaceFunctions('interactive');
  //}

  //uint32Array: this.getInterfaceFunctions('interactive'),

  const uint32Array = this.getInterfaceFunctions('interactive');
  
  /*
  const setCurrentSpeed = function (speed) {
    console.log('xxxx', uint32Array)
  };
  */


  const setCurrentSpeed = (speed) => {
    //console.log(getInterfaceFunctions('interactive'))
    //console.log(this.getInterfaceFunctions('interactive'))
    //console.log(ChiptuneJsPlayer.prototype)
    //console.log(parent)
    //return wasmTable.get(this.uint32Array[0])(this.currentPlayingNode.extModulePtr, speed);
    //console.log(window.getInterfaceFunctions('interactive'))
    console.log('xxxx', uint32Array)
  };
  
}

 /* 
  static setCurrentSpeed(speed) {
    return wasmTable.get(this.uint32Array[0])(this.currentPlayingNode.extModulePtr, speed);
  };

 // deprecated
  //static setCurrentTempo(tempo) {
  //  return wasmTable.get(uint32Array[1])(this.currentPlayingNode.extModulePtr, tempo);
  //};
  static setTempoFactor(factor) {
    //return libopenmpt.dynCall_jii(uint32Array[2], this.currentPlayingNode.extModulePtr, factor);
    return wasmTable.get(uint32Array[2])(this.currentPlayingNode.extModulePtr, factor);
  };
  static getTempoFactor() {
    //return libopenmpt.dynCall_ji(uint32Array[3], this.currentPlayingNode.extModulePtr);
    return wasmTable.get(uint32Array[3])(this.currentPlayingNode.extModulePtr, factor);
  };
  static setPitchFactor(factor) {
    return wasmTable.get(uint32Array[4])(this.currentPlayingNode.extModulePtr, factor);
  };
  static getPitchFactor() {
    return wasmTable.get(uint32Array[5])(this.currentPlayingNode.extModulePtr);
  };
  static setGlobalVolume(volume) {
    return wasmTable.get(uint32Array[6])(this.currentPlayingNode.extModulePtr, volume);
  };
  static getGlobalVolume() {
    return wasmTable.get(uint32Array[7])(this.currentPlayingNode.extModulePtr);
  };
  static setChannelVolume(channel, volume) {
    return wasmTable.get(uint32Array[8])(this.currentPlayingNode.extModulePtr, channel, volume);
  };
  static getChannelVolume(channel) {
    return wasmTable.get(uint32Array[9])(this.currentPlayingNode.extModulePtr, channel);
  };
  static setChannelMuteStatus(channel, mute) {
    return wasmTable.get(uint32Array[10])(this.currentPlayingNode.extModulePtr, channel, mute);
  };
  static getChannelMuteStatus(channel) {
    return wasmTable.get(uint32Array[11])(this.currentPlayingNode.extModulePtr, channel);
  };
  static setInstrumentMuteStatus(instrument, mute) {
    return wasmTable.get(uint32Array[12])(this.currentPlayingNode.extModulePtr, instrument, mute);
  };
  static getInstrumentMuteStatus(instrument) {
    return wasmTable.get(uint32Array[13])(this.currentPlayingNode.extModulePtr, instrument);
  };
  static playNote(instrument, note, volume, panning) {
    return wasmTable.get(uint32Array[14])(this.currentPlayingNode.extModulePtr, instrument, note, volume, panning);
  };
  static stopNote(channel) {
    return wasmTable.get(uint32Array[15])(this.currentPlayingNode.extModulePtr, channel);
  };
  //console.log("Here is function to get mute : ", getMuteCh);
  //console.log("Here is function to set mute : ", setMuteCh);
  //console.log('DEBUG getMuteCh =', getMuteCh(1))
  //console.log('DEBUG setMuteCh =', setMuteCh(1, 1))
  //console.log('DEBUG getMuteCh =', getMuteCh(1))
  //console.log('DEBUG getGlobalVolume =', getGlobalVolume())
  //console.log('DEBUG setGlobalVolume =', setGlobalVol(0.5))
  //console.log('DEBUG getGlobalVolume =', getGlobalVolume())
};
*/