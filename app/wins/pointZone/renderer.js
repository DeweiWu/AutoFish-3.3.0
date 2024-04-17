const { ipcRenderer } = require('electron');

document.addEventListener('mousedown', (event) => {
  let x = event.clientX;
  let y = event.clientY;
  ipcRenderer.send('mouse-coords', {x, y});
})
