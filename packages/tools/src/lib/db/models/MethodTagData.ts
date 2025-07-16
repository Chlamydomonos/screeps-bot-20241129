/**
 * 方法标签数据模型
 *
 * 存储方法标签的具体数据值，支持有序的参数列表。
 * 通过index字段维护参数的顺序。
 */

import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from '@sequelize/core';
import { Attribute, AutoIncrement, BelongsTo, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { MethodTag } from './MethodTag';

export class MethodTagData extends Model<InferAttributes<MethodTagData>, InferCreationAttributes<MethodTagData>> {
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

    @BelongsTo(() => MethodTag, {
        foreignKey: 'tagId',
        targetKey: 'id',
        inverse: {
            as: 'data',
            type: 'hasMany',
        },
    })
    declare tag: NonAttribute<MethodTag>;

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare index: number;
}
