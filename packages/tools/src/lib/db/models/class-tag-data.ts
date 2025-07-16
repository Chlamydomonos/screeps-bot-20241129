/**
 * 类标签数据模型
 *
 * 存储类标签的具体数据值，支持有序的参数列表。
 * 通过index字段维护参数的顺序。
 */

import type { CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from '@sequelize/core';
import { DataTypes, Model } from '@sequelize/core';
import { Attribute, AutoIncrement, BelongsTo, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { ClassTag } from './class-tag';

export class ClassTagData extends Model<InferAttributes<ClassTagData>, InferCreationAttributes<ClassTagData>> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare value: string;

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare tagId: number;

    @BelongsTo(() => ClassTag, {
        foreignKey: 'tagId',
        targetKey: 'id',
        inverse: {
            as: 'data',
            type: 'hasMany',
        },
    })
    declare tag: NonAttribute<ClassTag>;

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare index: number;
}
