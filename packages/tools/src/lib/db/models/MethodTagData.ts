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
