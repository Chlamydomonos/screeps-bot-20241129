/**
 * 类缓存获取模块
 *
 * 这个模块负责从数据库中获取类的完整信息，包括类的标签、方法和继承链。
 * 主要用于ESLint插件查询类信息，以便进行自定义代码检查。
 *
 * 功能：
 * - 获取类的方法信息及其标签
 * - 获取类的标签信息
 * - 构建类的继承链信息
 * - 返回完整的类缓存数据
 *
 * 数据结构：
 * - Tag: 标签信息（名称和数据）
 * - FullClass: 完整的类信息（包含标签、方法和继承链）
 */

import { createDB } from './db/db';
import { ClassMeta } from './db/models/class-meta';
import { ClassTag } from './db/models/class-tag';
import { ClassTagData } from './db/models/class-tag-data';
import { MethodMeta } from './db/models/method-meta';
import { MethodTag } from './db/models/method-tag';
import { MethodTagData } from './db/models/method-tag-data';

/**
 * 获取类的所有方法及其标签信息
 *
 * @param classId 类的数据库ID
 * @returns 方法信息的对象映射
 */
const getMethods = async (classId: number) => {
    // 获取类的所有方法
    const methods = await MethodMeta.findAll({ where: { classId } });

    // 获取每个方法的标签信息
    const tags = await Promise.all(
        methods.map(async (m) => {
            const tags = await MethodTag.findAll({ where: { methodId: m.id } });

            // 获取标签的数据
            const tagData = await Promise.all(
                tags.map(async (t) =>
                    (
                        await MethodTagData.findAll({
                            where: {
                                tagId: t.id,
                            },
                            order: ['index'],
                        })
                    ).map((d) => d.value)
                )
            );

            return tags.map((t, i) => ({ name: t.name, data: tagData[i] }));
        })
    );

    // 将方法信息转换为对象映射
    return Object.assign({}, ...methods.map((m, i) => ({ [m.name]: { name: m.name, tags: tags[i] } })));
};

/**
 * 获取类的标签信息
 *
 * @param classId 类的数据库ID
 * @returns 标签信息数组
 */
const getClassTags = async (classId: number) => {
    const tags = await ClassTag.findAll({ where: { classId } });

    // 获取每个标签的数据
    const tagData = await Promise.all(
        tags.map(async (t) =>
            (
                await ClassTagData.findAll({
                    where: {
                        tagId: t.id,
                    },
                    order: ['index'],
                })
            ).map((d) => d.value)
        )
    );

    return tags.map((t, i) => ({ name: t.name, data: tagData[i] }));
};

/**
 * 标签信息接口
 */
export interface Tag {
    name: string; // 标签名称
    data: string[]; // 标签数据数组
}

/**
 * 完整类信息接口
 */
export interface FullClass {
    name: string; // 类名
    tags: Tag[]; // 类标签
    methods: Record<string, { name: string; tags: Tag[] }>; // 方法映射
}

/**
 * 获取类的完整继承链信息
 *
 * 从指定类开始，向上遍历继承链，获取所有父类的信息。
 * 使用visited集合避免循环继承的问题。
 *
 * @param classMeta 起始类的元数据
 * @returns 父类信息数组（从直接父类到根父类）
 */
const getParentChain = async (classMeta: ClassMeta) => {
    const result: FullClass[] = [];
    const visited = new Set<number>();

    // 向上遍历继承链
    while (classMeta.parentId && !visited.has(classMeta.parentId)) {
        visited.add(classMeta.parentId);
        const meta = await ClassMeta.findByPk(classMeta.parentId);
        if (!meta) {
            return result;
        }

        // 获取父类的完整信息
        result.push({
            name: meta.name,
            tags: await getClassTags(meta.id),
            methods: await getMethods(meta.id),
        });
        classMeta = meta;
    }
    return result;
};

/**
 * 获取指定文件中所有类的缓存信息
 *
 * @param file 文件路径
 * @returns 类缓存映射对象
 */
export const getClassCache = async (file: string) => {
    // 获取文件中的所有类
    const classes = await ClassMeta.findAll({ where: { file } });

    // 获取每个类的完整信息
    const cache = await Promise.all(
        classes.map(async (c) => ({
            [c.name]: {
                name: c.name,
                tags: await getClassTags(c.id),
                methods: await getMethods(c.id),
                parentChain: await getParentChain(c),
            },
        }))
    );

    // 将数组转换为对象映射
    return Object.assign({}, ...cache);
};
