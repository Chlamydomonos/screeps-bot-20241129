/**
 * 全局语句标签模型
 *
 * 存储全局语句的标签信息，如exportGlobal等特殊标记。
 * 用于标识需要特殊处理的全局语句。
 */

import type { CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from '@sequelize/core';
import { DataTypes, Model } from '@sequelize/core';
import { Attribute, AutoIncrement, BelongsTo, HasMany, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { GlobalStatement } from './global-statement';
import { GlobalStatementTagData } from './global-statement-tag-data';

export class GlobalStatementTag extends Model<
    InferAttributes<GlobalStatementTag>,
    InferCreationAttributes<GlobalStatementTag>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare name: string;

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare globalStatementId: number;

    @BelongsTo(() => GlobalStatement, {
        foreignKey: 'globalStatementId',
        targetKey: 'id',
        inverse: {
            as: 'tags',
            type: 'hasMany',
        },
    })
    declare globalStatement: NonAttribute<GlobalStatement>;

    @HasMany(() => GlobalStatementTagData, {
        foreignKey: 'tagId',
        sourceKey: 'id',
        inverse: {
            as: 'tag',
        },
    })
    declare data?: NonAttribute<GlobalStatementTagData[]>;
}
