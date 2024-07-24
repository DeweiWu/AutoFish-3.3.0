const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const extract = require('extract-zip');

const configPath = process.env.NODE_ENV == `dev` ? './../config/' : `../../../app.asar.unpacked/app/config/`;
const configPathApp =  process.env.NODE_ENV == `dev` ? '../' : `../../../app.asar.unpacked/app/`;

function saveArchive(log) {
  // Open the save dialog
  dialog.showSaveDialog({
    title: 'Select Destination',
    buttonLabel: 'Save',
    filters: [
      { name: 'Zip Files', extensions: ['zip'] }
    ]
  }).then(file => {
    // Check if the user canceled the action
    if (!file.canceled) {
      const output = fs.createWriteStream(file.filePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      // Listen for the 'close' event on the output stream
      output.on('close', () => {
        log.ok(`Config saved successfully.`);
      });

      // Catch any errors that occur during the archiving process
      archive.on('error', err => {
        log.err(err.message);
        throw err;
      });

      // Pipe the archive data to the output file
      archive.pipe(output);

      // Append files and folders from the /config directory to the archive
      const configDir = path.join(__dirname, configPath);
      archive.directory(configDir, 'config');

      // Finalize the archive (complete the file)
      archive.finalize();
    }
  }).catch(err => {
    log.err(err.message);
  });
}

function loadArchive(log) {
  return new Promise(function(resolve, reject) {
    dialog.showOpenDialog({
      title: 'Select Config Archive',
      buttonLabel: 'Load',
      filters: [
        { name: 'Zip Files', extensions: ['zip'] }
      ],
      properties: ['openFile']
    }).then(file => {
      // Check if the user canceled the action
      if (!file.canceled) {
        const filePath = file.filePaths[0];
        const fileName = path.basename(filePath, '.zip');

        // Remove the existing /config directory
        fs.rmSync(configPath, { recursive: true, force: true });

        // Extract the selected archive to the /app directory
        extract(filePath, { dir: path.join(__dirname, configPathApp) }).then(() => {
          log.ok(`Config loaded successfully.`);
          resolve();
        }).catch(err => {
          log.err(err.message);
          reject(err);
        });
      }
    }).catch(err => {
      log.err(err.message);
      reject(err);
    });
  });
}


module.exports = {saveArchive, loadArchive};
