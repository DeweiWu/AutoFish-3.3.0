const { ipcRenderer } = require('electron');

let previous = null;
let done = true;

document.addEventListener('mousemove', (event) => {

  if(!done) return;

  let x = event.clientX;
  let y = event.clientY;
  done = false;
  ipcRenderer.invoke('get-pixel-color', {x, y}).then(({r, g, b, scale}) => {
    if(previous) {
      previous.remove();
    }

    const node = document.createElement('div');
    previous = node;

    node.style =
    `
    position: absolute;
    border-radius: 25px;
    left: ${x + (10 * scale)}px;
    top: ${y - (40 * scale)}px;
    width: ${25 * scale}px;
    height: ${25 * scale}px;
    border: 2px solid black;
    background-color: rgb(${r}, ${g}, ${b});
    `
    document.body.append(node);
    done = true;
  })
})


document.addEventListener('mousedown', (event) => {
  if(event.button !== 0) {
    return ipcRenderer.send('mouse-coords');
  }
  let x = event.clientX;
  let y = event.clientY;
  ipcRenderer.send('mouse-coords', {x, y});
})
