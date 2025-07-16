/**
 * 方法标签模型
 *
 * 存储方法级别的标签信息，用于为方法添加元数据。
 * 支持代码生成和验证功能。
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
import { MethodMeta } from './MethodMeta';
import { MethodTagData } from './MethodTagData';

export class MethodTag extends Model<InferAttributes<MethodTag>, InferCreationAttributes<MethodTag>> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare name: string;

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare methodId: number;

    @BelongsTo(() => MethodMeta, {
        foreignKey: 'methodId',
        targetKey: 'id',
        inverse: {
            as: 'tags',
            type: 'hasMany',
        },
    })
    declare method: NonAttribute<MethodMeta>;

    @HasMany(() => MethodTagData, {
        foreignKey: 'tagId',
        sourceKey: 'id',
        inverse: {
            as: 'tag',
        },
    })
    declare data?: NonAttribute<MethodTagData[]>;
}
