/**
 * 全局语句模型
 *
 * 存储全局作用域中的语句信息，主要用于捕获带有特殊标签的语句。
 * 典型用法包括exportGlobal等全局声明语句。
 */

import type { CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from '@sequelize/core';
import { DataTypes, Model } from '@sequelize/core';
import { Attribute, AutoIncrement, HasMany, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { GlobalStatementTag } from './global-statement-tag';

export class GlobalStatement extends Model<InferAttributes<GlobalStatement>, InferCreationAttributes<GlobalStatement>> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare text: string;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare file: string;

    @HasMany(() => GlobalStatementTag, {
        foreignKey: 'globalStatementId',
        sourceKey: 'id',
        inverse: {
            as: 'globalStatement',
        },
    })
    declare tags?: NonAttribute<GlobalStatementTag>;
}
