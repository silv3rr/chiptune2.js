// Source: https://github.com/GoogleChromeLabs/web-audio-samples/blob/main/src/audio-worklet/basic/volume-meter/main.js
// Copyright (c) 2022 The Chromium Authors. All rights reserved.

let isModuleLoaded = false;
let isPlaying = false;
let isGraphReady = false;
let volumeMeterNode = null;

const loadGraph = async (context, player) => {
    volumeMeterNode = new AudioWorkletNode(context, 'volume-processor');
    volumeMeterNode.port.onmessage = ({data}) => {{}
        volMeterData = data
        //console.log('DEBUG: data =', data, ' volume =', volume, ' buf =', data.buf, ' volMeterData =', volMeterData)
    };

    player.currentPlayingNode.connect(volumeMeterNode)

    // send message to processor
    //player.currentPlayingNode.addEventListener("onended", () => {
    //    volumeMeterNode.port.postMessage("audio-ended");
    //});
    //volumeMeterNode.port.postMessage("test");
};

const startAudio = async (context, player) => {
    if (!isModuleLoaded) {
        await context.audioWorklet.addModule('js/volume-processor.js');
        isModuleLoaded = true;
    }
    await loadGraph(context, player);
    isGraphReady = true;
};

const stopAudio = () => {
    if (volumeMeterNode) {
        volumeMeterNode.disconnect();
    }
    isGraphReady = false;
};    

const initVolMeter = async (player) => {
    if (player !== undefined && !isPlaying) {
        if (player.currentPlayingNode) {
            let audioContext = player.context
            await startAudio(audioContext, player);
            isPlaying = true;
            //audioContext.resume()
        } else {
            //let audioContext = player.context
            //audioContext.suspend()
            stopAudio();
            isPlaying = false;
            volMeterData.volume = 0;
        }
    }
}
