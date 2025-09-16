// settings dropdown

const select_options = {
  THEME: {
    "default": "default",
    "impulse": "impulse-tracker",
    "scream": "scream-tracker",
    "fast": "fasttracker",
    "cubic": "cubic-player"
  },
  OPTIONS: {
    "shuffle": shuffle,
    "play_next": play_next,
    "show_vu": show_vu,
    "show_visualizer": show_visualizer,
  },  
  CONFIG: {
    "repeat": repeat,
    "pattern_max_rows": pattern_max_rows,
    "visualSetting": visualSetting,
  }
}

var optionSelector

function setOptions() {
  let options = '<select name="settings" id="options-selector">'
  let label
  let checked = false
  let disabled = false
  options += '<option value="" selected>Settings..</option>'
  for (const key of Object.keys(select_options)) {
    options += `<optgroup label="${key}">`
    for (const [k, v] of Object.entries(select_options[key])) {
      switch(key) {
        case "THEME":
          label = k;
          checked = (v==document.documentElement.getAttribute('data-theme')) ? true : false;
          break;
        case "OPTIONS":
          label = `${k}: ${(v ? 'on' : 'off')}`;
          checked = v;
          break;
        case "CONFIG":
          disabled = true
        default:
          label=`${k}: '${v}'`;
          checked = false
      }
      options += `<option value="${v}" label="${(checked ? '✔' : '')} ${label}" ${(disabled ? 'disabled' : '')}/>`
    }
    options += '</optgroup>'
  }
  options += '</select>'
  document.getElementById("settings").innerHTML = options;
  optionSelector = document.getElementById('options-selector');
  optionSelector.addEventListener('change', switchOptions, false);
}

function switchOptions(e) {
    // optgroup = document.querySelector('#settings option:checked').parentElement.label
    // value = e.target[e.target.options.selectedIndex].value;
    //if (Object.values(Object.values(select_options['theme'])).includes(value)) {
    selected = e.target[e.target.options.selectedIndex];
    //console.log('DEBUG: label =', selected.label, ', selected.value =', selected.value, ' parent label = ', selected.parentElement.label)
    if (selected.parentElement.label == 'THEME') {
      document.documentElement.setAttribute('data-theme', selected.value);
      localStorage.setItem('theme', selected.value);
    }
    for (const [k, v] of Object.entries(select_options.OPTIONS)) {
      if (selected.label.includes(`${k}:`)) {
        //console.log('DEBUG before key, value = ', k, typeof(k),  v)
        toggle = !v
        localStorage.setItem(k, toggle);
        select_options.OPTIONS[k] = toggle
        //console.log('DEBUG: change key, value =', k, toggle)
        selected.value = toggle
        //console.log('DEBUG: bool k !k', Boolean(k),!Boolean(k))
        if (show_notifications) {
          document.getElementById('notification').innerHTML = `<a href="?" onclick="location.reload();"> 🔄 Reload</a> to apply setting(s)`
        }
      }
    }
    setOptions()
}

const current_theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
if (current_theme) {
    document.documentElement.setAttribute('data-theme', current_theme);
}

setOptions()

let get_local = {};

["shuffle", "play_next", "show_vu"].forEach(option => {
  get_local[option] = localStorage.getItem(option) ? localStorage.getItem(option) : null;
});

shuffle = (get_local['shuffle'] === 'true') ? true : false;
play_next = (get_local['play_next'] === 'true') ? true : false;
show_vu = (get_local['show_vu'] === 'true') ? true : false;
enable_volume_meter = (show_vu || visualSetting !== 'off') ? true : false;  
