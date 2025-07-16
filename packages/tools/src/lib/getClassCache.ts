import { createDB } from './db/db';
import { ClassMeta } from './db/models/ClassMeta';
import { ClassTag } from './db/models/ClassTag';
import { ClassTagData } from './db/models/ClassTagData';
import { MethodMeta } from './db/models/MethodMeta';
import { MethodTag } from './db/models/MethodTag';
import { MethodTagData } from './db/models/MethodTagData';

const getMethods = async (classId: number) => {
    const methods = await MethodMeta.findAll({ where: { classId } });

    const tags = await Promise.all(
        methods.map(async (m) => {
            const tags = await MethodTag.findAll({ where: { methodId: m.id } });

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

    return Object.assign({}, ...methods.map((m, i) => ({ [m.name]: { name: m.name, tags: tags[i] } })));
};

const getClassTags = async (classId: number) => {
    const tags = await ClassTag.findAll({ where: { classId } });

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

export interface Tag {
    name: string;
    data: string[];
}

export interface FullClass {
    name: string;
    tags: Tag[];
    methods: Record<string, { name: string; tags: Tag[] }>;
}

const getParentChain = async (classMeta: ClassMeta) => {
    const result: FullClass[] = [];
    const visited = new Set<number>();

    while (classMeta.parentId && !visited.has(classMeta.parentId)) {
        visited.add(classMeta.parentId);
        const meta = await ClassMeta.findByPk(classMeta.parentId);
        if (!meta) {
            return result;
        }
        result.push({
            name: meta.name,
            tags: await getClassTags(meta.id),
            methods: await getMethods(meta.id),
        });
        classMeta = meta;
    }
    return result;
};

export const getClassCache = async (file: string) => {
    const classes = await ClassMeta.findAll({ where: { file } });
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
    return Object.assign({}, ...cache);
};
