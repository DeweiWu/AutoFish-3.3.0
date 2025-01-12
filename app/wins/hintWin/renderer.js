const { ipcRenderer } = require("electron");

const isInside = (node, target) => {
  for (; node != null; node = node.parentNode) if (node == target) return true;
};

function parseTextToHTML(inputText) {
  // Create a div to hold the parsed elements
  const container = document.createElement('div');

  // Split the text by double newlines to create paragraphs
  const paragraphs = inputText.split('\n\n');

  paragraphs.forEach(paragraph => {
    // Create a p element for each paragraph
    const p = document.createElement('p');

    // Replace **bold** text with a span element
    paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, (match, content) => {
      const span = document.createElement('span');
      span.style.fontWeight = 'bold';
      span.textContent = content;
      return span.outerHTML;
    });

    // Replace *italic* text with a span element
    paragraph = paragraph.replace(/\*(.*?)\*/g, (match, content) => {
      const span = document.createElement('span');
      span.style.fontStyle = 'italic';
      span.textContent = content;
      return span.outerHTML;
    });

    // Split paragraph by single newline for line breaks
    const lines = paragraph.split('\n');
    lines.forEach((line, index) => {
      p.innerHTML += line;
      if (index < lines.length - 1) {
        p.appendChild(document.createElement('br'));
      }
    });

    // Append the p element to the container
    container.appendChild(p);
  });

  return container;
}



const backgroundElement = document.createElement('div');
backgroundElement.className = 'container';

ipcRenderer.on("show-hint", (event, text) => {
  console.log(parseTextToHTML(text));
  backgroundElement.append(parseTextToHTML(text));
  document.body.append(backgroundElement);
});
