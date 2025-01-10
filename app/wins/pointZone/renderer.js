const { ipcRenderer } = require('electron');

let previous = null;

const node = document.createElement('div');
document.body.append(node);

ipcRenderer.on('show-info-box', (event, {x, y, r, g, b, scale}) => {
  node.style =
  `
  position: absolute;
  border-radius: 25px;
  left: ${Math.floor(x  / scale) + 10}px;
  top: ${Math.floor(y  / scale) - 40}px;
  width: ${25}px;
  height: ${25}px;
  border: 1px solid white;
  background-color: rgb(${r}, ${g}, ${b});
  `
})

document.addEventListener('mousedown', (event) => {
  if(event.button !== 0) {
    return ipcRenderer.send('mouse-coords');
  }

  ipcRenderer.send('mouse-coords', true);
  document.body.style.cursor = 'progress';
})
