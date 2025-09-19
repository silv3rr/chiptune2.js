# Changes

Compared to chiptune2, the following was added:

- volume control
- seek bar
- live pattern viewer
- vu meter, visualizer
- view samples, instruments and message
- mod data
- settings for auto play next, shuffle, themes
- zip support

## chiptune2a.js

chiptune2**a**, a as in in add-on

Has a few additional libopenmpt functions defined, which are not in original chiptune2.js:

- `libopenmpt._openmpt_module_ctl_set_text()`
- `libopenmpt._openmpt_module_ctl_set_floatingpoint()`
- `libopenmpt._openmpt_module_ctl_get_floatingpoint()`
- `libopenmpt._openmpt_module_get_current_channel_vu_left()`
- `libopenmpt._openmpt_module_get_current_channel_vu_right()`
- `libopenmpt._openmpt_module_get_num_samples()`
- `libopenmpt._openmpt_module_get_num_instruments()`
- `libopenmpt._openmpt_module_get_num_channels()`
- `libopenmpt._openmpt_module_get_current_playing_channels()`
- `libopenmpt._openmpt_module_ext_get_interface()`

- `ChiptuneJsPlayer.prototype.setVolume`
- `ChiptuneJsPlayer.prototype.getVolume`

Override:

- `ChiptuneJsPlayer.prototype.load` (zip support)
