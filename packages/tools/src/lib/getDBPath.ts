import path from 'path';
import { SCREEPS_SRC_PATH } from './paths';

export const getDBPath = (fullPath: string) => {
    return path
        .relative(SCREEPS_SRC_PATH, fullPath)
        .replace(/(\/|\\)index\.ts$/, '')
        .replace(/\.ts/, '');
};
