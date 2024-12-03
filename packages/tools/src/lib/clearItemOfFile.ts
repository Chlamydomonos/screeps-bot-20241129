import { Op } from '@sequelize/core';
import { ClassMeta } from './db/models/ClassMeta';
import { ClassTag } from './db/models/ClassTag';
import { GlobalStatement } from './db/models/GlobalStatement';
import { ClassTagData } from './db/models/ClassTagData';
import { GlobalStatementTag } from './db/models/GlobalStatementTag';
import { GlobalStatementTagData } from './db/models/GlobalStatementTagData';
import path from 'path';
import { SCREEPS_SRC_PATH } from './paths';

const beforeDestroy = async (classMeta: ClassMeta) => {
    const childClasses = await ClassMeta.findAll({
        where: {
            parentId: classMeta.id,
        },
    });
    const promises: Promise<any>[] = [];
    for (const childClass of childClasses) {
        childClass.parentId = undefined;
        childClass.parentUnknown = true;
        childClass.expectedParent = classMeta.name;
        childClass.expectedParentFile = classMeta.file;
        promises.push(childClass.save());
    }
    await Promise.all(promises);
};

/**
 * 删除数据库中所有关于某文件的内容。如果某个类的父类位于这个文件中，该类将被设置为父类待定状态。
 * @param file 文件名（相对路径）
 */
export const clearItemOfFile = async (file: string, isAbsolute?: boolean) => {
    if (isAbsolute) {
        file = path
            .relative(SCREEPS_SRC_PATH, file)
            .replace(/(\/|\\)index\.ts$/, '')
            .replace(/\.ts/, '');
    }

    const classes = await ClassMeta.findAll({
        where: {
            file,
        },
    });

    const promises: Promise<any>[] = [];
    for (const classMeta of classes) {
        promises.push(beforeDestroy(classMeta));
    }
    await Promise.all(promises);

    const classTags = await ClassTag.findAll({
        where: {
            classId: {
                [Op.in]: classes.map((c) => c.id),
            },
        },
    });

    await ClassTagData.destroy({
        where: {
            tagId: {
                [Op.in]: classTags.map((t) => t.id),
            },
        },
    });

    await ClassTag.destroy({
        where: {
            id: {
                [Op.in]: classTags.map((t) => t.id),
            },
        },
    });

    await ClassMeta.destroy({
        where: {
            id: {
                [Op.in]: classes.map((c) => c.id),
            },
        },
    });

    const globalStatements = await GlobalStatement.findAll({
        where: {
            file,
        },
    });

    const globalStatementTags = await GlobalStatementTag.findAll({
        where: {
            globalStatementId: {
                [Op.in]: globalStatements.map((s) => s.id),
            },
        },
    });

    await GlobalStatementTagData.destroy({
        where: {
            tagId: {
                [Op.in]: globalStatementTags.map((t) => t.id),
            },
        },
    });

    await GlobalStatementTag.destroy({
        where: {
            id: {
                [Op.in]: globalStatementTags.map((t) => t.id),
            },
        },
    });

    await GlobalStatement.destroy({
        where: {
            id: {
                [Op.in]: globalStatements.map((s) => s.id),
            },
        },
    });

    return file;
};
