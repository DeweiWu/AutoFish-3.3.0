const elt = require("./elt.js");
const { ipcRenderer } = require('electron');

const isInside = (node, target) => {
  for (; node != null; node = node.parentNode) if (node == target) return true;
};

const wrapInLabel = (name, inner, hint, classname, style) => {
  return elt(
    "label",
    {className: classname, style: style},
    name,
    elt(
      "div",
      { className: "option" },
      inner,
      hint ? (elt("img", {
        src: "./img/hint.png",
        className: "option_hint",
        //title: hint,
        onmouseover(event) {
          if(!isInside(event.relatedTarget, this)) {
            let pos = this.getBoundingClientRect();
            ipcRenderer.send('create-hint-win', {
              text: hint,
              pos: {
                x: Math.floor(pos.x),
                y: Math.floor(pos.y)
              },
              client: {
                width: innerWidth,
                height: innerHeight
              }
            })
          }
        },
        onmouseout(event) {
          if(!isInside(event.relatedTarget, this)) {
            ipcRenderer.send("close-hint-win");
          }
        }

      })) : ``
    )
  );
};

module.exports = wrapInLabel;
