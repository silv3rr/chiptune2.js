# WMPlay

Web Mod Player (wmplay.js) requires chip2une2.js, chiptune2a.js and libopenmpt.js (tested with 0.6.6 and 0.7.13)

View live [example here](https://0008086.xyz/chiptune2.js/)

See [chiptune2.js/README.md](https://github.com/deskjet/chiptune2.js/blob/master/README.md) for original README

## Settings

Set a theme from the drop down list of the top left:
   
- THEME:
   - "default": "default"
   - "impulse": "impulse-tracker"
   - "scream": "scream-tracker"
   - "fast": "fasttracker"
   - "cubic": "cubic-player"

- OPTIONS:
   - play_next: auto plays next song in playlist (default `off`)
   - show_vu: show vu meter (default `off`) *_⚠ performance issues_

### Configuration

Set inline:

- pattern_max_rows: `10` (default `10`)

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

## Playlist(s)

HTML5 data attributes are used to load module file and metadata, set inside an `article`.

Only `data-modurl` is required and can both be a local file or link to e.g. [modarchive](modarchive.org) or [modland](modland.com)

Add the articles with mod data to a "collection".

``` html
<div class="collection" data-modplist="">
   <article class="song" data-modurl="url/or/path/to/mymodule.it" data-modtitle="My Mod" data-modfile="mymodule.it" data-moddate="1999-12-31" data-modsize="100kb" href="#"></a>
   <article class="song" data-modurl="https://api.modarchive.org/downloads.php?moduleid=57925#space_debris.mod" data-modfile="" data-modtitle="Markus 'Captain' Kaarlonen - Space Debris" data-modtime="05:05" data-moddate="1991-03-29" data-modsize="39kb"></article>
   <article class="song" data-modurl="https://api.modarchive.org/downloads.php?moduleid=48407#MR_STRID.XM"      data-modfile="" data-modtitle="MickRip - Astrid" data-modtime="04:32" data-moddate="1996-03-31" data-modsize="812kb"></article>
   <article class="song" data-modurl="https://api.modarchive.org/downloads.php?moduleid=60395#2ND_PM.S3M"       data-modfile="" data-modtitle="Purple Motion/FC - Unreal 2" data-modtime="06:44" data-moddate="1993-10-09" data-modsize="587kb">/article>
</div>
```

To optionally name the playlist, set `data-modplist="My awesome mods"`. There can be multiple playlists.

Add the html to index.html inside `<div id="playlist">`, or to separate playlists.html file.

## Default song

If optional `default_modurl` is not set, the first file will be played.

``` html
   <script type="text/javascript">default_modurl = "https://api.modarchive.org/downloads.php?moduleid=57925#space_debris.mod";</script>
```

## Changes

For a list of changes compared to the original chiptune2, see [Changes](Changes.md)

For more web players, see [Alternatives.md](Alternatives.md) for a list.

