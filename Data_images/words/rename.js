const fs = require('fs');
const path = require('path');

// Get current directory
const directoryPath = __dirname;

console.log(`Scanning directory: ${directoryPath}`);

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    files.forEach((file) => {
        // Only process PNG files
        if (path.extname(file).toLowerCase() === '.png') {
            
            const originalName = file;
            const nameWithoutExt = path.parse(file).name;

            // 1. Lowercase
            let newName = nameWithoutExt.toLowerCase();

            // 2. Remove apostrophes completely (don't -> dont)
            newName = newName.replace(/['’›]/g, "");

            // 3. Replace non-alphanumeric characters (spaces, commas, dots) with dashes
            newName = newName.replace(/[^a-z0-9]/g, "-");

            // 4. Clean up dashes (remove double dashes, leading/trailing)
            newName = newName.replace(/-+/g, "-").replace(/^-+|-+$/g, "");

            // 5. Add extension back
            const newFilename = newName + '.png';

            // 6. Rename file
            if (newFilename !== originalName) {
                const oldPath = path.join(directoryPath, originalName);
                const newPath = path.join(directoryPath, newFilename);

                fs.rename(oldPath, newPath, (err) => {
                    if (err) console.log(`ERROR renaming ${originalName}`);
                    else console.log(`Renamed: "${originalName}" -> "${newFilename}"`);
                });
            }
        }
    });
});