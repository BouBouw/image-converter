const chokidar = require('chokidar');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const imagesDir = path.join(process.env.USERPROFILE, 'Images'); // Pour Windows

const watcher = chokidar.watch(imagesDir, {
    ignored: /^\./, 
    persistent: true
});

watcher.on('add', filePath => {
    if (path.extname(filePath) === '.avif') {
        convertToJpg(filePath);
    }
});

async function convertToJpg(avifPath) {
    const jpgPath = avifPath.replace('.avif', '.jpg');

    try {
        await sharp(avifPath)
            .jpeg()
            .toFile(jpgPath);
        console.log(`Converti avec succès : ${jpgPath}`);
        fs.unlinkSync(avifPath);
    } catch (error) {
        console.error(`Erreur lors de la conversion de ${avifPath}:`, error);
    }
}

console.log(`Watching for .avif files in ${imagesDir}`);
