/**
 * 方法元数据模型
 *
 * 存储类方法的基本信息，包括方法名和所属类。
 * 与ClassMeta建立多对一关系，用于组织类的方法结构。
 */

import type { CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from '@sequelize/core';
import { DataTypes, Model } from '@sequelize/core';
import { Attribute, AutoIncrement, BelongsTo, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { ClassMeta } from './class-meta';

export class MethodMeta extends Model<InferAttributes<MethodMeta>, InferCreationAttributes<MethodMeta>> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare name: string;

    @BelongsTo(() => ClassMeta, {
        foreignKey: 'classId',
        targetKey: 'id',
        inverse: {
            as: 'methods',
            type: 'hasMany',
        },
    })
    declare class: NonAttribute<ClassMeta>;

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare classId: number;
}
