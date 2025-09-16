// Source: https://github.com/mdn/webaudio-examples/blob/main/voice-change-o-matic/scripts/app.js
// modfied app.js to use volmeter buf instead of analyser buffer

function roundNumDec(num, dec) {
    return Number(Math.round(num + `e${dec}`) + `e-${dec}`);
  function colorCalc(i=0) {
    random = (min, max) => min + Math.floor(Math.random() * (max - min + 1))
    return {
      line: {
        0: "rgb(87, 87, 87)",
        10: "rgb(21, 150, 27)",
        20: "rgb(90, 216, 96)",
        30: "rgb(60, 241, 69)",
        40: "rgb(201, 189, 87)",
        50: "rgb(247, 243, 41)",
        60: "rgb(173, 112, 55)",
        70: "rgb(247, 137, 63)",
        80: "rgb(240, 27, 19)",
        volume: `rgb(${255-(i*10)}, ${255-(i*10)}, ${255-(i*10)})`
      },
      invertedbars: {
        darkred: `rgb(${i + 50}, 50, 50)`,
        red: `rgb(${i + 150}, 50, 50)`,
        blue: `rgb(${i * 0.1}, ${i * 1.1}, ${i + 100})`,
        pink: `rgb(${i + 100}, 5, 150)`,
        green_red: `rgb(${i + 50}, ${i + 0.1}, 50)`,
      },
      frequencybars: {
        red: `rgb(${i ? i + 100 : 250}, 50, 50)`,
        green: `rgb(50, ${i ? i + 100 : 150}, 50)`,
        blue1: `rgb(50, 50, ${i ? (i * 25) + 50 : 250})`,
        blue2: `rgb(${random(i, 255)},${random(i, 255)},${random(i, 255)})`,
        blue: `rgb(${i * 0.2}, ${i * 0.2}, ${(i * 5)}`,
      }
    }
  }
  function colorSwitch(i=0) {
    if(roundNumDec(i, 0) % 100 == 0) {
      canvasCtx.reset();
      canvasCtx.fillStyle = color['palette']['lilac'];
    } else if(roundNumDec(i, 0) % 500 == 0) {
      canvasCtx.reset();
      canvasCtx.fillStyle = color['palette']['lightgreen'];
    } else {
      canvasCtx.reset();
      canvasCtx.fillStyle = colorCalc()['bars']['darkred'];
    }
  }
  //const visualSetting = visualSelect.value;
  // Set up canvas context for visualizer
  const canvas = document.getElementById("canvas");
  const canvasCtx = canvas.getContext("2d");
  const color = {
    black: "rgb(10, 10, 10)",
    carbon: "rgb(30, 30, 30)",
    white: "rgb(255, 255, 255)",
    red: "rgb(240, 0, 0)",
    darkblue: "rgb(0, 0, 180)",
    grayblue: "rgb(91, 132, 247)",
    lightgreen: "rgb(55, 255, 0)",
    gray: "rgb(87, 87, 87)",
    brightgray:"rgb(230, 230, 230)",
    lightgray: "rgb(200, 200, 200)",
    lilac: "rgb(100, 100, 200)",
  }
  //console.log('DEBUG: visualSetting=', visualSetting);

  if (visualSetting === "sinewave") {
    //analyser.fftSize = 2048;
    //const bufferLength = analyser.fftSize;
    // We can use Float32Array instead of Uint8Array if we want higher precision
    // const dataArray = new Float32Array(bufferLength);
    // const dataArray = new Uint8Array(bufferLength);
    
    const bufferLength = volMeterData.buffer ? volMeterData.buffer.length : 0
    //const dataArray = volMeterData.buffer ? volMeterData.buffer : 0
    const dataArray = volMeterData.buffer 

    //canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    const draw = () => {
      drawVisual = requestAnimationFrame(draw);
      //analyser.getByteTimeDomainData(dataArray);
      //let dataArray = buf
      //canvasCtx.fillStyle = "rgb(200, 200, 200)";
      canvasCtx.fillStyle = "rgb(255, 255, 255)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "rgb(0, 0, 0)";
      canvasCtx.beginPath();
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        //const v = dataArray[i] / 128.0;
        const v = dataArray[i];
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, (canvas.height/2)-y);
        } else {
          canvasCtx.lineTo(x, (canvas.height/2)-y);
        }

        x += sliceWidth;
      }
      //canvasCtx.lineTo(canvas.width, canvas.height);
      canvasCtx.stroke();
    };
    //draw();
    requestAnimationFrame(draw);
  } else if (visualSetting === "frequencybars") {
    //analyser.fftSize = 256;
    //const bufferLengthAlt = analyser.frequencyBinCount;
    // See comment above for Float32Array()
    //const dataArrayAlt = new Uint8Array(bufferLengthAlt);
    const bufferLengthAlt = volMeterData.buffer ? volMeterData.buffer.length : 0
    const dataArrayAlt = volMeterData.buffer ? volMeterData.buffer : 0
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    const drawAlt = () => {
      drawVisual = requestAnimationFrame(drawAlt);
      //analyser.getByteFrequencyData(dataArrayAlt);
      canvasCtx.fillStyle = "rgb(0, 0, 0)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      //const barWidth = (WIDTH / bufferLengthAlt) * 2.5;
      const barWidth = (canvas.width / bufferLengthAlt) * 25;
      let x = 0;
      for (let i = 0; i < bufferLengthAlt; i++) {
        //const barHeight = dataArrayAlt[i];
        const barHeight = roundNumDec(dataArrayAlt[i],2) * 500;
        canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ", 50, 50)";
        canvasCtx.fillRect(
          x,
          canvas.height - barHeight / 2,
          barWidth,
          barHeight / 2
        );
        x += barWidth + 1;
      }
    };
    drawAlt();

  } else if (visualSetting === "line") {
    function drawLine() {
      let vol = roundNumDec(volMeterData.volume, 2)
      //let vol = roundNumDec((volMeterData.volume *2*2), 2)
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawVisual = requestAnimationFrame(drawLine);
      //canvasCtx.fillStyle = "rgb(230, 230, 230)";
      canvasCtx.fillStyle = "rgb(255, 255, 255)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 3 + (vol * 50);
      //canvasCtx.strokeStyle = `rgb(${255-(volume*10)}, ${255-(volume*10)}, ${255-(volume*10)})`;
      canvasCtx.strokeStyle = "rgb(87, 87, 87)";
      line_color = {
        0: "rgb(87, 87, 87)",
        10: "rgb(21, 150, 27)",
        20: "rgb(90, 216, 96)",
        30: "rgb(60, 241, 69)",
        40: "rgb(201, 189, 87)",
        50: "rgb(247, 243, 41)",
        60: "rgb(173, 112, 55)",
        70: "rgb(247, 137, 63)",
        80: "rgb(240, 27, 19)",
      }
      let round_vol = roundNumDec((volMeterData.volume*100)*2*2, 0);
      let vol_10 = Math.round(round_vol/10)*10
      vol_10 = (vol_10>80) ? 80 : vol_10
      //console.log(vol_10, line_color[vol_10])

      // Example:
      /*
      //const sliceWidth = (WIDTH * 1.0) / volume;
      //const sliceWidth = volume;
      //let x = 0;
      //const v = volume // / 128.0;
      //const y = (v * HEIGHT)  // / 2;
      const y = (volume * 10) * (HEIGHT /2);
      canvasCtx.moveTo(x, y);
      canvasCtx.lineTo(x, y);
      canvasCtx.lineTo(WIDTH, HEIGHT / 2);
      canvasCtx.stroke();
      //x += sliceWidth;
      */            

      canvasCtx.strokeStyle = line_color[vol_10]
      canvasCtx.beginPath();
      const y = ((vol*8) * (canvas.height/2));
      canvasCtx.moveTo(0, canvas.height-y);
      canvasCtx.lineTo(canvas.width, canvas.height-y);
      canvasCtx.stroke();

      // add 2 more gray lines before/after
      
      /* [9, 7].forEach(i => {
        canvasCtx.strokeStyle = "rgb(87, 87, 87)";
        canvasCtx.lineWidth = 2;
        canvasCtx.beginPath();
        const y = ((vol*i) * (canvas.height/2));
        canvasCtx.moveTo(0, canvas.height-y);
        canvasCtx.lineTo(canvas.width, canvas.height-y1);
        canvasCtx.stroke();
      */;

      // clear canvas every 5 elements (needs x / buf array)
      //if (x % 5 == 0) {
      //  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      //}
    }
    drawLine()
  } else if (visualSetting === "bars") {
      // draw bars (same as "frequencybars")
      function drawBars() {
        drawVisual = requestAnimationFrame(drawBars);
        const barWidth = canvas.width * 2.5;
        let barHeight;
        barHeight = volMeterData.volume / 2
        let x = 0;
        canvasCtx.fillStyle = `rgb(${barHeight + 100} 50 50)`;
        canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);
        x += barWidth + 1;
      }
      drawBars()

  } else if (visualSetting === "off") {
      //document.getElementById('vol').innerHTML = "Visualization: <strong>off!<//strong>";
      // clear canvas
      //canvasCtx.height = '0'
      //canvasCtx.width = '0';
      //canvasCtx.fillStyle = "#ffdcdc";
      //canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      //canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      // disable
      //document.getElementById('visualizer').style.display = 'none';
      console.log(visualSetting, visualSetting)
    }
}
