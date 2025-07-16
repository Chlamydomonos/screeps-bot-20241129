/**
 * 文件清理模块
 *
 * 这个模块负责清理数据库中与特定文件相关的所有记录。
 * 主要用于文件删除或重新分析时，确保数据库中的数据与文件系统保持同步。
 *
 * 主要功能：
 * - 删除指定文件的所有类、方法和全局语句记录
 * - 处理类继承关系的更新（当父类被删除时）
 * - 维护数据库的引用完整性
 *
 * 清理范围：
 * - ClassMeta及其关联的ClassTag、ClassTagData
 * - MethodMeta及其关联的MethodTag、MethodTagData
 * - GlobalStatement及其关联的GlobalStatementTag、GlobalStatementTagData
 */

import { Op } from '@sequelize/core';
import { ClassMeta } from './db/models/ClassMeta';
import { ClassTag } from './db/models/ClassTag';
import { GlobalStatement } from './db/models/GlobalStatement';
import { ClassTagData } from './db/models/ClassTagData';
import { GlobalStatementTag } from './db/models/GlobalStatementTag';
import { GlobalStatementTagData } from './db/models/GlobalStatementTagData';
import path from 'path';
import { SCREEPS_SRC_PATH } from './paths';

/**
 * 类删除前的预处理函数
 *
 * 当一个类被删除时，需要处理所有继承自该类的子类，
 * 将它们的父类信息设置为"待定"状态，等待父类重新出现。
 *
 * @param classMeta 要删除的类元数据
 */
const beforeDestroy = async (classMeta: ClassMeta) => {
    // 查找所有继承自当前类的子类
    const childClasses = await ClassMeta.findAll({
        where: {
            parentId: classMeta.id,
        },
    });

    const promises: Promise<any>[] = [];
    for (const childClass of childClasses) {
        // 将子类的父类信息设置为待定状态
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
 * @param isAbsolute 是否为绝对路径
 */
export const clearItemOfFile = async (file: string, isAbsolute?: boolean) => {
    // 如果是绝对路径，转换为相对路径
    if (isAbsolute) {
        file = path
            .relative(SCREEPS_SRC_PATH, file)
            .replace(/(\/|\\)index\.ts$/, '')
            .replace(/\.ts/, '');
    }

    // 获取文件中的所有类
    const classes = await ClassMeta.findAll({
        where: {
            file,
        },
    });

    // 处理类的继承关系
    const promises: Promise<any>[] = [];
    for (const classMeta of classes) {
        promises.push(beforeDestroy(classMeta));
    }
    await Promise.all(promises);

    // 删除类标签数据
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

    // 删除类标签
    await ClassTag.destroy({
        where: {
            id: {
                [Op.in]: classTags.map((t) => t.id),
            },
        },
    });

    // 删除类元数据
    await ClassMeta.destroy({
        where: {
            id: {
                [Op.in]: classes.map((c) => c.id),
            },
        },
    });

    // 删除全局语句相关数据
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

    // 删除全局语句标签数据
    await GlobalStatementTagData.destroy({
        where: {
            tagId: {
                [Op.in]: globalStatementTags.map((t) => t.id),
            },
        },
    });

    // 删除全局语句标签
    await GlobalStatementTag.destroy({
        where: {
            id: {
                [Op.in]: globalStatementTags.map((t) => t.id),
            },
        },
    });

    // 删除全局语句
    await GlobalStatement.destroy({
        where: {
            id: {
                [Op.in]: globalStatements.map((s) => s.id),
            },
        },
    });

    return file;
};
