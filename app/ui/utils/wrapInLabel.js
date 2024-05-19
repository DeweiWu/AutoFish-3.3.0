const elt = require("./elt.js");

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
        title: hint,
      })) : ``
    )
  );
};

module.exports = wrapInLabel;
