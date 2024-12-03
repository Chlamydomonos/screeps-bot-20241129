import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from '@sequelize/core';
import { Attribute, AutoIncrement, HasMany, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { GlobalStatementTag } from './GlobalStatementTag';

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
