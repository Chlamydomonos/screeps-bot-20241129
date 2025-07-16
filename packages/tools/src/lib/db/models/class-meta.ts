/**
 * 类元数据模型
 *
 * 这个模型存储TypeScript类的元数据信息，包括类名、文件位置和继承关系。
 * 是整个代码分析系统的核心数据结构，用于：
 * - 存储类的基本信息
 * - 维护类之间的继承关系
 * - 支持继承链的动态更新
 *
 * 继承关系处理：
 * - 当父类存在时，parentId指向父类记录
 * - 当父类暂未找到时，parentUnknown为true，expectedParent记录预期的父类名
 * - 支持跨文件的继承关系解析
 */

import type { CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from '@sequelize/core';
import { DataTypes, Model } from '@sequelize/core';
import { Attribute, AutoIncrement, BelongsTo, HasMany, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { MethodMeta } from './method-meta';
import { ClassTag } from './class-tag';

export class ClassMeta extends Model<InferAttributes<ClassMeta>, InferCreationAttributes<ClassMeta>> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare name: string;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare file: string;

    @HasMany(() => MethodMeta, {
        foreignKey: 'classId',
        sourceKey: 'id',
        inverse: {
            as: 'class',
        },
    })
    declare methods?: NonAttribute<MethodMeta[]>;

    @Attribute(DataTypes.INTEGER)
    declare parentId?: CreationOptional<number>;

    @Attribute(DataTypes.BOOLEAN)
    @NotNull
    declare parentUnknown: boolean;

    @Attribute(DataTypes.STRING)
    declare expectedParent?: CreationOptional<string>;

    @Attribute(DataTypes.STRING)
    declare expectedParentFile?: CreationOptional<string>;

    @HasMany(() => ClassMeta, {
        foreignKey: 'parentId',
        sourceKey: 'id',
        inverse: {
            as: 'parent',
        },
    })
    declare children?: NonAttribute<ClassMeta[]>;

    @BelongsTo(() => ClassMeta, {
        foreignKey: 'parentId',
        targetKey: 'id',
        inverse: {
            as: 'children',
            type: 'hasMany',
        },
    })
    declare parent?: NonAttribute<ClassMeta>;

    @HasMany(() => ClassTag, {
        foreignKey: 'classId',
        sourceKey: 'id',
        inverse: {
            as: 'class',
        },
    })
    declare tags?: NonAttribute<ClassTag>;
}
