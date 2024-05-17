const fsPromise = require('fs/promises');
const trialEncryption = require('./trialEnc.js')

const key = "26612137141ed19dcefd816de67f04e9593ac46461c8953d0a437b3762778644";
const iv = "ef8945445e29a2cfe32bae03bd71477f"
let encData = trialEncryption.encrypt({timeLeft: 15 * 60 * 1000}, key, iv);
fsPromise.writeFile('badd7ae8f43', encData);
