# WMPlay

Web Mod Player

View **[demo](https://0008086.xyz/chiptune2.js/)** at [https://0008086.xyz/chiptune2.js](https://0008086.xyz/chiptune2.js)

## JS

Source: wmplay.js, chiptune2a.js volume-meter.js, vu.js, visualizer.js

Forked from: [chiptune2.js](https://github.com/deskjet/chiptune2.js/)

Libs: [libopenmpt](https://lib.openmpt.org/libopenmpt/) ([build](https://github.com/silv3rr/docker-libopenmpt)) and [jszip](http://jszip.org)

It was tested with libopenmpt 0.6.6 (js), 0.7.13 and 0.8.3 (wasm)

## Settings

Set a theme from the drop down list of the top left
   
- THEME:
   - "default": "default"
   - "impulse": "impulse-tracker"
   - "scream": "scream-tracker"
   - "fast": "fasttracker"
   - "cubic": "cubic-player"

- OPTIONS:
   - shuffle: play random song (default `on`)
   - play_next: auto plays next song in playlist (default `on`)
   - show_vu: show vu meter (default `on`)
   - show_visualizer show visualization (default `on`: random)

### Configuration

Change in wmplay.js

- pattern_max_rows: `12` (default `12`)

- show_open_button: `true|false` (default `true`)
    - `true` shows file open button to load local files
    - `false` hides button

- repeat: *libopenmpt._openmpt_module_get_repeat_count* 
   - `-1` repeat forever
   - `0` play once, repeat zero times (the default)
   - `n>0` play once and repeat n times after that

-  delay: *libopenmpt._openmpt_module_ctl_set_text*
    - `50` (default)
   - try 100ms or higher for slower hardware

- play_at_end: *libopenmpt._openmpt_module_ctl_set_text*
   - "`fadeout`" Fades the module out for a short while. Subsequent reads after the fadeout will return 0 rendered frames.
   - "`continue`" Returns 0 rendered frames when the song end is reached. Subsequent reads will continue playing from the loop start
      (if the song is not programmed to loop, playback resumed from the song start).
   - "`stop`" Returns 0 rendered frames when the song end is reached. Subsequent reads will return 0 rendered frames. (default)

- visualSetting
   - `"random"`: select random visual (default)
   - `'sinewave'`, `'line'`, `'frequencybars'` or `'invertedbars'`
   - `"off"`

## Playlist(s)

HTML5 data attributes are used to load module file and metadata, set inside an `article`.

Only `data-modurl` is required and can both be a local file or link to e.g. [modarchive](https://modarchive.org) or [modland](https://modland.com)

- Use mm:ss for `modtime` and `modsize` is in kilobytes
- Optionally set `modfile` to filename, else it's extracted from `modurl`

Add the articles with mod data to a "collection".

To optionally name the playlist, set `data-modplist="My awesome mods"`. There can be multiple playlists.

Add the html to index.html, or to separate playlists.html file.

If optional `default_modurl` js var is not set, the first or random song will be played, depending on settings.

See [Playlist.md](docs/Playlist.md) and example [playlists.html](playlists.html)

## Included songs

There are 4 example songs included (index.html).

Click on "MORE" at the bottom of Tracks to listen to an additional collection of tracked music in different stytles (playlists.html).

It includes a selection of about 50 well known modules, classics and personal favorites. Most of them were created for PC demos and games and a few on [Amiga](https://en.wikipedia.org/wiki/Amiga), between 1990-2000. Formats include [ProTracker](https://en.wikipedia.org/wiki/Protracker) (mod), [Scream Tracker 3](https://en.wikipedia.org/wiki/Scream_Tracker) (s3m), [FastTracker 2](https://en.wikipedia.org/wiki/FastTracker_2) (xm) and [Impulse Tracker](https://en.wikipedia.org/wiki/Impulse_Tracker) (it).

Sources: [modarchive](https://modarchive.org), [modland](https://modland.com) and [demozoo](https://demozoo.org)

## Changes

For a list of changes compared to the original chiptune2, see [Changes](docs/Changes.md)

For more web players, see [Alternatives.md](docs/Alternatives.md) for a list.

