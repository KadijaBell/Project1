// 'use strict';
// const { Model } = require('sequelize');
// module.exports = (sequelize, DataTypes) => {
//   class Booking extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       Booking.belongsTo(models.User, { foreignKey: "userId" , onDelete: 'CASCADE' });
//       Booking.belongsTo(models.Spot, { foreignKey: "spotId" , onDelete: 'CASCADE' });
//     }
//   }
//   Booking.init({
//     spotId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "Spot",
//         key: "id"
//       },
//       onDelete: 'CASCADE'
//     },
//     userId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "User",
//         key: "id"
//       },
//       onDelete: 'CASCADE'
//     },
//     startDate: {
//       type: DataTypes.DATE,
//       allowNull: false
//     },
//     endDate: {
//       type: DataTypes.DATE,
//       allowNull: false
//     }
//   }, {
//     sequelize,
//     modelName: 'Booking',
//   });
//   return Booking;
// };
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // Booking belongs to a user and a spot
      Booking.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
      Booking.belongsTo(models.Spot, { foreignKey: 'spotId', onDelete: 'CASCADE' });
    }
  }

  Booking.init({
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references:{
        model: "Spots",
        key: "id"
      },
      onDelete: "CASCADE",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references:{
        model: "Users",
        key: "id"
      },
      onDelete: "CASCADE",
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Booking'
  });

  return Booking;
};
