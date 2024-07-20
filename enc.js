const crypto = require('crypto');
const algorithm = 'aes-256-cbc';

function encrypt(jsonObject, key, iv) {
  let jsonString = JSON.stringify(jsonObject);
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(jsonString);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex')
}

function decrypt(encryptedData, key, iv) {
  let encryptedText = Buffer.from(encryptedData, 'hex');
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
}

module.exports = {
  encrypt,
  decrypt
};
