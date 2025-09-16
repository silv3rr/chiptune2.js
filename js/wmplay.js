/*
 * WMPlay - Web Mod Player
 * Needs: libopenmpt.js chiptune2.js and chiptune2a.js
 */

/* OPTIONS */

const delay = 50
const repeat = 0
const play_at_end = "stop"
const pattern_max_rows = 10
const default_playlist = true
const playlist_file = 'playlists.html'
const valid_extentions = 'it|dmf|mod|mtm|s3m|xm|zip'

const show_libopenmpt = 'bottom'  // bottom|marquee
const show_notifications = true
const show_open_button = true
const show_gain = false
const show_old_vu = false
const visualSetting = "off"  // off|sinewave|line|frequencybars|bars(WIP)

const old_lib_version = false
const use_gain_node = false
const use_libopenmpt_volume = false

var debug = 2
var mute = false
var enable_volume_meter = false

var shuffle = true
var play_next = true
var show_vu

var toggle_sort = { file: true, title: true, date: true, time: true, size: true }
var volMeterData = { volume: 0, buffer: 0, clipping: false }


window['libopenmpt'] = {}

libopenmpt.locateFile = function (filename) {
  if (filename.endsWith(".mem") || filename.endsWith(".wasm")) return location.protocol + '//' + location.host + location.pathname + 'js/' + filename;
  return location.protocol + '//' + location.host + location.pathname + filename
}


