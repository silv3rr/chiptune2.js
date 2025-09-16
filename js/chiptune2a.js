/*
 * chiptune2a.js
 *  
 * 2a changes:
 *  - add gainNode to play method
*   - define a few additional libopenmpt modules (0.6.6+) which are not in original chiptune2.js
*/

const OPENMPT_MODULE_RENDER_MASTERGAIN_MILLIBEL = 1

// override load to add zip support

ChiptuneJsPlayer.prototype.load = function(input, callback) {
  if (this.touchLocked) {
    this.unlock();
  }
  var player = this;
  if (input instanceof File) {
    var reader = new FileReader();
    reader.onload = function() {
      return callback(reader.result); // no error
    }.bind(this);
    reader.readAsArrayBuffer(input);
  } else {
    //console.log('DEBUG: input=', input)
    var xhr = new XMLHttpRequest();
    xhr.open('GET', input, true);
    xhr.responseType = 'arraybuffer';
    if (input.endsWith('.zip')) {
      //console.log('DEBUG: input is .zip')
      let re = new RegExp(`\.(${valid_extentions})$`, 'i')
      // JSZipUtils.getBinaryContent(input, function(err, data) {
      //   if (err) {
      //     throw err; // or handle err
      //   }
      //   JSZip.loadAsync(data).then(function () {
      //     //console.log(data)
      //     return callback(data); // no error
      //   });
      // });
      xhr.onload = function(e) {
        if (xhr.status === 200) {
          JSZip.loadAsync(xhr.response).then(function (zip) {
            for (file in zip.files) {
              if (file.match(re)) {
                zip.file(file).async("ArrayBuffer").then(function(data) {
                  console.log(data)
                  return callback(data);
                });
              }
            }
          });
        }
      }.bind(this);
    } else {
      xhr.onload = function(e) {
        if (xhr.status === 200) {
          return callback(xhr.response); // no error
        } else {
          player.fireEvent('onError', {type: 'onxhr'});
        }
      }
    }
    xhr.onerror = function() {
      player.fireEvent('onError', {type: 'onxhr'});
    };
    xhr.onabort = function() {
      player.fireEvent('onError', {type: 'onxhr'});
    };
    xhr.send();
  }
}

// old attempt to add gain, doesnt work
/*
ChiptuneJsPlayer.prototype.unlock = function() {
  var context = this.context;
  var buffer = context.createBuffer(1, 1, 22050);
  var unlockSource = context.createBufferSource();
  
  const streamNode = context.createMediaStreamDestination()
  unlockSource.connect(streamNode.destination)

   // make gainNode
  var gain = context.createGain()
  ///this.gain.gain.value = 2
  // audio routing
  //processNode.connect(this.gain)
  //if (this.destination) this.gain.connect(this.destination)	// also connect to output if no gainNode was given  
  console.log('DEBUG: unlockSource =', unlockSource)
  gain.connect(context.destination);
  this.gain = gain;

  this.touchLocked = false;

  unlockSource.buffer = buffer;
  unlockSource.connect(context.destination);
  unlockSource.start(0);
}
*/


// Volume support
// https://github.com/deskjet/chiptune2.js/issues/17

// uncomment to override play method to add gain

/*
ChiptuneJsPlayer.prototype.play = function(buffer) {
  this.stop();
  var processNode = this.createLibopenmptNode(buffer, this.config);
  if (processNode == null) {
    return;
  }

  // set config options on module
  libopenmpt._openmpt_module_set_repeat_count(processNode.modulePtr, this.config.repeatCount);
  libopenmpt._openmpt_module_set_render_param(processNode.modulePtr, OPENMPT_MODULE_RENDER_STEREOSEPARATION_PERCENT, this.config.stereoSeparation);
  libopenmpt._openmpt_module_set_render_param(processNode.modulePtr, OPENMPT_MODULE_RENDER_INTERPOLATIONFILTER_LENGTH, this.config.interpolationFilter);

  this.currentPlayingNode = processNode;
  //processNode.connect(this.context.destination);

  // create a GainNode
  var gain = this.context.createGain()

  // wire gain to speaker output
  gain.connect(this.context.destination)

  // disconnect internal ScriptProcessorNode from speakers
  //this.currentPlayingNode.disconnect()

  // wire script processor to gain
  this.currentPlayingNode.connect(gain)

  // make it quieter
  //gain.gain.value = 0.5

  this.gain = gain.gain;
}
*/

// get totals
ChiptuneJsPlayer.prototype.getTotalSamples = function () {
  return libopenmpt._openmpt_module_get_num_samples(this.currentPlayingNode.modulePtr);
};

