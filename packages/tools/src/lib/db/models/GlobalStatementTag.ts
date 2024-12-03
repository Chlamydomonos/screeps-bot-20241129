import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from '@sequelize/core';
import { Attribute, AutoIncrement, BelongsTo, HasMany, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { GlobalStatement } from './GlobalStatement';
import { GlobalStatementTagData } from './GlobalStatementTagData';

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
