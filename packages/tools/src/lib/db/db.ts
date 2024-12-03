import { Sequelize } from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';
import fs from 'fs';
import path from 'path';
import { ROOT_PATH } from '../paths';
import { rimraf } from 'rimraf';
import { ClassMeta } from './models/ClassMeta';
import { MethodMeta } from './models/MethodMeta';
import { ClassTag } from './models/ClassTag';
import { ClassTagData } from './models/ClassTagData';
import { MethodTag } from './models/MethodTag';
import { MethodTagData } from './models/MethodTagData';
import { GlobalStatement } from './models/GlobalStatement';
import { GlobalStatementTag } from './models/GlobalStatementTag';
import { GlobalStatementTagData } from './models/GlobalStatementTagData';

export const createDB = async (clear?: boolean) => {
    const dbPath = path.resolve(ROOT_PATH, '.cache');
    if (clear) {
        await rimraf(dbPath);
    }

    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
    }

    const db = new Sequelize({
        dialect: SqliteDialect,
        storage: path.resolve(dbPath, 'db.sqlite'),
        models: [
            ClassMeta,
            ClassTag,
            ClassTagData,
            MethodMeta,
            MethodTag,
            MethodTagData,
            GlobalStatement,
            GlobalStatementTag,
            GlobalStatementTagData,
        ],
    });
    await db.sync();
    return db;
};

export type DB = ReturnType<typeof createDB> extends Promise<infer R> ? R : never;