ChiptuneJsPlayer.prototype.getTotalInstruments = function () {
  return libopenmpt._openmpt_module_get_num_instruments(this.currentPlayingNode.modulePtr);
};
ChiptuneJsPlayer.prototype.getChannels = function () {
  return libopenmpt._openmpt_module_get_num_channels(this.currentPlayingNode.modulePtr);
};

// get current
ChiptuneJsPlayer.prototype.getCurrentTempo = function () {
  return libopenmpt._openmpt_module_get_current_tempo(this.currentPlayingNode.modulePtr);
};

// 0.7.0+
ChiptuneJsPlayer.prototype.getCurrentTempo2 = function () {
  return libopenmpt._openmpt_module_get_current_tempo2(this.currentPlayingNode.modulePtr);
};

ChiptuneJsPlayer.prototype.getCurrentSpeed = function () {
  return libopenmpt._openmpt_module_get_current_speed(this.currentPlayingNode.modulePtr);
};

ChiptuneJsPlayer.prototype.getCurrentBPM = function () {
  return libopenmpt._openmpt_module_get_current_estimated_bpm(this.currentPlayingNode.modulePtr);
};

ChiptuneJsPlayer.prototype.getCurrentChannels = function () {
  return libopenmpt._openmpt_module_get_current_playing_channels(this.currentPlayingNode.modulePtr);
};

//pattern 
ChiptuneJsPlayer.prototype.formatPatternRowChannel = function (ptr, pattern, row, channels) {
  //console.log("DEBUG: chiptune2.js - ptr pattern row channels", ptr, pattern, row, channels)
  return UTF8ToString(
    libopenmpt._openmpt_module_format_pattern_row_channel(
      ptr,
      pattern,
      row,
      channels,
      0,
      true
    )
  );
};
  
ChiptuneJsPlayer.prototype.formatPatternRowChannelCommand = function () {
  return UTF8ToString(
      libopenmpt._openmpt_module_format_pattern_row_channel_command(
      this.currentPlayingNode.modulePtr,
      this.getCurrentPattern,
      this.getCurrentRows,
      this.getCurrentChannels,
      5
   )
  );
};

// get sample and instrument names
ChiptuneJsPlayer.prototype.getSampleNames = function() {
  var num_samples = libopenmpt._openmpt_module_get_num_samples(this.currentPlayingNode.modulePtr);
  var data = {};
  let name;
  for (var i = 0; i < num_samples; i++) {
    name = UTF8ToString(libopenmpt._openmpt_module_get_sample_name(this.currentPlayingNode.modulePtr, i));
    if (name) {
      data[i] = name;
    }
  }
  return data;
}

ChiptuneJsPlayer.prototype.getInstrumentNames = function() {
  var num_instruments = libopenmpt._openmpt_module_get_num_instruments(this.currentPlayingNode.modulePtr);
  var data = {};
  let name;
  for (var i = 0; i < num_instruments; i++) {
    name = UTF8ToString(libopenmpt._openmpt_module_get_instrument_name(this.currentPlayingNode.modulePtr, i));
    if (name) {
      data[i] = name;
    }
  }
  return data;
}

// module_ctl_set is deprecated. use int, float or text instead
ChiptuneJsPlayer.prototype.module_ctl_set_text = function(ctl, value) {
  ctlBuffer = libopenmpt._malloc(ctl.length + 1)
  valueBuffer = libopenmpt._malloc(value.length + 1)
  writeAsciiToMemory(ctl, ctlBuffer)
  writeAsciiToMemory(value, valueBuffer)
  //return libopenmpt._openmpt_module_ctl_set_text(this.currentPlayingNode.modulePtr, ctlBuffer, valueBuffer) === 1;
  return libopenmpt._openmpt_module_ctl_set_text(this.currentPlayingNode.modulePtr, ctlBuffer, valueBuffer)
}

ChiptuneJsPlayer.prototype.module_ctl_set_floatingpoint = function(ctl, value) {
  ctlBuffer = libopenmpt._malloc(ctl.length + 1)
  writeAsciiToMemory(ctl, ctlBuffer)
  return libopenmpt._openmpt_module_ctl_set_floatingpoint(this.currentPlayingNode.modulePtr, ctlBuffer, value)
}

ChiptuneJsPlayer.prototype.module_ctl_get_floatingpoint = function(ctl) {
  ctlBuffer = libopenmpt._malloc(ctl.length + 1)
  writeAsciiToMemory(ctl, ctlBuffer);
  return libopenmpt._openmpt_module_ctl_get_floatingpoint(this.currentPlayingNode.modulePtr, ctlBuffer)
}

