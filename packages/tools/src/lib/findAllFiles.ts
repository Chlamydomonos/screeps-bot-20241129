import fs from 'fs';
import path from 'path';

export const findAllFiles = (dir: string) => {
    let tsFiles: string[] = [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            tsFiles = tsFiles.concat(findAllFiles(fullPath));
        } else if (entry.isFile() && fullPath.endsWith('.ts')) {
            tsFiles.push(fullPath);
        }
    }

    return tsFiles;
};
