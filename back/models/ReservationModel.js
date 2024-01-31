const mongoose = require("mongoose");
const Joi = require("joi");

const reservationSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    minlength: 5,
    maxlength: 20,
    required: true,
},
  seats: {
    type: Number,
    min: 1,
    required: true,
  },
  reservationTime: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const ReservationModel = mongoose.model("Reservation", reservationSchema);

function validateReservation(reservation) {
  const schema = Joi.object({
    restaurantId: Joi.string().required(),
    tableId: Joi.string().required(),
    customerName: Joi.string().required(),
    phone: Joi.string().min(5).max(20),
    seats: Joi.number().required(),
    reservationTime: Joi.date().required(),
  });

  return schema.validate(reservation);
}

module.exports = {
  ReservationModel,
  validateReservation,
};