ChiptuneJsPlayer.prototype.module_set_position_seconds = function(value) {
  return libopenmpt._openmpt_module_set_position_seconds(this.currentPlayingNode.modulePtr, value)
}

ChiptuneJsPlayer.prototype.module_get_current_channel_vu_left = function(value) {
  return libopenmpt._openmpt_module_get_current_channel_vu_left(this.currentPlayingNode.modulePtr, value)
}

ChiptuneJsPlayer.prototype.module_get_current_channel_vu_right = function(value) {
  return libopenmpt._openmpt_module_get_current_channel_vu_right (this.currentPlayingNode.modulePtr, value)
}

ChiptuneJsPlayer.prototype.module_get_current_channel_vu_mono = function(value) {
  return libopenmpt._openmpt_module_get_current_channel_vu_mono(this.currentPlayingNode.modulePtr, value)
}

ChiptuneJsPlayer.prototype.get_string = function(key) {
  keyBuffer = libopenmpt._malloc(key.length + 1)
  writeAsciiToMemory(key, keyBuffer)
  return UTF8ToString(libopenmpt._openmpt_get_string(keyBuffer))
}

ChiptuneJsPlayer.prototype.getGain = function() {
  //return this.gain.gain.value;
  return this.gain;
}

// Set player libopenmpt volume (0..100)
// from https://github.com/orhun/CoolModFiles

// percentageToMillibel converts range of decibel to percentage and back again
// from https://gist.github.com/below9k/cf17e10341cb5c61a03a53a64cc35fb2

function percentageToMillibel(pct) {
  let mB = 0;
  //if (pct === 0) {
  if (pct <= 0.01) {
    mB = -6000;
  } else if (pct <= 80) {
    // 0..80% = -6000..0 millibel
    mB = Math.round(100 * 20 * Math.log(pct * (100 / 80) * 0.01) / Math.log(10));
  } else if (pct <= 100) {
    // 80..100% = 0..1000 millibel
    // 10 db ~= 316.227766%
    mB = Math.round(100 * 20 * Math.log((100 + (pct - 80) / 20 * 216.227766) * 0.01) / Math.log(10));
  }
  return mB;
} 

// TODO: for getVolume
function millibelToPercentage(mB) {
  const min = 0
  const max = 1000
  pct = (mB - min) / (max - min) * 100
  //pct = (100 - 0) / (1000 - -6000) + mB
  return pct 
}

/*
function millibelToPercentage(mB) {
    var pct = 0
    const minPct = 80
    const maxPct = 100
    const min_mB = -6000
    const max_mB = 1000
    const getPct = (mB) => (Math.round(1000000000 * Math.pow(10, mB / 20)) / 10000000)
    const getMaxPct = maxPct || (_.isNumber(max_mB) && getPct(max_mB)) || 100
    const getMinPct = minPct || (_.isNumber(min_mB) && getPct(min_mB)) || 0
    const range = getMaxPct - getMinPct
    const newPct = (range / 100) * pct
    //console.log(getMaxPct, getMinPct, newPct, getPct(mB))
    return Math.round(1000000000 * 20 * (Math.log(newPct * 0.01) / Math.log(10))) / 1000000000
}
*/

ChiptuneJsPlayer.prototype.setVolume = function(volume) {
  this.config.volume = volume
  if (this.currentPlayingNode != null) {
    //console.log('DEBUG: volume =', volume, 'pctToMillibel =', pctToMillibel(volume))
    libopenmpt._openmpt_module_set_render_param(this.currentPlayingNode.modulePtr, OPENMPT_MODULE_RENDER_MASTERGAIN_MILLIBEL, percentageToMillibel(volume),);
  }
};

ChiptuneJsPlayer.prototype.getVolume = function() {
  if (this.currentPlayingNode != null) {
    const valueBuffer = new Uint8Array(1)
    const ptrToValueBuffer = libopenmpt._malloc(valueBuffer.length); 
    const volume = libopenmpt.HEAPU8.subarray(ptrToValueBuffer, ptrToValueBuffer + valueBuffer.length);
    libopenmpt._openmpt_module_get_render_param(this.currentPlayingNode.modulePtr, OPENMPT_MODULE_RENDER_MASTERGAIN_MILLIBEL, ptrToValueBuffer);
    const uint32Array = new Int32Array(volume.buffer, volume.byteOffset, (volume.byteLength));
    //return millibelToPercentage(uint32Array[0])
    return [uint32Array[0] , millibelToPercentage(uint32Array[0])]
  }
};
