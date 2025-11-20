/*
 * WMPlay - Web Mod Player
 * Needs: libopenmpt.js chiptune2.js and chiptune2a.js
 */

// TODO: 
//  - change setinterval player loop
//      remove loop?  (only needed for patterviewer?)
//      or change to set timeout callback instead of interval:  setTimeout(() => { ... }, 1000);
//  - convert ScriptProcessorNode in chiptune2 to AudioWorklet (..like chiptune3 :-)
//      var processNode = this.context.createScriptProcessor(2048, 0, 2);
//  - feat: oscilloscope (needs analyser)
//  - feat: currently playing sample/instrument name in patternviewer
//  - feat: make middle row current in patternviewer, instead of bottom row (and highlight)
//  - feat: make rainbox a toggle
//  - fix: getVolume 
//  - fix: auto play next song (ios only?) --> fixed?
//  - fix: if vu and visualizer was off before songs plays, enabling on the fly doesnt work (regression) 
//          -- move check back to player loop?
//  - resume/suspend audio context? https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume


// MDN Web Audio API Examples
//  https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/visualizers_with_Web_Audio_API
//  https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createAnalyser


/* Options */

const delay = 50
const repeat = 0
const play_at_end = "stop"
const pattern_max_rows = 12
const default_playlist = true
const playlist_file = 'playlists.html'
const valid_extentions = 'it|dmf|mod|mtm|s3m|xm|zip'

const show_libopenmpt = 'bottom'  // 'bottom|marquee'
const show_notifications = true
const show_open_button = true
const show_gain = false

const visuals = ['sinewave', 'line', 'frequencybars', 'invertedbars']
var visualRainbow
var visualSetting = "random"  // "off", "random", or visuals[i]

const use_drop_files = false
const use_gain_node = false
const use_libopenmpt_volume = false
const use_old_lib = false
const default_example_modurl = "https://api.modarchive.org/downloads.php?moduleid=57925#space_debris.mod"

var debug = 2
var mute = false
var enable_volume_meter = true

var toggle_sort = { file: true, title: true, date: true, time: true, size: true }
var volMeterData = { volume: 0, buffer: 0, clipping: false }
var drawVisual


function selectOptions() {
  const getLocal = {
    shuffle: localStorage.getItem('shuffle') ? localStorage.getItem('shuffle') : null,
    play_next: localStorage.getItem('play_next') ? localStorage.getItem('play_next') : null,
    show_vu: localStorage.getItem('show_vu') ? localStorage.getItem('show_vu') : null,
    show_mini_vu: localStorage.getItem('show_mini_vu') ? localStorage.getItem('show_mini_vu') : null,
    show_visualizer: localStorage.getItem('show_visualizer') ? localStorage.getItem('show_visualizer') : null,
  }
  return {
    THEME: {
      "default": "wmplay-default",
      "impulse": "impulse-tracker",
      "scream": "scream-tracker",
      "fast": "fasttracker",
      "cubic": "cubic-player",
      //TODO;
      //"default": "ttbdmp",
    },
    OPTIONS: {
      "shuffle": (getLocal['shuffle'] === 'true') ? true : false,
      "play_next": (getLocal['play_next'] === 'true') ? true : false,
      "show_vu": (getLocal['show_vu'] === 'true') ? true : false,
      "show_mini_vu": (getLocal['show_mini_vu'] === 'true') ? true : false,
      "show_visualizer": (getLocal['show_visualizer'] === 'true') ? true : false,
    },  
    CONFIG: {
      "repeat": repeat,
      "pattern_max_rows": pattern_max_rows,
      "visualSetting": visualSetting,
    }
  }
}

const notifications = {
  reload: `<a href="?" onclick="location.reload();"> 🔄 Reload</a> to apply setting(s)`,
  performance: "⚠ NOTE: performance sucks with visualizer enabled ;(",
  old_lib: "⚠ NOTE: does not play 100% correctly, IT resonance filters are missing",
}


window['libopenmpt'] = {}

libopenmpt.locateFile = function (filename) {
  if (filename.endsWith(".mem") || filename.endsWith(".wasm")) return location.protocol + '//' + location.host + location.pathname + 'js/' + filename;
  return location.protocol + '//' + location.host + location.pathname + filename
}


