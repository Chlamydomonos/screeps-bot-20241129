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
import { ClassTag } from './ClassTag';

export class ClassMeta extends Model<InferAttributes<ClassMeta>, InferCreationAttributes<ClassMeta>> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare name: string;

    @Attribute(DataTypes.STRING)
    @NotNull
    declare file: string;

    @HasMany(() => MethodMeta, {
        foreignKey: 'classId',
        sourceKey: 'id',
        inverse: {
            as: 'class',
        },
    })
    declare methods?: NonAttribute<MethodMeta[]>;

    @Attribute(DataTypes.INTEGER)
    declare parentId?: CreationOptional<number>;

    @Attribute(DataTypes.BOOLEAN)
    @NotNull
    declare parentUnknown: boolean;

    @Attribute(DataTypes.STRING)
    declare expectedParent?: CreationOptional<string>;

    @Attribute(DataTypes.STRING)
    declare expectedParentFile?: CreationOptional<string>;

    @HasMany(() => ClassMeta, {
        foreignKey: 'parentId',
        sourceKey: 'id',
        inverse: {
            as: 'parent',
        },
    })
    declare children?: NonAttribute<ClassMeta[]>;

    @BelongsTo(() => ClassMeta, {
        foreignKey: 'parentId',
        targetKey: 'id',
        inverse: {
            as: 'children',
            type: 'hasMany',
        },
    })
    declare parent?: NonAttribute<ClassMeta>;

    @HasMany(() => ClassTag, {
        foreignKey: 'classId',
        sourceKey: 'id',
        inverse: {
            as: 'class',
        },
    })
    declare tags?: NonAttribute<ClassTag>;
}
