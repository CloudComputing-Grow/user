'use strict';

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        user_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },

        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        nickname: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        level: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        }
    }, {
        tableName: 'user',
        timestamps: false
    });

    User.associate = (models) => {
        User.hasMany(models.RefreshToken, {
            foreignKey: 'user_id',
            sourceKey: 'user_id',
            onDelete: 'CASCADE'
        });
    };

    return User;
};