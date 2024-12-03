import { sql } from '@sequelize/core';
import chokidar from 'chokidar';
import express from 'express';
import path from 'path';
import { analyzeFile } from '../lib/analyzeFile';
import { clearItemOfFile } from '../lib/clearItemOfFile';
import { createDB } from '../lib/db/db';
import { findAllFiles } from '../lib/findAllFiles';
import { generateFiles } from '../lib/generateGlobal';
import { SCREEPS_SRC_PATH } from '../lib/paths';
import { getClassCache } from '../lib/getClassCache';

type ChokidarEvent = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir' | 'ready' | 'raw' | 'error';

const main = async () => {
    const files = new Set(findAllFiles(SCREEPS_SRC_PATH));

    const db = await createDB(true);
    await db.sync();

    chokidar
        .watch(SCREEPS_SRC_PATH, {
            ignored: (p) => path.relative(SCREEPS_SRC_PATH, p).startsWith('generated'),
        })
        .on('all', async (event: ChokidarEvent, filePath: string) => {
            const fullPath = path.resolve(SCREEPS_SRC_PATH, filePath);
            if (event == 'add' || event == 'change') {
                await analyzeFile(fullPath);
            } else if (event == 'unlink') {
                await clearItemOfFile(fullPath, true);
            } else {
                return;
            }

            if (files.has(fullPath)) {
                files.delete(filePath);
                return;
            }

            const globalCache = (
                await db.query(sql`
                    select \`GlobalStatements\`.*
                    from \`GlobalStatements\` join \`GlobalStatementTags\`
                    on \`GlobalStatements\`.\`id\` = \`GlobalStatementTags\`.\`globalStatementId\`
                    where \`GlobalStatementTags\`.\`name\` = "exportGlobal"
            `)
            )[0]
                .map((value) => {
                    const { text, file } = value as { text: string; file: string };
                    const match = /exportGlobal\s*\(\s*['"](.+)['"]\s*,\s*(\w+).*\)/.exec(text);
                    if (!match) {
                        return undefined;
                    }

                    return {
                        key: match[1],
                        value: match[2],
                        file: `@/${file.replace(/\\/g, '/')}`,
                    };
                })
                .filter((value) => !!value);

            generateFiles(globalCache);
        });

    const app = express();
    app.use(express.json());
    app.post('/cache', async (req, res) => {
        const { file } = req.body;
        res.send(await getClassCache(file));
    });
    app.listen(25487, () => {
        console.log('app listening on 25487');
    });
};

main();
