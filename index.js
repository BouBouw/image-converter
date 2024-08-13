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

console.log(`Watching for .avif files in ${imagesDir}`);
