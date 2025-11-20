// Source: https://github.com/mdn/webaudio-examples/blob/main/voice-change-o-matic/scripts/app.js
// modfied app.js to use volmeter buffer instead of analyser

function visualize(visualSetting) {
  //console.log('DEBUG: visualizer visualSetting =', visualSetting)
  if (!volMeterData.buffer) {
    return false
  }
  function roundNumDec(num, dec) {
    return Number(Math.round(num + `e${dec}`) + `e-${dec}`);
  }
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
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

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

  if (drawVisual) {
    cancelAnimationFrame(drawVisual);
  }

  //reset canvas
  canvasCtx.reset()
  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  canvasCtx.fillStyle = color['black']
  canvasCtx.strokeStyle = color['brightgray']
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  //console.log('DEBUG: visualSetting=', visualSetting);
  if (visualSetting === "sinewave") {
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    const draw = () => {
      const bufferLength = volMeterData.buffer ? volMeterData.buffer.length : 0
      const dataArray = volMeterData.buffer ? volMeterData.buffer : 0 
      drawVisual = requestAnimationFrame(draw);
      canvasCtx.strokeStyle = color['black']
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = color['lightgray'];
      canvasCtx.beginPath();
      const sliceWidth = (WIDTH * 1.0) / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        if (visualRainbow) {
          canvasCtx.strokeStyle = colorRnd(i)
        }
        //const v = dataArray[i] / 128.0;
        const v = dataArray[i];
        const y = (v * HEIGHT) / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, (HEIGHT/2)-y);
        } else {
          canvasCtx.lineTo(x, (HEIGHT/2)-y);
        }
        x += sliceWidth;
      }
      //canvasCtx.lineTo(WIDTH, HEIGHT);
      canvasCtx.stroke();
    };
    draw();
  } else if (visualSetting === "frequencybars") {
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    const drawFreqBars = () => {
      const bufferLength = volMeterData.buffer ? volMeterData.buffer.length : 0
      const dataArray = volMeterData.buffer ? volMeterData.buffer : 0
      drawVisual = requestAnimationFrame(drawFreqBars);
      canvasCtx.fillStyle = color['carbon']
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      const barWidth = (WIDTH / bufferLength) * 5;  //default: *2.5, 5-bars: *25;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        // const barHeight = dataArray[i];
        const barHeight = roundNumDec(dataArray[i], 2) * 500;
        if (barHeight > HEIGHT-5) {
          canvasCtx.fillStyle = color['red']
          canvasCtx.fillRect(x, HEIGHT - (barHeight / 2) - 1, barWidth, barHeight / 2);
        }
        if (barHeight % 2 === 0) {
          canvasCtx.fillStyle = color['darkblue']
          canvasCtx.fillRect(x, (HEIGHT - barHeight / 2), barWidth, barHeight / 4);
          if (visualRainbow) {
            canvasCtx.fillStyle = colorRnd(i)
          } else {
            canvasCtx.fillStyle = colorCalc(barHeight)['frequencybars']['blue']
          }
        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);
        } else {
          if (visualRainbow) {
            canvasCtx.fillStyle = colorRnd(i)
          } else {
            canvasCtx.fillStyle = colorCalc(barHeight)['frequencybars']['blue']
          }
          canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);
          x += barWidth;
        }
        //canvasCtx.fillStyle = color['darkblue']
        //canvasCtx.fillRect(x, HEIGHT - barHeight / 4, barWidth + 1, barHeight / 4);
      }
    };
    drawFreqBars();
  } else if (visualSetting === "line") {
    function drawLine() {
      drawVisual = requestAnimationFrame(drawLine);
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.fillStyle = color['brightgray']
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      //canvasCtx.strokeStyle = color['gray'];
      let vol = roundNumDec(volMeterData.volume, 2)
      let round_vol = roundNumDec((volMeterData.volume*100)*1.75, 0);
      let tens_vol = Math.round(round_vol/10)*10
      let norm_tens_vol = (tens_vol>80) ? 80 : tens_vol
      //console.log(vol_10, line_color[vol_10])
      let m = 8
      let y = ((vol*m) * (HEIGHT/2))*0.4;
      if (y > HEIGHT-1) {
        y = HEIGHT-3;
      }
      canvasCtx.lineWidth = 3 + (vol * 50);
      if (visualRainbow) {
        canvasCtx.strokeStyle = colorRnd(norm_tens_vol)
      } else {
        canvasCtx.strokeStyle = colorCalc()['line'][norm_tens_vol]
      }
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, HEIGHT-y);
      canvasCtx.lineTo(WIDTH, HEIGHT-y);
      canvasCtx.stroke();

      // uncomment to add 2 more gray lines before/after
      [m-1, m+1].forEach(i => {
        let y = ((vol*i) * (HEIGHT/2))*0.4;
        if (y > HEIGHT-1) {
          y = HEIGHT-1;
        } 
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = color['gray'];
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, HEIGHT-y);
        canvasCtx.lineTo(WIDTH, HEIGHT-y);
        canvasCtx.stroke();
      });
    }
    drawLine()
  } else if (visualSetting === "invertedbars") {
    function drawInvBars() {
      const bufferLength = volMeterData.buffer ? volMeterData.buffer.length : 0
      const dataArray = volMeterData.buffer ? volMeterData.buffer : 0
      drawVisual = requestAnimationFrame(drawInvBars);
      const barWidth = WIDTH * 2.5;
      for (let i = 0; i < bufferLength; i++) {
        // barHeight = dataArray[i];
        // barHeight = volMeterData.volume / 2
        const barHeight = roundNumDec(dataArray[i], 2) * 500;
        if (barHeight < -200) {
          canvasCtx.fillStyle = color['black']
          canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        }
        if (visualRainbow) {
          canvasCtx.fillStyle = colorRnd(i)
        } else {
          canvasCtx.fillStyle = colorCalc(i)['invertedbars']['red'];
        }
        canvasCtx.fillRect(0, HEIGHT - barHeight / 2, barWidth, barHeight);
      }
    }
    drawInvBars()
  } else if (visualSetting === "off") {
    canvasCtx.reset()
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.strokeStyle = color['black']
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    document.getElementById('visualizer').style.display = 'none';
    console.log(`visualizer: disabled (${visualSetting})`)
  }
}
