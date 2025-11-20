// settings dropdown

// const selectOptions() = {
//  LABEL: {
//      "opt1": val1,
//   }
// }

var optionSelector
const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;

if (currentTheme) {
  document.documentElement.setAttribute('data-theme', currentTheme);
}

function setOptions() {
  let options = '<select name="settings" id="options-selector">'
  let label
  let checked = false
  let disabled = false
  options += '<option value="" selected>Settings..</option>'
  for (const key of Object.keys(selectOptions())) {
    options += `<optgroup label="${key}">`
    for (let [k, v] of Object.entries(selectOptions()[key])) {
      switch(key) {
        case "THEME":
          label = k;
          checked = (v == document.documentElement.getAttribute('data-theme')) ? true : false;
          break;
        case "OPTIONS":
          label = `${k}: ${(v ? 'on' : 'off')}`;
          checked = v;
          //console.log('DEBUG: k, v, checked = ', k, v, checked)
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
  selected = e.target[e.target.options.selectedIndex];
  //console.log('DEBUG: label =', selected.label, ', selected.value =', selected.value, ' parent label = ', selected.parentElement.label)
  if (selected.parentElement.label == 'THEME') {
    document.documentElement.setAttribute('data-theme', selected.value);
    localStorage.setItem('theme', selected.value);
  }
  if (selected.parentElement.label == 'OPTIONS') {
    for (const [k, v] of Object.entries(selectOptions().OPTIONS)) {
      if (selected.label.includes(`${k}:`)) {
        toggle = !v
        localStorage.setItem(k, toggle);
        selectOptions().OPTIONS[k] = toggle
        selected.value = toggle
      }
    }
    enable_volume_meter = (selectOptions().OPTIONS.show_vu || selectOptions().OPTIONS.show_visualizer) ? true : false;
    document.getElementById('vu').style.display =  selectOptions().OPTIONS.show_vu ? 'block' : 'none';
    document.getElementById('visualizer').style.display =  selectOptions().OPTIONS.show_visualizer ? 'block' : 'none';
    setOptions()
  }
}

setOptions()
