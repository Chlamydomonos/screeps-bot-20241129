import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from '@sequelize/core';
import { Attribute, AutoIncrement, BelongsTo, NotNull, PrimaryKey } from '@sequelize/core/decorators-legacy';
import { ClassMeta } from './ClassMeta';

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
