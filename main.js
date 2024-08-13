const { app, BrowserWindow, Tray, Menu, Notification } = require('electron');
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
    title: "Covertisseur d'image",
    width: 300,
    height: 200,
    show: false, // Garde la fenêtre cachée
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('src/index.html');
}

function createTray() {
  // Créer une icône dans la barre de tâches
  tray = new Tray(path.join(__dirname, 'src/icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Check new image', click: () => { startWatching(); } },
    { label: 'Quit', click: () => { app.quit(); } },
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

function showNotification(title, body, path) {
  const notification = {
    title: title,
    body: body,
    icon: path
  };
  
  new Notification(notification).show();
}

function convertToJpg(avifPath) {
  const jpgPath = avifPath.replace('.avif', '.jpg');

  sharp(avifPath)
    .jpeg()
    .toFile(jpgPath)
    .then(() => {
      console.log(`Converted ${avifPath} to ${jpgPath}`);
      showNotification('Conversion réussie', `Votre image s'est convertie avec succès !`, jpgPath);
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