libopenmpt.onRuntimeInitialized = function () {
  //var fileaccess = document.querySelector('*');
  //var file
  var intervalID
  var player
  var format_position_time
  var format_tempo_factor
  var format_pitch_factor
  var format_row_num
  var format_pattern
  var format_order
  var format_bpm
  var format_channels
  var format_pattern_row_all_channels = []
  var all_channels_vu_mono
  var position_seconds
  var position_percent
  var current_channels
  var current_speed
  var current_tempo
  var modurl
  var modtitle
  var modfile
  var moddate
  var modsize
  var default_modurl
  var duration_seconds
  var max_row_length = 180
  var currentVisual

  console.log('libopenmpt.onRuntimeInitialized')

  function init() {    
    console.log('init')
    button = document.getElementById("stop")
    if (button) {
      button.disabled = false
    }
    // TODO: msg processor
    //   volumeMeterNode.port.postMessage("node test123");
    //   console.log('DEBUG: vu =', volumeMeterNode)
    if (player == undefined) {
      console.log('player is undefined')
      player = new ChiptuneJsPlayer(new ChiptuneJsConfig(repeat));
      player.onEnded(() => { endSong(); })
      if (debug > 2) {
        console.log('DEBUG: player =', player, ' player config =', player.config, ' player context =', player.context)
        console.log('DEBUG: player currentPlayingNode =', player.currentPlayingNode)
      }
      // make sure we clear patterns of prev song (array of rows)
      format_pattern_row_all_channels = []

      //  TODO:

      // change   intervalID = setInterval(() => { }, delay)  // end setInterval
      // to       timeoutID = setTimeout(() => { }, delay)  // end setTimeout

      // check if song is actually playing
      // if (player.currentPlayingNode && (player.currentPlayingNode.modulePtr && player.currentPlayingNode.modulePtr > 0)) { }


      setInterval(() => {
        if (player.currentPlayingNode && (player.currentPlayingNode.modulePtr && player.currentPlayingNode.modulePtr > 0)) {
          currentSongInfo();
          patternViewer();
        }
      }, delay)


      //songInfo()

      //console.log('DEBUG: getVolume', player.getVolume());
      // test meter vol peaks (>10,20,30,40)
      if (debug > 4) {
        roundvol = roundNumDec(volMeterData.volume * 100, 0);
        [10, 20, 30, 40].forEach(pct =>(roundvol > pct) && console.log(`DEBUG: round volume >${pct}`, volMeterData.volume, roundvol))
      }
      if (debug > 3) {
        console.log('DEBUG: volumeMeterNode =', volumeMeterNode, ' volMeterData.volume =', volMeterData.volume)
      }

      // TODO: use vol from libopenmpt (sum all channels)
      if (use_libopenmpt_volume) {
        let sum_vol = 0;
        for (let chan_vol of all_channels_vu_mono) {
          sum_vol += chan_vol;
        }
        document.getElementById('debug').innerHTML = sum_vol
      }

      // TODO: use getGain
      // requires changing chiptuneJsPlayer.prototype.play
      if (use_gain_node) {
        getGain()
      }

    } else {
      //player.context.suspend()
      player.stop();
      setPauseButtonId();
    }
  } // end init()


  /* Helper functions */

  function numOrZero(num) {
    return num ? num : 0
  }

  function strOrEmpty(str) {
    return str ? str : ''
  }

  function roundNumDec(num, dec) {
    return Number(Math.round(num + `e${dec}`) + `e-${dec}`);
  }

  function leftPadNum(num, len) {
    return num.toString().padStart(len, '0')
  }


  function getVisualSetting() {
    if (visualSetting === 'random') {
      let idx = visuals.indexOf(currentVisual)
      while (visuals[idx] == currentVisual) {
        idx = Math.floor(Math.random() * visuals.length)
      }
      currentVisual = visuals[idx]
    } else {
      currentVisual = visualSetting
    }
    return currentVisual
  }

  function setModData() {
    document.querySelectorAll(".song").forEach(e => {
      if (e.getAttribute("data-modurl") === modurl) {
        modtitle = e.getAttribute("data-modtitle")
        modtime = e.getAttribute("data-modtime")
        modfile = e.getAttribute("data-modfile")
        moddate = e.getAttribute("data-moddate")
        modsize = e.getAttribute("data-modsize")
        if (debug > 1) {
          console.log(`DEBUG: setModData modurl=${modurl} moddata modtitle="${modtitle}" modtime=${modtime} modfile=${modfile} moddate=${moddate} modsize=${modsize}`)
        }
        e.style.color = 'var(--song-playing-color)'
      } else {
        e.style.color = 'inherit'
      }
    })
  }

  function setElements() {
    if (use_old_lib && show_notifications) {
      document.getElementById('notification').innerHTML = notifications['old_lib']
    }
    document.getElementById('current_order').innerHTML = "order: 00"
    document.getElementById('current_pattern').innerHTML = "pattern: 00"
    document.getElementById('position_range').disabled = false
    document.getElementById('current_speed').disabled = false
    document.getElementById('current_tempo').disabled = false
    document.getElementById('tempo_range').disabled = false
    document.getElementById('pitch_range').disabled = false
    document.getElementById('volume_range').disabled = false
    document.getElementById('gain_range').disabled = false
    document.getElementById('tempo_range').value = "1.00"
    document.getElementById('pitch_range').value = "1.00"
    document.getElementById('position_range').min = 0
    document.getElementById('position_range').max = 0
    document.getElementById('info').style.display = "block"
    document.getElementById('patterns').style.display = "block"
    document.getElementById('text').style.display = "block"
    document.getElementById('message').style.display = "none"
    document.getElementById('samples').style.display = "none"
    document.getElementById('instruments').style.display = "none"
    document.getElementById('channel_vu_meters').innerHTML = ""
    document.getElementById('channels').innerHTML = ""
    document.getElementById('pattern_row_channel').innerHTML = ""
    document.getElementById('pattern_row_channel').style.width = "100%"
    document.getElementById('next').disabled = false
    document.getElementById('prev').disabled = false
    document.getElementById('open').style.display = "none"
    document.querySelectorAll('#pitch,#tempo').forEach(e => e.value = 1);
    document.getElementById('vu-right').style.display = 'none';
    document.getElementById('vu-left').innerHTML = `${'<div></div>'.repeat(10)}`
    document.getElementById('vu-right').style.display = 
    document.getElementById('visual_change').innerHTML = '<button class="btn-txt" id="visualizer_next">change</button>'
    document.querySelector('#visual_change').addEventListener('click', function (e) {
      let visual = getVisualSetting()
      visualize(visual);
      document.getElementById("visual_name").innerHTML = visual ? `"${visual}"` : `"..."`;
    });
    /*
    document.getElementById('visual_rainbow').innerHTML = '<input type="checkbox" id="visualizer_rainbow"> rainbow</input>'
    checkbox = document.querySelector("input[id=visualizer_rainbow]");
    checkbox.addEventListener('change', function() {
      visualRainbow = this.checked;
    });
    */

    document.getElementById('visual_rainbow_on').innerHTML = '<button class="btn-txt" id="visualizer_rainbow">on</button>'
    document.querySelector('#visualizer_rainbow').addEventListener('click', function (e) {
      visualRainbow = true;
      //this.innerHTML = '<button class="btn-txt" id="visualizer_rainbow">[x] on</button>'
      //console.log('DEBUG: visualRainbow=', visualRainbow)
      //document.getElementById("visual_name").innerHTML = visual ? `"${visual}"` : `"..."`;
    });

    document.getElementById('visual_rainbow_off').innerHTML = '<button class="btn-txt" id="visualizer_normal">off</button>'
    document.querySelector('#visualizer_normal').addEventListener('click', function (e) {
      visualRainbow = false;
    });    

    //document.querySelector(".visualizer").style.backgroundColor = 'lightgray';
    //document.getElementById('visualizer').style.width = '55%';
    //document.getElementById('canvas').style.backgroundColor = 'black';
    //document.getElementById('visualizer').style.backgroundColor = 'var(--bg-inner-color)';
    if (debug > 1) {
      console.log('DEBUG: show_vu =', selectOptions().OPTIONS.show_vu, ', show_visualizer =', selectOptions().OPTIONS.show_visualizer)
    }
    document.getElementById('vu').style.display = selectOptions().OPTIONS.show_vu  ? 'block' : 'none';
    document.getElementById('visualizer').style.display = selectOptions().OPTIONS.show_visualizer ? 'block' : 'none';
    if (show_libopenmpt === 'marquee') {
      let scroller = document.getElementById("scroller").innerHTML
      document.getElementById("scroller").innerHTML = scroller.replace('</marquee>', ` (${ChiptuneJsPlayer.prototype.get_string("core_version")}) </marquee>`)
    }
    if (show_libopenmpt === 'bottom') {
      document.getElementById("bottom").innerHTML = ChiptuneJsPlayer.prototype.get_string("core_version")
    }    
    if (debug > 3) {
      document.getElementById('debug').innerHTML = `
        <div id="debug_volume">${volMeterData.volume}</div>
        <div id="debug_buffer">${volMeterData.buffer}</div>`
      document.getElementById('debug').style = 'background-color:whitesmoke';
      document.getElementById('debug_buffer').style = 'background-color:whitesmoke;height:150px;word-wrap:break-word;overflow:scroll'
    }    
  }

  function currentSongInfo() {
    //
    // Get data
    //
    //let duration_seconds = numOrZero(player.duration())
    position_seconds = numOrZero(player.getCurrentTime())
    position_percent = Math.floor((position_seconds / duration_seconds) * 100)
    let remaining_seconds = duration_seconds - position_seconds
    let format_remaining_min = leftPadNum(Math.floor(remaining_seconds / 60), 2)
    let format_remaining_sec = leftPadNum(Math.floor(remaining_seconds % 60), 2)
    let format_position_mm_ss = `${format_remaining_min}:${format_remaining_sec}`
    format_position_time = format_position_mm_ss ? format_position_mm_ss : '00:00'
    format_tempo_factor = player.ctl_get_floatingpoint('play.tempo_factor').toFixed(2)
    format_pitch_factor = player.ctl_get_floatingpoint('play.pitch_factor').toFixed(2)
    format_order = leftPadNum(numOrZero(player.getCurrentOrder()), 2)
    format_pattern = leftPadNum(numOrZero(player.getCurrentPattern()), 2)
    format_bpm = roundNumDec(numOrZero(player.getCurrentBPM()), 0)
    current_channels = leftPadNum(numOrZero(player.getCurrentChannels()), 2)
    current_speed = leftPadNum(numOrZero(player.getCurrentSpeed()), 2)
    current_tempo = leftPadNum(numOrZero(player.getCurrentTempo()), 3)
    //
    // Show data
    //
    //document.getElementById('time').innerHTML = `time: <strong>${format_position_mm_ss}</strong><br>`;
    //document.getElementById('progress').innerHTML = `<p><progress value="${position_seconds}" ma`x=`"${duration_seconds}"></progress> &nbsp; (${position_percent}&#37;)</p>`;
    //document.getElementById('current_row').innerHTML = `row: ${format_row_num}`
    document.getElementById('current_channels').innerHTML = `channels: ${current_channels}`
    document.getElementById('current_bpm').innerHTML = `bpm: ${format_bpm}`
    document.getElementById("position_range").value = roundNumDec(position_seconds, 0)  
    document.getElementById("position_time").innerHTML = (remaining_seconds < 0) ? '--:--' : `-${format_position_time}`
    document.getElementById("position_percent").innerHTML = `(${position_percent}%)`
    document.getElementById('pitch_factor').innerHTML = format_pitch_factor
    document.getElementById('tempo_factor').innerHTML = format_tempo_factor
    document.getElementById('current_order').innerHTML = `order: <span id='value-highlight'>${format_order}</span>`
    document.getElementById('current_pattern').innerHTML = `pattern: ${format_pattern}`
    document.getElementById('current_speed').innerHTML = `speed: ${current_speed}`
    document.getElementById('current_tempo').innerHTML = `tempo: ${current_tempo}`
  }

  function patternViewer() {
    //
    // Get data
    //
    let format_pattern_result = ''
    let format_pattern_row_channel = []
    let format_get_current_channel_vu_mono = []
    let format_last_row_num = format_row_num
    format_row_num = leftPadNum(numOrZero(player.getCurrentRow() + 1), 3)
    format_channels = ''
    for (let i = 0; i < player.getChannels(); i++) {
      format_channels += `${(i === 0 ? '\u00A0'.repeat(6) : '\u00A0')} <span id="channel">channel ${leftPadNum(i + 1, 2)}: ${(i < player.getChannels() - 1 ? ' | ' : '')}</span>`
      format_pattern_row_channel[i] = player.format_pattern_row_channel(player.getCurrentPattern(), player.getCurrentRow(), i)
      //format_pattern_row_channel[i] = player.format_pattern_row_channel(i)
      format_get_current_channel_vu_mono[i] = roundNumDec(numOrZero(player.get_current_channel_vu_mono(i)), 2)
    }
    let format_pattern_row_channel_text = `${format_row_num}: ${format_pattern_row_channel.join(' | ')}`
    let row_length = format_pattern_row_channel_text.length
    if (format_row_num !== format_last_row_num) {
      format_pattern_row_all_channels.push(`<span style='background-color:black'>${format_pattern_row_channel_text}\u00A0</span>`)
      //row++
    }
    if (row_length >= max_row_length) {
      //console.log(`DEBUG: format_pattern_row_all_channels ${row_length} >=${max_row_length} set width to max-content`)
      document.getElementById('pattern_row_channel').style.width = "max-content"
    } else {
      //console.log(`DEBUG: format_pattern_row_channels ${row_length} smaller than ${max_row_length}, set width width to 99%`)
      document.getElementById('pattern_row_channel').style.width = "99%"  // "fit-content"
    }
    // TODO:
    all_channels_vu_mono = format_get_current_channel_vu_mono
    if (debug > 3) {
      console.log('DEBUG: all_channels_vu_mono =', all_channels_vu_mono)
    }
    //
    // Show data
    //
    //document.getElementById('patterns').style.height = `${7 + pattern_max_rows}lh`
  
    format_pattern_result = ''

    let pattern_length = format_pattern_row_all_channels.length
    let pattern_start = pattern_length - pattern_max_rows;
    let mid_row = (pattern_max_rows/2)

    /*
    if (format_pattern_row_all_channels[pattern_start+(mid_row-1)]) {
      format_pattern_row_all_channels[pattern_start+5] = format_pattern_row_all_channels[pattern_start+5].replace('background-color:blue', 'background-color:black')
    }

    if (format_pattern_row_all_channels[pattern_start+mid_row]) {
      format_pattern_row_all_channels[pattern_start+6] = format_pattern_row_all_channels[pattern_start+6].replace(/background-color:(black|#333)/, 'background-color:blue')
    }
    */

    if (format_pattern_row_all_channels[pattern_length-2]) {
      format_pattern_row_all_channels[pattern_length-2] = format_pattern_row_all_channels[pattern_length-2].replace('background-color:darkblue', 'background-color:black')
    }

    if (format_pattern_row_all_channels[pattern_length-1]) {
      format_pattern_row_all_channels[pattern_length-1] = format_pattern_row_all_channels[pattern_length-1].replace(/background-color:(black|#333)/, 'background-color:darkblue')
    }

    for (let i = pattern_start; i < pattern_length; i++) {
      if (i % 5 == 0) {
        //console.log('DEBUG: format_pattern_row_all_channels[i]=', format_pattern_row_all_channels[i])
        if (format_pattern_row_all_channels[i]) {
          format_pattern_row_all_channels[i] = format_pattern_row_all_channels[i].replace('background-color:black', 'background-color:#333')
        }
      }
      format_pattern_result += format_pattern_row_all_channels[i] ? format_pattern_row_all_channels[i] + ' \n' : ''
    }

    //format_pattern_result = format_pattern_row_all_channels.slice(pattern_start, pattern_length).join('\n');

    document.getElementById('channels').innerHTML = format_channels
    document.getElementById('pattern_row_channel').innerHTML = format_pattern_result
    if (selectOptions().OPTIONS.show_mini_vu) {
      for (let i = 0; i < all_channels_vu_mono.length; i++) {
        if (document.getElementById('meter_' + i)) {
          document.getElementById('meter_' + i).setAttribute('value', all_channels_vu_mono[i])
        } else {
          document.getElementById('channel_vu_meters').innerHTML += `${(i === 0 ? '\u00A0'.repeat(4) : '')} <meter id="meter_${i}" value="0" min="0" max="1" low="0.4" high="0.7" optimum="0.1"></meter>`
        }
      }
    }
    //format_all_channels_vu_mono = []
  }

  function endSong() {
    let set_position = true
    stopSong(set_position)
    player = undefined
    //meter = undefined
    console.log('DEBUG: clear intervalID = ', intervalID)
    clearInterval(intervalID)
    document.getElementById('song_info').innerHTML = ''
    document.getElementById('scroller').innerHTML = '<marquee style="color:var(--marquee-color);background-color:var(--marquee-bg-color);">No module loaded, click on a song below</marquee>'
    document.getElementById("position_time").innerHTML = `00:00`
    document.getElementById("position_percent").innerHTML = "100%"
    document.getElementById('position_range').disabled = true
    document.getElementById('tempo_range').disabled = true
    document.getElementById('pitch_range').disabled = true
    document.getElementById('patterns').style.display = 'none'
    document.getElementById('text').style.display = 'none'
    document.querySelectorAll(".song").forEach(e => {
      e.style.color = 'inherit'
    })
    // TODO: cleanup, use init instead of start/stopAudio
    initVolMeter().then(() => {
      stopAudio();
      isPlaying = false;
      isModuleLoaded = false
      volMeterData.volume = 0;
    })
    if (selectOptions().OPTIONS.play_next) {
      if (selectOptions().OPTIONS.shuffle) {
        let max = document.querySelectorAll('.song').length
        index = Math.floor(Math.random() * (max - 0) ) + 0;
        if (document.querySelectorAll('.song')[index]) {
          modurl = document.querySelectorAll('.song') ? document.querySelectorAll('.song')[index].getAttribute("data-modurl") : null
        }
        loadURL(modurl)
      } else {
        nextSong();
      }
    }
  }

  function metaData(filename) {
    let format_song_id = ''
    let format_filename = ''
    let format_location = ''
    let format_message = ''
    let format_instruments = ''
    let format_samples = ''
    let metadata = player.metadata() ? player.metadata() : {}
    let num_message = metadata['message'] ? metadata['message'].split(/\r?\n/).length - 1 : 0
    let num_orders = numOrZero(player.getTotalOrder())
    let num_patterns = numOrZero(player.getTotalPatterns())
    let num_samples = numOrZero(player.getTotalSamples())
    let num_instruments = numOrZero(player.getTotalInstruments())
    let channels = numOrZero(player.getChannels())
    let sample_names = strOrEmpty(player.getSampleNames())
    let instrument_names = strOrEmpty(player.getInstrumentNames())
    //let duration_seconds = numOrZero(player.duration())
    let format_num_patterns = leftPadNum(num_patterns, 2)
    let format_duration_min = leftPadNum(Math.floor(duration_seconds / 60).toString(), 2)
    let format_duration_sec = leftPadNum(Math.floor(duration_seconds % 60).toString(), 2)
    let format_duration_mm_ss = `${format_duration_min}:${format_duration_sec}`
    let format_duration_time = format_duration_mm_ss ? format_duration_mm_ss : '00:00'
    let format_position_max = roundNumDec(duration_seconds, 0)
    let format_bg_style_height = (num_message + num_samples + num_instruments > 0) ? `calc(3 * ${num_message + num_samples + num_instruments}em)` : "1500px"
    let size = 0
    let date = ''

    // format filename and size from filepicker, or use filename(path)
    if (typeof filename === 'object') {
      try {
        metadata['filename'] = filename.name
        metadata['date'] = new Date(filename.lastModified).toISOString()
        format_filename = filename.name.split('/').reverse()[0]
        format_location = filename.webkitRelativePath ? filename.webkitRelativePath : 'local'
        size = `${roundNumDec(filename.size / 1024, 0)}`
      } catch (e) {
        console.log('DEBUG: filename error =', e)
      }
    } else {
      format_filename = filename.length > 0 ? filename.split('/').reverse()[0] : ''
      format_location = filename.length > 0 ? filename.match(/(.*)[\/\\]/)[1] : ''
    }

    // fallback to moddata, if available
    if ((format_filename == '' || format_filename.length < 3) && modfile) {
      format_filename = modfile
    }
    if (format_filename.match('.zip$', 'i') && modfile) {
      format_filename += ` (${modfile})`
    }
    if (!size || size <= 0 && modsize) {
      size = modsize
    }
    if (!metadata['date'] || date == '' && moddate) {
      date = moddate
    }

    format_filename = format_filename ? decodeURI(format_filename.split(/[/#?]/).pop()) : 'N/A'
    format_song_id = metadata['filename'] ? metadata['filename'] : format_filename
    format_location = format_location.split('/').pop()
    format_location = format_location ? format_location : '<span id="font-bg-color">N/A</span>'

    if (metadata['song_title'] && metadata['artist']) {
      format_song_id = `${metadata['title']} - ${metadata['artist']}`
    } else if (metadata['title']) {
      format_song_id = metadata['title']
    } else if (modtitle) {
      format_song_id = modtitle
    }

    if (debug > 0) {
      console.log(`DEBUG: filename=`, filename, `\n\nmetadata modtitle=${modtitle} modsize=${modsize} moddate=${moddate} format_filename=${format_filename}`)
      //console.log('DEBUG: metadata = ', metadata);
      //console.log('DEBUG: format_bg_style_height = ', format_bg_style_height);
    }

    let format_current_song_info = ` \
      filename: ${modurl ? `<a href="${modurl}">` + format_filename + '</a>' : format_filename}
      location: ${format_location}
      song: <span id='value'>"${format_song_id ? format_song_id : '<span id="font-bg-color">N/A</span>'}"</span>
      duration: ${format_duration_time}
      date: ${(date !== '' && date !== null) ? date : '<span id="font-bg-color">N/A</span>'}
      size: ${size ? `${Number(size)}kb` : '<span id="font-bg-color">N/A</span>'}
      ${(subsongs > 1) ? `subsongs: ${subsongs}\n` : '' } \
      patterns: ${format_num_patterns}
      channels: ${leftPadNum(channels, 2)}
      type: ${metadata['type_long'] ? metadata['type_long'] : '<span id="font-bg-color">N/A</span>'}
      tracker: ${metadata['tracker'] ? metadata['tracker'] : '<span id="font-bg-color">N/A</span>'}
    `

    if (debug > 2) {
      console.log('DEBUG: format_song_details =', format_current_song_info)
    }

    if (metadata['message'] && num_message > 0) {
      format_message = metadata['message'].replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />')
      document.getElementById('message').style.display = "block"
    }
    if (sample_names && num_samples > 0) {
      for (var i = 0; i < num_samples; i++) {
        format_samples += sample_names[i] ? `${leftPadNum(i + 1, 2)}: ${sample_names[i]}<br />` : `${leftPadNum(i + 1, 2)}: <br />`;
      }
      document.getElementById('samples').style.display = "block"
    }
    if (instrument_names && num_instruments > 0) {
      for (var i = 0; i < num_instruments; i++) {
        format_instruments += instrument_names[i] ? `${leftPadNum(i + 1, 2)}: ${instrument_names[i]}<br />` : `${leftPadNum(i + 1, 2)}: <br />`;
      }
      document.getElementById('instruments').style.display = "block"
    }
    document.getElementsByClassName('bg')[0].style.height = format_bg_style_height
    document.getElementById('position_range').max = format_position_max
    document.getElementById('total_order').innerHTML = `/${leftPadNum(num_orders, 2)}`
    document.getElementById('scroller').innerHTML = `<marquee>Now playing: ${format_filename} :: ${format_song_id} ${(modtitle) ? ' :: ' + modtitle : ''}</marquee>`
    document.getElementById('message_summary').innerHTML = `message (<span id="value-highlight">${num_message}</span>)`
    document.getElementById('samples_summary').innerHTML = `samples (<span id="value-highlight">${num_samples}</span>)`
    document.getElementById('instruments_summary').innerHTML = `instruments (<span id="value-highlight">${num_instruments}</span>)`
    document.getElementById('message_details').innerHTML = format_message
    document.getElementById('samples_details').innerHTML = format_samples
    document.getElementById('instruments_details').innerHTML = format_instruments
    document.getElementById('song_info').innerHTML = format_current_song_info
  }

  function getGain() {
    try {
      //gainNode.gain.value = sum_vol
      gainNode = {
        gain: {
          value: all_channels_vu_mono.reduceRight((acc, cur) => acc + cur, 0),
          minValue: 0,
          maxValue: 5,
        }
      }
      gainNode = player.context.gain
      //debug
      //document.getElementById('debug').innerHTML += sum_vol + ' ';
      //document.getElementById('debug').innerHTML =  all_channels_vu_mono.reduceRight((acc, cur) => acc + cur, 0)
      //console.log('DEBUG: player.context.createGain() =',  player.context.createGain()) ' player.context.destination =', player.context.destination, ' player.currentPlayingNode =', player.currentPlayingNode)

      //gainNode = player.context.createGain()
      //gainNode = player.context.gain
      //gainNode.connect(player.context.destination)

      //player.currentPlayingNode.gain.connect(player.context.destination)
      //console.log('DEBUG: gainNode =', gainNode.gain, ' player.gain =', player.gain)
      //console.log('DEBUG: gainNode =', gainNode, ' analyser =', analyser, ' player', player)
      document.getElementById('debug').innerHTML = player.getGain()
    } catch {
      console.error("gainNode")
    }
  }

  // TODO:
  //async function afterLoad(path, buffer) {
  //  await Promise.resolve(player.play(buffer));
  //  ...

  function afterLoad(path, buffer) {
    player.play(buffer)
    player.ctl_set_text('play.at_end', play_at_end)
    //player.context.resume();
    subsongs = player.get_num_subsongs()
    if (subsongs > 1) {
      let subsongs_total_duration = 0;
      for (let i = 0; i < subsongs; i++) {
        player.select_subsong(i);
        subsongs_total_duration += player.duration()
      }
      duration_seconds = numOrZero(subsongs_total_duration)
      player.select_subsong(-1);  // '-1' = all
    } else { 
      duration_seconds = numOrZero(player.duration())
    }
    metaData(path);
    setPlayButtonId();
    // XXX: enable meter for vu and visualizer (they use volMeterData.volume and volMeterData.buffer)
    // TODO: use init instead of startAudio
    if (enable_volume_meter) {
      initVolMeter(player).then(() => {
        startAudio(player.context, player);
        isPlaying = true;
        // vu.js (new)
        if (selectOptions().OPTIONS.show_vu) {
          initVU();
        }
        // visualizer.js
        if (selectOptions().OPTIONS.show_vu) {
          function waitBuffer() {
            if (!volMeterData.buffer) {
              setTimeout(() => { waitBuffer() }, 100)
              return
            }
            let visual = getVisualSetting()
            visualize(visual);
            document.getElementById("visual_name").innerHTML = visual ? `"${visual}"` : `"..."`;
          }
          waitBuffer()
        }
      });
    }

    // TODO: get volume

    //console.log('DEBUG: getGlobalVolume', player.getGlobalVolume());
    //console.log('DEBUG: setGlobalVolume', player.setGlobalVolume(0.1));
    //console.log('DEBUG: getGlobalVolume', player.getGlobalVolume());
    
    /*
    console.log('DEBUG: getInterfaceFunction get_global_volume', player.interfaceFunction('interactive', 'get_global_volume'))
    player.interfaceFunction('interactive', 'set_global_volume', 0.10)
    console.log('DEBUG: getInterfaceFunction get_global_volume', player.interfaceFunction('interactive', 'get_global_volume'))
    */

    //console.log('DEBUG: interactiveFunction', player.interactiveFunction.setCurrentSpeed)
    //console.log('DEBUG: getVolume', player.getVolume())

  }

  function loadURL(path) {
    let re = new RegExp ('[^/#?&]+\\.(?:' + valid_extentions + ')$', 'i')
    //let url = new URL(song[0])
    //let match = url.href.match(re)
    p = path
    if (typeof p === 'object') {
      p = path.name
    }
    if (!p.match(re)) {
      throw new Error(`Invalid module: ${p}`);
    }
    setElements();
    setModData();
    init();
    player.load(path, afterLoad.bind(this, path))
  }

  function playDefaultSong() {
    let index = 0
    if (!default_modurl) {
      if (selectOptions().OPTIONS.shuffle) {
        let max = document.querySelectorAll('.song').length
        index = Math.floor(Math.random() * (max - 0) ) + 0;
        if (document.querySelectorAll('.song')[index]) {
          default_modurl = document.querySelectorAll('.song') ? document.querySelectorAll('.song')[index].getAttribute("data-modurl") : null
        }
      }
    }
    console.log('DEBUG: default_modurl', default_modurl)
    modurl = (default_modurl) ? default_modurl : default_example_modurl;
    loadURL(modurl);
    //document.querySelectorAll(".song").forEach(e => e.style.color = 'black')
  }

  /* Buttons */

  function switchButtons() {
    let halt = false;
    ["play", "pause", "stop", "switch"].forEach(control => {
      //console.log('DEBUG: switchButtons control =', control);
      button = document.getElementById(control);
      if (button && !halt) {
        //console.log('DEBUG: button =', button);
        button.disabled = false;
        halt = true;
        if (button.id == "pause") {
          button.id = "switch";
          halt = false;
        }
        if (button.id == "play") {
          button.id = "pause";
          button.value = "|| Pause";
        }
        if (button.id == "switch") {
          button.id = "play";
          button.value = "> Play";
          property_value = false
          disableStopButton(property_value);
        }
        if (debug > 3) {
          console.log('DEBUG: button after =', button);
        }
      }
    })
  }

  function stopSong(set_position=False) {
    if (player) {
      if (set_position) {
        player.set_position_seconds(0)
      }
      player.currentPlayingNode.pause()
      setPlayButtonId();
      switchButtons();
      property_value = true
      disableStopButton(property_value);
      //document.getElementById('scroller').innerHTML = '<marquee style="color:var(--marquee-color);background-color:var(--marquee-bg-color);">Song stopped, press Play</marquee>'
    }
  }

  function nextSong() {
    const songlist = document.querySelectorAll(".song");
    for (let i = 0; i + 1 < songlist.length; i++) {
      //songlist[i].style.color = 'black'
      document.getElementById('prev').disabled = false
      if (i + 1 >= songlist.length - 1) {
        document.getElementById('next').disabled = true
      }
      if (songlist[i].getAttribute("data-modurl") === modurl) {
        //console.log('DEBUG: match current song =', modurl, i)
        song = document.querySelectorAll('.song')[i + 1]
        modurl = song.getAttribute("data-modurl")
        //modurl = document.querySelectorAll('.song')[i+1].getAttribute("data-modurl")
        console.log('DEBUG: next song =', modurl)
        loadURL(modurl)
        break
      }
    }
  }

  function prevSong() {
    const songlist = document.querySelectorAll(".song");
    for (let i = songlist.length - 1; i - 1 >= 0; i--) {
      //console.log('DEBUG: prev i =,', i)
      document.getElementById('next').disabled = false
      if (i - 1 <= 0) {
        document.getElementById('prev').disabled = true
      }
      if (songlist[i].getAttribute("data-modurl") === modurl) {
        //console.log('DEBUG: match current song =', modurl, i)
        song = document.querySelectorAll('.song')[i - 1]
        modurl = song.getAttribute("data-modurl")
        console.log('DEBUG: next song =', modurl)
        loadURL(modurl)
        break
      }
    }
  }

  function playPauseButton() {
    if (player) {
      //console.log('DEBUG: playPauseButton togglepause')
      player.togglePause()
    } else {
      //console.log('DEBUG: playPauseButton playDefaultSong')
      playDefaultSong()
      //property_value = false
      //disableStopButton(property_value)
    }
    switchButtons()
    property_value = false
    disableStopButton(property_value)
  }

  function setPauseButtonId() {
    var button = document.getElementById('pause')
    if (button) {
      button.id = "play"
    }
  }

  function setPlayButtonId() {
    var button = document.getElementById('play')
    if (button) {
      button.id = "pause"
    }
  }

  function stopButton() {
    let set_position = true
    stopSong(set_position)
  }
  
  function ejectButton() {
    let set_position = true
    stopSong(set_position)
    if (show_open_button) {
      document.getElementById('open').style.display = "block"
      document.getElementById('open').scrollIntoView()
    } else {
      document.getElementById('tracks').scrollIntoView()
    }
  }

  function nextButton() {
    nextSong()
  }

  function prevButton() {
    prevSong()
  }

  function disableStopButton(property_value) {
    button = document.getElementById("stop")
    if (button) {
      button.disabled = property_value
    }
  }

  document.querySelector('input[name=submiturl]').addEventListener('click', function () {
    var exturl = document.querySelector('input[name=exturl]');
    modurl = exturl.value;
    loadURL(modurl);
    exturl.value = null;
    let property_value = false
    disableStopButton(property_value)
  });

  document.querySelector('#prev').addEventListener('click', prevButton, false)
  document.querySelector('#play').addEventListener('click', playPauseButton, false)
  document.querySelector('#stop').addEventListener('click', stopButton, false)
  document.querySelector('#eject').addEventListener('click', ejectButton, false)
  document.querySelector('#next').addEventListener('click', nextButton, false)

  document.querySelector('#position_range').addEventListener('input', function (e) {
    player.set_position_seconds(parseFloat(e.target.value))
    document.getElementById('position_range').innerHTML = e.target.value.toString()
  }, false)

  document.querySelector('#tempo_range').addEventListener('input', function (e) {
    player.ctl_set_floatingpoint('play.tempo_factor', parseFloat(e.target.value))
    document.getElementById('tempo_factor').innerHTML = parseFloat(e.target.value).toFixed(2).toString()
  }, false)

  document.querySelector('#pitch_range').addEventListener('input', function (e) {
    player.ctl_set_floatingpoint('play.pitch_factor', parseFloat(e.target.value))
    document.getElementById('pitch_factor').innerHTML = parseFloat(e.target.value).toFixed(2).toString()
  }, false)

  document.querySelector('#volume_range').addEventListener('input', function (e) {
    player.setVolume(e.target.value)
    document.getElementById('volume_percent').innerHTML = `${roundNumDec(e.target.value, 0)}%`
  }, false)

  if (show_gain) {
    document.querySelector('#gain_range').addEventListener('input', function (e) {
      player.gain.value = e.target.value
      document.getElementById('gain_percent').innerHTML = `${roundNumDec(e.target.value * 100, 0)}%`
    }, false)
  }

  let sort_buttons = "";
  let i = 0
  let last = Object.keys(toggle_sort).length-1
  Object.keys(toggle_sort).forEach(k => {
    sort_buttons += `<button class="btn-txt" id="sort_${k}">${k}</button>${i<last ? '|' : ''}`;
    i++;
  });
  document.getElementById('action').innerHTML = sort_buttons
  Object.keys(toggle_sort).forEach(k =>
    document.querySelector(`#sort_${k}`).addEventListener('click', function () { sortSongs(k, toggle_sort[k]); })
  );

  document.addEventListener('keydown', (event) => {
    //console.log('DEBUG: keydown = ', event)
    if (event.defaultPrevented) {
      return;
    }
    switch (event.code) {
      case "KeyH":
        alert(
          "\n" +
          "Keyboard Shortcuts\n" +
          "------------------------\n\n" +
          "Play/pause: SPACEBAR\n" +
          "Stop: F8\n" +
          "Forward +10s: RIGHT ARROW KEY\n" +
          "Backward -10s: LEFT ARROW KEY\n" +
          "Mute: 'm'\n" +
          "Help: 'h'\n\n"
        )
        break;
      case "Space":
        event.preventDefault();
        playPauseButton();
        break;
      case "F8":
        stopButton();
        break;
      case "ArrowRight":
        player.set_position_seconds(parseFloat(player.getCurrentTime() + 10))
        break;
      case "ArrowLeft":
        player.set_position_seconds(parseFloat(player.getCurrentTime() - 10))
        break;
      case "KeyM":
        if (player) {
          let vol;
          if (mute) {
            mute = false
            vol = 75
          } else {
            mute = true
            vol = 0
          }
          player.setVolume(vol)
          document.getElementById('volume_range').value = vol;
          document.getElementById('volume_percent').innerHTML = `${leftPadNum(vol, 2)}%`
          // needs gain set in 'play' method
          if (show_gain) {
            vol = (player.gain.value > 0) ? 0 : 1;
            player.gain.value = vol;
            document.getElementById('gain_range').value = vol;
            document.getElementById('gain_percent').innerHTML = `${roundNumDec(vol * 100, 0)}%`;
          }
        }
        break;
      case "KeyN":
        nextButton()
        break;
      case "KeyP":
        prevButton()
        break;
      // TODO: dont reuse buttons already used by browser
      //disabled
      case "__disabled__Escape":
        menuButton();
        alert('Esc: menuButton')
        break;
      case "__disabled__F5":
        //event.stopPropagation()
        event.preventDefault();
        playPauseButton();
        break;
      case "__disabled__F11":
        event.preventDefault();
        message
        break;
    }
  });

  function getLibopenmptDetails() {
    let version
    ["library_version", "library_version_is_release", "library_features", "core_version"].forEach(key => {
      version += ChiptuneJsPlayer.prototype.get_string(key)
    })
    return version
  }

  if (use_drop_files) {
    fileaccess.ondrop = function (e) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
      setDefaults();
      setModData();
      init();
      player.load(file, afterLoad.bind(this, file.path));
    }

    fileaccess.ondragenter = function (e) { e.preventDefault(); }
    fileaccess.ondragover = function (e) { e.preventDefault(); }
  }

  document.querySelector('input[name=files]').addEventListener('change', function (evt) {
    modurl = null
    modtitle = null
    loadURL(evt.target.files[0]);
    let property_value = false
    disableStopButton(property_value)
  });

  function playlist() {
    function addListenerToSong(e) {
      e.addEventListener('click', function (e) {
        //loadURL(e.dataset.modurl);
        modurl = e.target.getAttribute("data-modurl")
        loadURL(modurl)
        switchButtons();
        let property_value = false
        disableStopButton(property_value)
        document.getElementById('next').disabled = false
        document.getElementById('prev').disabled = false
      }, false)
    }
    function xhrSuccess() { this.callback.apply(this, this.arguments); };
    function xhrError() { console.error(this.statusText); };
    function loadFile(url, callback) {
      const xhr = new XMLHttpRequest();
      xhr.callback = callback;
      xhr.arguments = Array.prototype.slice.call(arguments, 2);
      xhr.onload = xhrSuccess;
      xhr.onerror = xhrError;
      xhr.open("GET", url, true);
      xhr.responseType = "document";
      xhr.send(null);
    }
    let document_songs_defined = false;
    const url_params = new URLSearchParams(window.location.search);
    if (default_playlist) {
      if (document.querySelectorAll('#playlist .song').length > 0) {
        document_songs_defined = true;
        document.querySelectorAll('.song').forEach(song => {
          if (!song.getAttribute("data-modfile")) {
            song.setAttribute("data-modfile", decodeURI(song.dataset.modurl.split(/[/#?]/).pop()))
          }
          addListenerToSong(song);
        });
        document.getElementById('stats').innerHTML = `<strong>${document.querySelectorAll('#playlist .song').length}</strong> songs`
      } else {
        let tracksmsg = document.getElementById('tracksmsg').innerHTML
        document.getElementById('tracksmsg').innerHTML = "<p>No tracks found, loading playlists.html  ...</p>" + tracksmsg
      }
    } else {
      document.getElementById('playlist').innerHTML = ''
    }
    if ((!document_songs_defined || playlist_file != '') && (url_params.get('more'))) {
      document.getElementById('playlist').innerHTML = ''
      loadFile(playlist_file, function () {
        this.responseXML.querySelectorAll('.collection').forEach(pl => {
          if (pl.getAttribute('data-modplist')) {
            pl.querySelectorAll('.song').forEach(song => {
              if (!song.getAttribute("data-modfile")) {
                song.setAttribute("data-modfile", decodeURI(song.dataset.modurl.split(/[/#?]/).pop()))
              }
              addListenerToSong(song);
              pl.appendChild(song);
            });
          }
          document.getElementById('playlist').appendChild(pl);
          document.getElementById('stats').innerHTML = `Total:
            <strong>${document.querySelectorAll('#playlist .collection').length}</strong> playlists
            <strong>${document.querySelectorAll('#playlist .song').length}</strong> songs
          `
        });
      });
      document.getElementById('nav').innerHTML = '<p><a href="?" onclick="location.reload();">BACK</a></p>'
    } else {
      document.getElementById('nav').innerHTML = '<p><a href="?more=true" onclick="location.reload();">MORE</a></p>';
    };
  };
  playlist();

  function sortSongs(type, asc) {
    console.log(type,asc)
    attr = `mod${type}`
    function leftPadNum(num, len) {
      return num.toString().padStart(len, '0')
    }
    function compare_asc(a, b) {
      if (a.dataset[attr] < b.dataset[attr]) return -1;
      if (a.dataset[attr] > b.dataset[attr]) return 1;
      return 0;
    }
    function compare_desc(b, a) {
      if (a.dataset[attr] < b.dataset[attr]) return -1;
      if (a.dataset[attr] > b.dataset[attr]) return 1;
      return 0;
    }
    var data = document.querySelectorAll(`[data-${attr}]`);
    var dataArray = Array.from(data);
    document.querySelectorAll(".collection").forEach(e =>
      e.style.display = 'none'
    )
    if (attr === 'modsize') {
      dataArray.forEach(e => 
        e.setAttribute("data-modsize", leftPadNum(e.getAttribute("data-modsize"), 6))
      );
    } 
    let sorted = asc ? dataArray.sort(compare_asc) : dataArray.sort(compare_desc);
    sorted.forEach(e => {
      e.setAttribute("data-modsize", `${Number(e.getAttribute("data-modsize"))}`)
      document.querySelector("#playlist").appendChild(e)
    })
    toggle_sort[type] = !toggle_sort[type]
    document.getElementById('order').innerHTML = `${toggle_sort[type] ? 'asc' : 'desc'}`
  };

} // end libopenmpt.onRuntimeInitialized


window.onload = function () {
  console.log('window.onload')
  document.getElementById('stop').disabled = true
  document.getElementById('next').disabled = true
  document.getElementById('prev').disabled = true
  document.getElementById('gain').style.display = `${show_gain ? 'block' : 'none'}`
  document.getElementById("position_time").remove
  document.getElementById("position_time").innerHTML = "00:00"
  document.getElementById("position_percent").innerHTML = "(0%)"
  document.getElementById('volume_range').value = 75
  document.getElementById('volume_percent').innerHTML = "75%"
  document.getElementById('pattern_row_channel').style.height = `${pattern_max_rows}lh`;
  if (show_open_button) {
    document.getElementById('eject').value = "[+] Open"
  }
  if (debug > 1) {
    document.getElementById('debug').style = 'display:block; width:60%; margin-bottom:15px;';
    //document.getElementById('debug').style = 'background-color:whitesmoke';
    //document.getElementById('debug_buffer').style = 'background-color:whitesmoke;height:150px;word-wrap:break-word;overflow:scroll'
    //print_nav_timing_data()
  }
}