libopenmpt.onRuntimeInitialized = function () {
  var fileaccess = document.querySelector('*');
  var file
  var intervalID
  var player
  var format_position_time
  var format_tempo_factor
  var format_pitch_factor
  var format_row
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

  console.log('DEBUG: libopenmpt.onRuntimeInitialized')

  function init() {
    console.log('DEBUG: init')
    //let roperty_value = false
    //disableStopButton(property_value)
    button = document.getElementById("stop")
    if (button) {
      button.disabled = false
    }
    //setPauseButtonId()

    //TODO: msg processor
    //volMeter.port.postMessage("test123");
    //volumeMeterNode.port.postMessage("node test123");
    //console.log('DEBUG: vu =', volumeMeterNode)

    if (player == undefined) {
      if (debug > 2) {
        console.log('DEBUG: init -- player undefined')
      }

      player = new ChiptuneJsPlayer(new ChiptuneJsConfig(repeat));

      player.onEnded(() => { endSong(); })

      function lateInit() {
        if (player) {
          if (!player.processNode) {
            setTimeout(() => { lateInit() }, 100)
            return
          }
          // attempt to reconnect (old) meter and analyser after 100ms 
          if (show_old_vu) {
            player.currentPlayingNode.connect(meter)  
          }
          //analyser.connect(player.currentPlayingNode.context.destination)
          //player.currentPlayingNode.connect(analyser)
        }
      }
      lateInit()

      if (debug > 2) {
        console.log('DEBUG: player =', player, ' player config =', player.config, ' player context =', player.context)
        console.log('DEBUG: player currentPlayingNode =', player.currentPlayingNode)
      }

      // make sure we clear patterns (array of rows) of last song
      format_pattern_row_all_channels = []

      intervalID = setInterval(function () {
        // check if song is actually playing
        if (player.currentPlayingNode && (player.currentPlayingNode.modulePtr && player.currentPlayingNode.modulePtr > 0)) {
          getSongData()
          showSongData()

          // TODO:
          //console.log('DEBUG: getVolume', player.getVolume());

          // test meter vol peaks >10,20,30,40
          if (debug > 4) {
            roundvol = roundNumDec(volMeterData.volume * 100, 0);
            [10, 20, 30, 40].forEach(pct =>(roundvol > pct) && console.log(`DEBUG: round volume >${pct}`, volMeterData.volume, roundvol))
          }
          if (debug > 3) {
            console.log('DEBUG: volumeMeterNode =', volumeMeterNode, ' volMeterData.volume =', volMeterData.volume)
          }

          // TODO: move to load
          // vu.js (new)
          //if (show_vu) {
          //  initVU();
          //}

          // visualizer.js
          if (visualSetting !== 'off') {
            visualize(visualSetting);
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
        }
      }, delay)  // end setInterval
    } else {
      player.stop();
      setPauseButtonId();
    }
  } // end init()


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

  function setModData() {
    document.querySelectorAll(".song").forEach(e => {
      if (e.getAttribute("data-modurl") === modurl) {
        modtitle = e.getAttribute("data-modtitle")
        modtime = e.getAttribute("data-modtime")
        modfile = e.getAttribute("data-modfile")
        moddate = e.getAttribute("data-moddate")
        modsize = e.getAttribute("data-modsize")
        if (debug > 1) {
          console.log(`DEBUG: setModData modurl=${modurl} moddata modtitle=${modtitle} modtime=${modtime} modfile=${modfile} moddate=${moddate} modsize=${modsize}`)
        }
        e.style.color = 'var(--song-playing-color)'
      } else {
        e.style.color = 'inherit'
      }
    })
  }

  function setDefaults() {
    if (old_lib_version && show_notifications) {
      document.getElementById('notification').innerHTML = "⚠ NOTE: does not play 100% correctly, IT resonance filters are missing"
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
    //document.getElementById('tempo_factor').innerHTML = "1.00"
    //document.getElementById('pitch_factor').innerHTML = "1.00"
    //document.getElementById('volume_percent').innerHTML = "100%"
    document.getElementById('position_range').min = 0
    document.getElementById('position_range').max = 0
    document.getElementById('info').style.display = "block"
    document.getElementById('pattern').style.display = "block"
    document.getElementById('comments').style.display = "block"
    document.getElementById('message').style.display = "none"
    document.getElementById('samples').style.display = "none"
    document.getElementById('instruments').style.display = "none"
    document.getElementById('channel_vu_meters').innerHTML = ""
    document.getElementById('channels').innerHTML = ""
    document.getElementById('pattern_row_channel').innerHTML = ""
    document.getElementById('pattern_row_channel').style.width = "100%"
    /* Example:
    default_channels = "<span id='channels'>&nbsp;&nbsp;&nbsp; channel 01: &nbsp;  |  channel 02: &nbsp;  |  channel 03: &nbsp;  |  channel 04: &nbsp; </span>"
    default_pattern_row_channel = `
      <span id="pattern_row_channel">
        01: ... .. .. ... | ... .. .. ... | ... .. .. ... | ... .. .. ...
        02: ... .. .. ... | ... .. .. ... | ... .. .. ... | ... .. .. ...
        03: ... .. .. ... | ... .. .. ... | ... .. .. ... | ... .. .. ...
        04: ... .. .. ... | ... .. .. ... | ... .. .. ... | ... .. .. ...
        05: ... .. .. ... | ... .. .. ... | ... .. .. ... | ... .. .. ...
        06: ... .. .. ... | ... .. .. ... | ... .. .. ... | ... .. .. ...
        07: ... .. .. ... | ... .. .. ... | ... .. .. ... | ... .. .. ...
        08: ... .. .. ... | ... .. .. ... | ... .. .. ... | ... .. .. ...
        09: ... .. .. ... | ... .. .. ... | ... .. .. ... | ... .. .. ...
        10: ... .. .. ... | ... .. .. ... | ... .. .. ... | ... .. .. ...
      </span>`
    */
    document.getElementById('next').disabled = false
    document.getElementById('prev').disabled = false
    document.getElementById('open').style.display = "none"
    document.querySelectorAll('#pitch,#tempo').forEach(e => e.value = 1);
    if (show_vu) {
      document.getElementById('vu').style.display = 'block'
      document.getElementById('vu_title').innerHTML = "<h2 style='margin-bottom:0px'>VU Meter</h2>";
      // mono
      document.getElementById('vu-right').style.display = 'none';
      document.getElementById('vu-left').innerHTML = `${'<div></div>'.repeat(10)}`
      document.getElementById('vu-right').style.display = 'none';
    }
    if (visualSetting !== "off") {
      //document.querySelector(".visualizer").style.backgroundColor = 'lightgray';
      //document.getElementById('visualizer').style.width = '55%';
      document.getElementById('visualizer').style.backgroundColor = 'white';
      document.getElementById('visualizer').style.display = 'block';
      document.getElementById('visualizer_title').innerHTML = "<h2 style='margin-bottom:0px'>Visualizer</h2>";
      document.getElementById('canvas').style.backgroundColor = 'white';
    }
    if (debug > 3) {
      document.getElementById('debug').innerHTML = `
        <div id="debug_volume">${volMeterData.volume}</div>
        <div id="debug_buffer">${volMeterData.buffer}</div>`
      document.getElementById('debug').style = 'background-color:whitesmoke';
      document.getElementById('debug_buffer').style = 'background-color:whitesmoke;height:150px;word-wrap:break-word;overflow:scroll'
    }    
  }

  function getSongData() {
    //let duration_seconds = numOrZero(player.duration())
    position_seconds = numOrZero(player.getCurrentTime())
    position_percent = Math.floor((position_seconds / duration_seconds) * 100)
    let remaining_seconds = duration_seconds - position_seconds
    let format_remaining_min = leftPadNum(Math.floor(remaining_seconds / 60), 2)
    let format_remaining_sec = leftPadNum(Math.floor(remaining_seconds % 60), 2)
    let format_position_mm_ss = `${format_remaining_min}:${format_remaining_sec}`
    let format_pattern_row_channel = []
    let format_get_current_channel_vu_mono = []
    let format_last_row = format_row
    //let left = ''
    //let right = ''
    //let mono = ''
    format_position_time = format_position_mm_ss ? format_position_mm_ss : '00:00'
    format_tempo_factor = roundNumDec(player.module_ctl_get_floatingpoint('play.tempo_factor'), 2)
    format_pitch_factor = roundNumDec(player.module_ctl_get_floatingpoint('play.pitch_factor'), 2)
    format_row = leftPadNum(numOrZero(player.getCurrentRow() + 1), 2)
    format_order = leftPadNum(numOrZero(player.getCurrentOrder()), 2)
    format_pattern = leftPadNum(numOrZero(player.getCurrentPattern()), 2)
    format_bpm = roundNumDec(numOrZero(player.getCurrentBPM()), 0)
    current_channels = leftPadNum(numOrZero(player.getCurrentChannels()), 2)
    current_speed = leftPadNum(numOrZero(player.getCurrentSpeed()), 2)
    current_tempo = leftPadNum(numOrZero(player.getCurrentTempo()), 3)
    format_channels = ''

    // stereo vu
    //left += `<strong>${i}:</strong> ${player.module_get_current_channel_vu_left(i)} `     
    //right += `<strong>${i}:</strong> ${player.module_get_current_channel_vu_right(i)} `
    //document.getElementById('current_channel_vu_left').innerHTML = left
    //document.getElementById('current_channel_vu_right').innerHTML = right   
    //console.log(`DEBUG: player.module_get_current_channel_vu_left ${i} = ${player.module_get_current_channel_vu_left(i)}`)

    // mono
    //document.getElementById('current_channel_vu_mono').innerHTML = mono
    //mono += `<strong>${i}:</strong> ${player.module_get_current_channel_vu_mono(i)} `

    for (let i = 0; i < player.getChannels(); i++) {
      format_channels += `${(i === 0 ? '\u00A0'.repeat(6) : '\u00A0')} <span id="channel">channel ${leftPadNum(i + 1, 2)}: ${(i < player.getChannels() - 1 ? ' | ' : '')}</span>`
      format_pattern_row_channel[i] = player.formatPatternRowChannel(player.currentPlayingNode.modulePtr, player.getCurrentPattern(), player.getCurrentRow(), i)
      format_get_current_channel_vu_mono[i] = roundNumDec(numOrZero(player.module_get_current_channel_vu_mono(i)), 2)
    }
    if (format_row !== format_last_row) {
      format_pattern_row_all_channels.push(`${leftPadNum(format_row, 3)}: ${format_pattern_row_channel.join(' | ')}`)
    }
    let row_max = 180
    let row_len = `${format_row}: ${format_pattern_row_channel.join(' | ')}`.length
    if (row_len >= row_max) {
      //console.log(`DEBUG: format_pattern_row_all_channels ${row_len} >=${row_max} set width to max-content`)
      document.getElementById('pattern_row_channel').style.width = "max-content"
    } else {
      //console.log(`DEBUG: format_pattern_row_channels ${row_len} smaller than ${row_max}, set width width to 100%`)
      document.getElementById('pattern_row_channel').style.width = "100%"
    }
    all_channels_vu_mono = format_get_current_channel_vu_mono
    //console.log('DEBUG: all_channels_vu_mono =', all_channels_vu_mono)
  }

  function showSongData() {
    //format_pattern_row_all_channels.forEach(row => { .. })
    //document.getElementById('time').innerHTML = `time: <strong>${format_position_mm_ss}</strong><br>`;
    //document.getElementById('progress').innerHTML = `<p><progress value="${position_seconds}" max="${duration_seconds}"></progress> &nbsp; (${position_percent}&#37;)</p>`;
    //document.getElementById('current_row').innerHTML = `row: ${format_row}`
    document.getElementById('current_channels').innerHTML = `channels: ${current_channels}`
    document.getElementById('current_bpm').innerHTML = `bpm: ${format_bpm}`
    document.getElementById("position_range").value = roundNumDec(position_seconds, 0)
    document.getElementById("position_time").innerHTML = `-${format_position_time}`
    document.getElementById("position_percent").innerHTML = `(${position_percent}%)`
    document.getElementById('pitch_factor').innerHTML = format_pitch_factor
    document.getElementById('tempo_factor').innerHTML = format_tempo_factor
    document.getElementById('current_order').innerHTML = `order: <span id='value-highlight'>${format_order}</span>`
    document.getElementById('current_pattern').innerHTML = `pattern: ${format_pattern}`
    document.getElementById('current_speed').innerHTML = `speed: ${current_speed}`
    document.getElementById('current_tempo').innerHTML = `tempo: ${current_tempo}`
    document.getElementById('pattern').style.height = `${7 + pattern_max_rows}lh`
    let pattern_length = format_pattern_row_all_channels.length
    let format_pattern_result = ''

    // TODO: draw highlight bar every 5 rows
    /*
    if (i % 5 == 0) {
      format_pattern_result += `<span style="color:white;background-color:#414141;"><strong>${format_pattern_row_all_channels[i] ? format_pattern_row_all_channels[i] + '&nbsp;\n' : ''}</strong></span>`
    } else {
      format_pattern_result += format_pattern_row_all_channels[i] ? format_pattern_row_all_channels[i] + '&nbsp;\n' : ''
    }
    */

    for (let i = pattern_length - pattern_max_rows; i < pattern_length; i++) {
      format_pattern_result += format_pattern_row_all_channels[i] ? format_pattern_row_all_channels[i] + ' \n' : ''
    }
    document.getElementById('channels').innerHTML = format_channels
    document.getElementById('pattern_row_channel').innerHTML = format_pattern_result

    for (let i = 0; i < all_channels_vu_mono.length; i++) {
      if (document.getElementById('meter_' + i)) {
        document.getElementById('meter_' + i).setAttribute('value', all_channels_vu_mono[i])
      } else {
        document.getElementById('channel_vu_meters').innerHTML += `${(i === 0 ? '\u00A0'.repeat(4) : '')} <meter id="meter_${i}" value="0" min="0" max="1" low="0.4" high="0.7" optimum="0.1"></meter>`
      }
    }
    //format_all_channels_vu_mono = []
  }

  // unused
  function songPos() {
    if (position_seconds > duration_seconds || format_remaining_sec <= 0 || position_percent >= 100) {
      duration_seconds = player.duration()
      position_seconds = player.getCurrentTime()  
      position_percent = 100
    }
  }

  function endSong() {
    let set_position = true
    stopSong(set_position)
    console.log('DEBUG: clear intervalID = ', intervalID)
    player = undefined
    //meter = undefined
    clearInterval(intervalID)
    document.getElementById('song_info').innerHTML = ''
    document.getElementById('scroller').innerHTML = '<marquee style="color:var(--marquee-color);background-color:var(--marquee-bg-color);">No module loaded, click on a filename in Track below or press Eject</marquee>'
    document.getElementById("position_time").innerHTML = `00:00`
    document.getElementById("position_percent").innerHTML = "100%"
    document.getElementById('position_range').disabled = true
    document.getElementById('tempo_range').disabled = true
    document.getElementById('pitch_range').disabled = true
    document.getElementById('pattern').style.display = 'none'
    document.getElementById('comments').style.display = 'none'
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
    if (play_next) {
      if (shuffle) {
        let max = document.querySelectorAll('.song').length
        index = Math.floor(Math.random() * (max - 0) ) + 0;
        modurl = document.querySelectorAll('.song') ? document.querySelectorAll('.song')[index].getAttribute("data-modurl") : null
        loadURL(modurl)
      } else {
        nextSong();
      }
    }
  }

  function metadata(filename) {
    let format_song_id = ''
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
    let format_filename = ''
    let format_location = ''
    let size = 0
    let date = ''

    // format filename and size from filepicker, or use filename(path)
    if (typeof filename === 'object') {
      try {
        metadata['filename'] = filename.name
        metadata['date'] = new Date(filename.lastModified).toISOString()
        format_filename = filename.name.split('/').reverse()[0]
        format_location = filename.webkitRelativePath ? filename.webkitRelativePath : 'local'
        size = `${roundNumDec(filename.size / 1024, 0)}kb`
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

    format_filename = format_filename ? format_filename.split(/[/#?]/).pop() : 'N/A'
    format_song_id = metadata['filename'] ? metadata['filename'] : format_filename
    format_location = format_location ? format_location : '<span id="font-bg-color">N/A</span>'

    if (metadata['song_title'] && metadata['artist']) {
      format_song_id = `${metadata['title']} - ${metadata['artist']}`
    } else if (metadata['title']) {
      format_song_id = metadata['title']
    } else if (modtitle) {
      format_song_id = modtitle
    }

    if (debug > 0) {
      console.log(`DEBUG: metadata filename=${filename}\n\nmodsize=${modsize} moddate=${moddate} format_filename=${format_filename}`)
      //console.log('DEBUG: metadata = ', metadata);
      //console.log('DEBUG: format_bg_style_height = ', format_bg_style_height);
    }

    let format_info =
      `songid: <span id='value'>${format_song_id ? format_song_id : '<span id="font-bg-color">N/A</span>'}</span>
       filename: ${modurl ? '<a href="${modurl}">' + format_filename + '</a>' : format_filename}
       location: ${format_location}
       size: ${size ? size : '<span id="font-bg-color">N/A</span>'}
       duration: ${format_duration_time}
       patterns: ${format_num_patterns}
       channels: ${leftPadNum(channels, 2)}
       type: ${metadata['type_long'] ? metadata['type_long'] : '<span id="font-bg-color">N/A</span>'}
       tracker: ${metadata['tracker'] ? metadata['tracker'] : '<span id="font-bg-color">N/A</span>'}
       date: ${(date !== '' && date !== null) ? date : '<span id="font-bg-color">N/A</span>'}`

    if (debug > 2) {
      console.log('DEBUG: format_info =', format_info)
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
    document.getElementById('song_info').innerHTML = format_info
  }

  function afterLoad(path, buffer) {
    player.play(buffer);
    player.module_ctl_set_text('play.at_end', play_at_end)
    duration_seconds = numOrZero(player.duration())
    metadata(path);
    setPlayButtonId();
    //if volume meter is enabled, we can use volMeterData.volume volMeterData.buffer
    if (enable_volume_meter) {
     
      initVolMeter(player).then(() => {
        //TODO: use init instead of startAudio
        startAudio(player.context, player);
        isPlaying = true;

        // TODO: vu/visualizer: after 1 song, next song has slower & slower perf...
        //       no visualizers -- only enable_volume_meter + volMeter (volMeterData) is OK
        //       added buf check to processor

        // vu.js (new)
        if (show_vu) {
          initVU();
        }
      })

      // connect to old/orig volumemeter script (using scriptProcessorNode)
      if (show_old_vu) {
        if (!meter) {
          meter = createAudioMeter(player.context);
          initVU(player)
        }
        if (meter.numberOfInputs != 1 || meter.numberOfOutput != 1) {
          player.currentPlayingNode.connect(meter)
        }
        if (debug > 2) {
          if (meter.buf) {
            for (var i=0; i<meter.buf.length; i++) {
              document.getElementById('debug').innerHTML = meter.buf[i]
            }
          }
          //console.log('DEBUG: meter.volume',  meter.volume)
          //let sum_vol = roundNumDec((meter.volume * 100)*2*2, 0);
        }
      }
      if (show_libopenmpt === 'marquee') {
        let scroller = document.getElementById("scroller").innerHTML
        document.getElementById("scroller").innerHTML = scroller.replace('</marquee>', ` (${libopenmptInfo(false)}) </marquee>`)
      }
      if (show_libopenmpt === 'bottom') {
        document.getElementById("bottom").innerHTML = libopenmptInfo(false)
      }
    }

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
    setDefaults();
    setModData();
    init();
    player.load(path, afterLoad.bind(this, path))
  }

  function playDefaultSong() {
    let index = 0
    if (!default_modurl) {
      if (shuffle) {
        let max = document.querySelectorAll('.song').length
        index = Math.floor(Math.random() * (max - 0) ) + 0;
      }
      default_modurl = document.querySelectorAll('.song') ? document.querySelectorAll('.song')[index].getAttribute("data-modurl") : null
    }
    console.log('DEBUG: default_modurl', default_modurl)
    modurl = (default_modurl) ? default_modurl : default_example_modurl;
    loadURL(modurl);
    //document.querySelectorAll(".song").forEach(e => e.style.color = 'black')
  }

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
        player.module_set_position_seconds(0)
      }
      player.currentPlayingNode.pause()
      setPlayButtonId();
      switchButtons();
      property_value = true
      disableStopButton(property_value);
    }
  }
  
  // Buttons

  function nextSong() {
    // nodelist ? nodelist[0].getAttribute("data-modurl") : null
    // console.log('DEBUG: next', document.querySelectorAll(`.song[data-modurl='${modurl}']`))
    // i = 0
    // nodelist.forEach(e =>
    //  if (e.getAttribute("data-modurl") === modurl) break
    //  i++
    // )
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
      //console.log('DEBUG: playPauseButton else')
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
    endSong()
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
    player.module_set_position_seconds(parseFloat(e.target.value))
    document.getElementById('position_range').innerHTML = e.target.value.toString()
  }, false)

  document.querySelector('#pitch_range').addEventListener('input', function (e) {
    player.module_ctl_set_floatingpoint('play.pitch_factor', parseFloat(e.target.value))
    document.getElementById('pitch_factor').innerHTML = e.target.value.toString()
  }, false)

  document.querySelector('#tempo_range').addEventListener('input', function (e) {
    if (player) {
      player.module_ctl_set_floatingpoint('play.tempo_factor', parseFloat(e.target.value))
      document.getElementById('tempo_factor').innerHTML = e.target.value.toString()
    }
  }, false)

  document.querySelector('#volume_range').addEventListener('input', function (e) {
    if (player) {
      player.setVolume(e.target.value)
      document.getElementById('volume_percent').innerHTML = `${roundNumDec(e.target.value, 0)}%`
    }
  }, false)

  if (show_gain) {
    document.querySelector('#gain_range').addEventListener('input', function (e) {
      if (player) {
        player.gain.value = e.target.value
        document.getElementById('gain_percent').innerHTML = `${roundNumDec(e.target.value * 100, 0)}%`
      }
    }, false)
  }

  let sort_buttons = "";
  let i = 0
  let last = Object.keys(toggle_sort).length-1
  Object.keys(toggle_sort).forEach(k => {
    sort_buttons += `<button class="btn-txt" id="sort_${k}">${k}</button>${i<last ? '|' : ''}`;
    i++;
  });
  document.getElementById('sort_buttons').innerHTML = sort_buttons
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
          "Play/pause: <spacebar>\n" +
          "Stop: <F8>\n" +
          "Forward: <right arrow>\n" +
          "Backward: <left arrow>\n" +
          "Mute: <m>\n" +
          "Help: <h>\n"
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
        player.module_set_position_seconds(parseFloat(player.getCurrentTime() + 10))
        break;
      case "ArrowLeft":
        player.module_set_position_seconds(parseFloat(player.getCurrentTime() - 10))
        break;
      case "KeyM":
        if (player) {
          let vol;
          // libopenmpt volume
          if (mute) {
            mute = false
            vol = 75
          } else {
            mute = true
            vol = 0
          }
          player.setVolume(vol)
          document.getElementById('volume_range').value = vol;
          document.getElementById('volume_percent').innerHTML = `${vol}%`
          // gain, needs gain set in 'play' method
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
      //case "Escape":
      //  menuButton();
      //  alert('Esc: menuButton')
      //  break;
      //case "F5":
      //  //event.stopPropagation()
      //  event.preventDefault();
      //  playPauseButton();
      //  break;
      //case "F11":
      //  event.preventDefault();
      //  message
      //  break;
    }
  });

  function libopenmptInfo(details) {
    let info = '';
    if (details) {
      ["library_version", "library_version_is_release", "library_features", "core_version"].forEach(key => {
        info += ChiptuneJsPlayer.prototype.get_string(key)
      })
    } else {
      info = ChiptuneJsPlayer.prototype.get_string("core_version")
    }
    return info
  }

  // disable dropping files
  /*
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
  */

  document.querySelector('input[name=files]').addEventListener('change', function (evt) {
    modurl = null
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
          song.setAttribute("data-modfile", song.dataset.modurl.split(/[/#?]/).pop())
          addListenerToSong(song);
        });
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
              song.setAttribute("data-modfile", song.dataset.modurl.split(/[/#?]/).pop())
              addListenerToSong(song);
              pl.appendChild(song);
            });
          }
          document.getElementById('playlist').appendChild(pl);
        });
      });
      document.getElementById('pl_links').innerHTML = '<p><a href="?" onclick="location.reload();">BACK</a></p>'
    } else {
      document.getElementById('pl_links').innerHTML = '<p><a href="?more=true" onclick="location.reload();">MORE</a></p>';
    }
  }
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
    document.getElementById('sort_order').innerHTML = `${toggle_sort[type] ? 'asc' : 'desc'}`
  };

} // end libopenmpt.onRuntimeInitialized


