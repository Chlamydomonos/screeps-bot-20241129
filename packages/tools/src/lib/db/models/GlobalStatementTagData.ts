import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from '@sequelize/core';
import { Attribute, AutoIncrement, BelongsTo, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { GlobalStatementTag } from './GlobalStatementTag';

export class GlobalStatementTagData extends Model<
    InferAttributes<GlobalStatementTagData>,
    InferCreationAttributes<GlobalStatementTagData>
> {
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

    @BelongsTo(() => GlobalStatementTag, {
        foreignKey: 'tagId',
        targetKey: 'id',
        inverse: {
            as: 'data',
            type: 'hasMany',
        },
    })
    declare tag: NonAttribute<GlobalStatementTag>;

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare index: number;
}
