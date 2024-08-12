const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const chokidar = require('chokidar');
const sharp = require('sharp');
const fs = require('fs');

// Variable globale pour la fenêtre principale
let mainWindow;
let tray = null;

// Chemin vers le dossier Images
const imagesDir = path.join(process.env.USERPROFILE, 'Pictures'); // Pour Windows

function createWindow() {
  // Créer la fenêtre principale
  mainWindow = new BrowserWindow({
    width: 300,
    height: 200,
    show: false, // Garde la fenêtre cachée
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
}

function createTray() {
  // Créer une icône dans la barre de tâches
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Quit', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('Image Converter');
  tray.setContextMenu(contextMenu);
}

function startWatching() {
  const watcher = chokidar.watch(imagesDir, {
    ignored: /^\./, 
    persistent: true
  });

  watcher.on('add', filePath => {
    if (path.extname(filePath) === '.avif') {
      convertToJpg(filePath);
    }
  });
}

function convertToJpg(avifPath) {
  const jpgPath = avifPath.replace('.avif', '.jpg');

  sharp(avifPath)
    .jpeg()
    .toFile(jpgPath)
    .then(() => {
      console.log(`Converted ${avifPath} to ${jpgPath}`);
      fs.unlinkSync(avifPath);
    })
    .catch(err => {
      console.error(`Failed to convert ${avifPath}:`, err);
    });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  startWatching();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
