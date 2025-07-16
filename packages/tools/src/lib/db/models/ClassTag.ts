/**
 * 类标签模型
 *
 * 存储类级别的标签信息，每个标签包含名称和关联的数据。
 * 标签用于为类添加元数据，支持代码生成和验证功能。
 */

import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from '@sequelize/core';
import { Attribute, AutoIncrement, BelongsTo, HasMany, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { ClassMeta } from './ClassMeta';
import { ClassTagData } from './ClassTagData';

export class ClassTag extends Model<InferAttributes<ClassTag>, InferCreationAttributes<ClassTag>> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare name: string;

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare classId: number;

    @BelongsTo(() => ClassMeta, {
        foreignKey: 'classId',
        targetKey: 'id',
        inverse: {
            as: 'tags',
            type: 'hasMany',
        },
    })
    declare class: NonAttribute<ClassMeta>;

    @HasMany(() => ClassTagData, {
        foreignKey: 'tagId',
        sourceKey: 'id',
        inverse: {
            as: 'tag',
        },
    })
    declare data?: NonAttribute<ClassTagData[]>;
}
