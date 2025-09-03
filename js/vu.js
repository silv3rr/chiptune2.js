/*  VU
 *  modified script.js
 *  Source: https://gist.github.com/bredfern/1c57a99744ce9697eadff02b77b91e0b
 *  Needs: volume-processor.js, volume-meter.js, vu.css, html: div .VU
*/

var rafID = null;
var stereo = false  // mono: disables vu-right

function setVU (value) {
    document.getElementById('vu-left').setAttribute('class', 'led'+value);
    if (stereo) {
        document.getElementById('vu-right').setAttribute('class', 'led'+value);
    }
}

function peakVU (peak) {
    if (peak) {
        document.getElementById('vu-left').setAttribute('style', 'background:red');
        if (stereo) {
            document.getElementById('vu-right').setAttribute('style', 'background:red');
        }
    }
    else {
        document.getElementById('vu-left').setAttribute('style', 'background:black');
        if (stereo) {
            document.getElementById('vu-right').setAttribute('style', 'background:black');
        }
    }
}

function initVU() {
    // kick off the visual updating
    drawLoop();
}

//const drawLoop = async (volume) => { }

function drawLoop(time) {
    if (volMeterData) {
        // check if we're currently clipping
        if (volMeterData.clipping) {
            peakVU(true);
        } else {
            peakVU(false);
        }

        //console.log('DEBUG: Math.round volume', Math.round(10*volume*2))
        if (volMeterData.volume > 0) {
            setVU(Math.round(10*volMeterData.volume*2));
        }
    
        // set up the next visual callback
        rafID = window.requestAnimationFrame( drawLoop );
    }
}