window.onload = function () {
  console.log('DEBUG: onload')
  document.getElementById('stop').disabled = true
  document.getElementById('next').disabled = true
  document.getElementById('prev').disabled = true
  document.getElementById('gain').style.display = `${show_gain ? 'block' : 'none'}`
  document.getElementById("position_time").remove
  document.getElementById("position_time").innerHTML = "00:00"
  document.getElementById("position_percent").innerHTML = "(0%)"
  document.getElementById('pattern_row_channel').style.height = `${pattern_max_rows}lh`;
  document.getElementById('volume_range').value = 75
  document.getElementById('volume_percent').innerHTML = "75%"
  document.getElementById('tempo_factor').innerHTML = "1"
  document.getElementById('pitch_factor').innerHTML = "1"
  if (show_notifications && visualSetting !== 'off')   {
    document.getElementById('notification').innerHTML = "⚠ NOTE: performance sucks with visualizer enabled ;("
  }
  if (show_open_button) {
    document.getElementById('eject').value = "[+] Open"
  }
  if (debug > 1) {
    document.getElementById('debug').style = 'display:block;width:60%;margin-bottom:15px;';
    //document.getElementById('debug').style = 'background-color:whitesmoke';
    //document.getElementById('debug_buffer').style = 'background-color:whitesmoke;height:150px;word-wrap:break-word;overflow:scroll'
    //print_nav_timing_data()
  }
}
