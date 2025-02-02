const Jimp = require("jimp");
const { createWorker } = require("tesseract.js");
//const path = require('path')

let worker;

const setWorker = async (language) => {
  worker = await createWorker(language)
};

const readTextFrom = async (buffer, scale) => {
  let img = await Jimp.read(buffer);
  img.greyscale().contrast(0.3).invert();

  if(scale > 1) {
    img.scale(scale);
  }

  let result = await worker.recognize(await img.getBase64Async(Jimp.MIME_PNG));
  let words = result.data.words.map(({ text, baseline }) => ({
    text,
    y: baseline.y0 / scale,
  }));
  return words;
};

//let n = 0;

const readTextFrom2 = async (buffer, scale) => {
  let img = await Jimp.read(buffer);
  img.greyscale().contrast(0.3).invert();

  if(scale > 1) {
    img.scale(scale);
  }

  //img.write(`test${n++}.png`);
  //img.write(path.join(__dirname, `../../../app.asar.unpacked/test_${n++}.png`));

  let result = await worker.recognize(await img.getBase64Async(Jimp.MIME_PNG));

  let words = result.data.words.map(({ text, bbox }) => ({
    text,
    bbox
  }));
  return words;
};

function stringSimilarity(str1, str2) {
    if (str1.length === 0 && str2.length === 0) return 100;
    if (str1.length === 0 || str2.length === 0) return 0;

    const minLength = Math.min(str1.length, str2.length);
    let matchCount = 0;

    for (let i = 0; i < minLength; i++) {
        if (str1[i] === str2[i]) {
            matchCount++;
        }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return (matchCount / maxLength) * 100;
}

const sortWordsByItem2 = (recognizedWords, filterItems, filterConfidence) => {
  let result = [];
  for(const filterItem of filterItems) {
    let found = [];
    for(const filterWord of filterItem) {
       recognizedWords.forEach((recognizedWord, i) => {
        if(stringSimilarity(recognizedWord.text, filterWord) > filterConfidence) {
          found.push({word: recognizedWord, pos: i});
        }
      });
    }
    //console.log(`found`, found);
    if(found.length === filterItem.length) {
      result.push(
        {
          name: filterItem.join(` `),
          pos: Math.round(found.reduce((a, b) => a + b.word.bbox.y0, 0) / found.length)
        }
      );
      //console.log(`recWordsBefore`, recognizedWords);
      recognizedWords = recognizedWords.filter((word, i) => !found.some((foundWord) => foundWord.pos == i));
      //console.log(`recWordsAfter`, recognizedWords);
    }
  }
  return result;
};


/*
const items = [];

for(const foundWord of foundWords) {

  let item = items.find((item) => {
      let isWithin = foundWord.bbox.y0 < item.bbox.y1 && foundWord.bbox.y1 > item.bbox.y0;
      if(isWithin) {
        return item;
      }
  });
  let lineHeight = (foundWord.bbox.y1 - foundWord.bbox.y0) / 2;

  if(!item) {
    items.push({
      words: [foundWord.text],
      bbox: {
        y0: foundWord.bbox.y0 - lineHeight,
        y1: foundWord.bbox.y1 + lineHeight
      }
    })
  } else {
    item.words.push(foundWord.text);

    if(foundWord.bbox.y0 < item.bbox.y0) item.bbox.y0 = foundWord.bbox.y0 - lineHeight;
    if(foundWord.bbox.y1 < item.bbox.y1) item.bbox.y1 = foundWord.bbox.y1 + lineHeight;
  }
}

return items.map((item) => item.words.reduce((a, b) => a + ` ` + b));
*/

const getField = (attr) => (obj) => obj[attr];

const percentComparison = (first, second) => {
  if (second.length > first.length) {
    [first, second] = [second, first];
  }

  let mainLetters = Array.from(new Set([...first])).map(letter => ({letter, index: []}));
  [...first].forEach(letter => {
    let prevIndexes = mainLetters.find((mainLetter) => mainLetter.letter == letter).index;
    let lastPrevIndex = prevIndexes[prevIndexes.length - 1];
    let index = second.indexOf(letter, lastPrevIndex ? lastPrevIndex + 1 : 0);
    if(index != -1) {
      prevIndexes.push(index);
    }
  });

  return mainLetters.flatMap(getField(`index`)).length / first.length * 100
};

const sortWordsByItem = (words, lootWindow, isRetail) => {
  let itemHeight = lootWindow.itemHeight + (isRetail ? lootWindow.itemHeightAdd : 0);
  let gaps;
  if(isRetail) {
    gaps = new Array(4).fill(0).map((gap, i) => ({from: i == 0 ? lootWindow.itemHeight * (i + 1) : itemHeight * i + lootWindow.itemHeight,
                                                      to: (i == 0 ? lootWindow.itemHeight * (i + 1) : itemHeight * i + lootWindow.itemHeight) + lootWindow.itemHeightAdd + (i + 1)}));
  }
  let selected = [];
  words.forEach((word) => {
    if (!word.text || word.text.length < 2) return;
    if(isRetail && gaps.some(gap => word.y > gap.from && word.y < gap.to)) return;
    let pos = selected[Math.floor(word.y / itemHeight)];
    if (!pos) {
      selected[Math.floor(word.y / itemHeight)] = word.text;
    } else {
      selected[Math.floor(word.y / itemHeight)] += ` ${word.text}`;
    }
  });
  return selected.flat();
};

module.exports = {
  setWorker,
  percentComparison,
  readTextFrom,
  readTextFrom2,
  sortWordsByItem,
  sortWordsByItem2
};
