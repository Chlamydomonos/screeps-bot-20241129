import fs from 'fs';
import { GENERATED_PATH } from './paths';
import path from 'path';

interface GlobalItem {
    key: string;
    value: string;
    file: string;
}

export const generateFiles = (globalCache: GlobalItem[]) => {
    if (!fs.existsSync(GENERATED_PATH)) {
        fs.mkdirSync(GENERATED_PATH, { recursive: true });
    }

    const globalDTS =
        '/* eslint-disable @typescript-eslint/consistent-type-imports */\n/* eslint-disable no-var */\n\n' +
        globalCache
            .map((item) => `declare var ${item.key}: import('${item.file}').${item.value} & { __manualReset(): void };`)
            .join('\n');

    const manualResetTS1 = globalCache.map((item) => `import '${item.file}';`).join('\n');

    const manualResetTS2 = globalCache.map((item) => `    ${item.key}.__manualReset();`).join('\n');

    const manualResetTS = `${manualResetTS1}\n\nexport const manualReset = () => {\n${manualResetTS2}\n};`;

    fs.writeFileSync(path.resolve(GENERATED_PATH, 'global.d.ts'), globalDTS);
    fs.writeFileSync(path.resolve(GENERATED_PATH, 'manualReset.ts'), manualResetTS);
};
