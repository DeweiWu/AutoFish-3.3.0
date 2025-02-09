const createRgb = require('../utils/rgb.js');
const Jimp = require("jimp");
const createOpenai = require(`../utils/openai.js`);

const closeEnough = value => (v1, v2) => Math.abs(v1 - v2) <= value;

const { createWorker } = require("tesseract.js");

let worker;
const setWorker = async (language) => {
  worker = await createWorker(language)
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
/*
function extractWhispers(text) {
    // Case-insensitive regex to match variations of "whispers" followed by ":"
    const keywordRegex = /\b[vw][^\s:]*?:/gi;
    // Split the text into parts using the keyword as a delimiter
    const parts = text.split(keywordRegex).slice(1); // Split after keywords
    const results = [];
    for (const part of parts) {
        // Extract content until the first "[tag]" or end of string
        const match = /(.*?)(?=\s*\[\w+\]|$)/s.exec(part);
        if (match) {
            let content = match[0].trim();
            // Remove trailing "To " if present
            content = content.replace(/To\s*$/, '');
            if (content) results.push(content);
        }
    }
    return results;
}
*/

const extractWords = (str) => str.match(/[^\s]+/g) || [];

const editProperly = (str) => {
    let removeQuotes = str.replace(/^"(.*)"$/, '$1').toLowerCase();
    if(/^You:/.test(removeQuotes)) {
      removeQuotes = removeQuotes.slice(4);
    }

    return removeQuotes;
};

const createSplitRegex = (words) => {
    if (!words.length) return null;
    const escapedWords = words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Escape special regex characters
    return new RegExp(`(?:^|\\s)(?:${escapedWords.join('|')})(?=\\s|$)`, 'gi'); // Non-capturing group
};

function extractWhispers(text, trigger, threshold) {
  let results = [];
  const words = extractWords(text);
  const foundWords = words.filter((word) => stringSimilarity(trigger, word) > threshold);

  if(foundWords.length < 1) {
    return results;
  }
  //console.log(`found words`, foundWords);

  const parts = text.split(createSplitRegex(foundWords)).slice(1); // Split after keywords
  for (const part of parts) {
      // Extract content until the first "[tag]" or end of string
      const match = /(.*?)(?=\s*\[\w+\]|$)/s.exec(part);
      if (match) {
          let content = match[0].trim();
          // Remove trailing "To " if present
          content = content.replace(/To\s*$/, '');
          if (content) results.push(content.trim());
      }
  }

  return results;
}

function extractNameFromBrackets(targetString, text) {
    // Find the position of the target string within the text
    const position = text.indexOf(targetString);
    if (position === -1) return null; // If target string is not found, return null

    // Extract the portion of text before the found position
    const beforeTarget = text.substring(0, position);

    // Match the last occurrence of text inside square brackets
    const match = [...beforeTarget.matchAll(/\[(\w+)\]/g)];

    // Return the matched group if found, otherwise return null
    return match ? match[match.length - 1][1] : null;
}


const createChatZone = ({ getDataFrom, zone, screenSize}, tmBot, {
  whispSpecColors, whitelistLanguage, openaikey, openai, openaiprompt, openaimodel, detectTriggerWhisper, detectTriggerSay, detectTriggerWhisperWord, detectTriggerSayWord, detectByType
}) => {
  setWorker(whitelistLanguage);

  let openaiAPI;
  if(openai) {
    openaiAPI = createOpenai(openaikey);
  }


  let whisperColor = ([r, g, b]) => whispSpecColors.some(specColor => {

    let percR = 255 - (255 * (specColor.percent / 100))
    let percG = 255 - (255 * (specColor.percent / 100))
    let percB = 255 - (255 * (specColor.percent / 100))

    return closeEnough(percR)(specColor.r, r) && closeEnough(percG)(specColor.g, g) && closeEnough(percB)(specColor.b, b)
  });

  let previousMsg = [];
  let previousWhispers = [];
  let previousSays = [];
  let dialogsHistoryWhisper = [];
  let dialogsHistorySay = [];
  return {
    async checkNewMessages() {
      let data = await getDataFrom(zone);
      const rgb = createRgb(data);

      if(detectByType == 'text') {
        const img = await Jimp.read(data);
        img.greyscale().contrast(0.3).invert().scale(2);

        let textData = await worker.recognize(await img.getBase64Async(Jimp.MIME_PNG));
        let text = textData.data.words.map(({ text }) => text).join(' ');
        //console.log(`text`, text);
        //console.log(`word to extract`, detectTriggerSayWord);

        let whispers = extractWhispers(text, detectTriggerWhisperWord, 75); // TEMP:
        let says = extractWhispers(text, detectTriggerSayWord, 75);

        //console.log(`extracted words`, says);
        let lastSay = says[says.length - 1];
        let lastWhisper = whispers[whispers.length - 1];

        if(detectTriggerWhisper && lastWhisper && !previousWhispers.some(({whisper}) => stringSimilarity(whisper, lastWhisper) > 75)) {
          /*
          let history = previousWhispers.reduce((a, b) => {
            return a + `- "${b.whisper}"\n- "${b.response}"\n`
          }, ``);
          */

          let response = ``;
          if(openai && openaikey) {
            let history;
            let nameWhisper = extractNameFromBrackets(lastWhisper, text);
            const alreadySpokenWith = dialogsHistoryWhisper.find(({name}) => stringSimilarity(name, nameWhisper) > 75);
            if(alreadySpokenWith) {
              alreadySpokenWith.history += `\n${nameWhisper}: ${lastWhisper}`
              history = alreadySpokenWith.history;
            }

            const fullPrompt = openaiprompt + (history ? `Be consistent with the previous dialog and reply to the last message:\n${history}` : ``) + `\n${nameWhisper}: "${lastWhisper}"` ;

            try {
              response = editProperly(await openaiAPI.prompt(fullPrompt, openaimodel));
            } catch(e) {
              response = ``;
            }

            if(!alreadySpokenWith) {
              dialogsHistoryWhisper.push({
                name: nameWhisper,
                history: `${nameWhisper} ${lastWhisper}\nYou: ${response}`
              })
            } else {
              alreadySpokenWith.history += `\nYou: ${response}`;
            }
          }

          previousWhispers.push({
            whisper: lastWhisper,
            response
          });

          return {type: 'whisper', response};
        }

        if(detectTriggerSay && lastSay && !previousSays.some(({say, response}) => stringSimilarity(say, lastSay) > 75 || stringSimilarity(response, lastSay) > 75)) {
          /*
          let history = previousSays.reduce((a, b) => {
            return a + `- "${b.say}"\n- "${b.response}"\n`
          }, ``);
          */

          let response = ``;
          if(openai && openaikey) {
            let history;
            let nameSay = extractNameFromBrackets(lastSay, text);

            const alreadySpokenWith = dialogsHistorySay.find(({name}) => stringSimilarity(name, nameSay) > 75);
            if(alreadySpokenWith) {
              alreadySpokenWith.history += `\n${nameSay}: ${lastSay}`
              history = alreadySpokenWith.history;
            }

            const fullPrompt = openaiprompt + (history ? `The other player is standing just right beside you. Be consistent with the previous dialog and reply to the last message:\n${history}` : ``) + `\n${nameSay}: ${lastSay}` ;
            try {
              response = editProperly(await openaiAPI.prompt(fullPrompt, openaimodel));
            } catch(e) {
              response = ``;
            }

            if(!alreadySpokenWith) {
              dialogsHistorySay.push({
                name: nameSay,
                history: `${nameSay}: ${lastSay}\nYou: ${response}`
              })
            } else {
              alreadySpokenWith.history += `\nYou: ${response}`;
            }

          }

          previousSays.push({
            say: lastSay,
            response
          });

          return {type: 'say', response};
        }

      } else { // if not openai
        const whisperMsg = rgb.findColors({ isColor: whisperColor });
        if(whisperMsg) {
          if(!closeEnough((screenSize.height / 1080) * 15)(previousMsg.length, whisperMsg.length)) {
            previousMsg = whisperMsg;
            return true;
          }
        }
      }
    },

    async getImage() {
      const img = await Jimp.read(await getDataFrom(zone));
      return await img.getBufferAsync(Jimp.MIME_JPEG)
    }
  }
};

module.exports = createChatZone;
