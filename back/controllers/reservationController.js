const {
  ReservationModel,
  validateReservation,
} = require("../models/ReservationModel");
const {
  RestaurantModel,
  validateRestaurant,
} = require("../models/RestaurantModel");
const { TableModel, validateTable } = require("../models/TableModel");

const reservationController = {
  makeReservation: async (req, res) => {
    try {
      const { restaurantId, tableId } = req.params;
      const { customerName, reservationTime, seats, phone } = req.body;

      const restaurant = await RestaurantModel.findById(restaurantId);
      const table = await TableModel.findById(tableId);

      console.log("restaurant:", restaurant);
      console.log("table:", table);
      if (restaurant && table) {
        // Check if the reservationTime is a valid date
        const desiredDateTime = new Date(reservationTime);
        if (isNaN(desiredDateTime)) {
          console.log("Invalid date or time format.");
          return res
            .status(400)
            .json({ error: "Invalid date or time format." });
        }

        // Check if the table is available at the specified time
        const reservationEnd = new Date(
          desiredDateTime.getTime() + 1 * 60 * 60 * 1000
        );
        const overlappingReservations = table.resDates.filter(
          (reservation) =>
            desiredDateTime >= reservation.start &&
            desiredDateTime <= reservation.end
        );

        if (overlappingReservations.length === 0) {
          // Table is available, make reservation
          console.log("1" + reservationTime);
          table.resDates.push({ start: desiredDateTime, end: reservationEnd });
          await table.save();

          // Save the reservation in the ReservationModel
          const newReservation = new ReservationModel({
            restaurantId,
            tableId,
            customerName,
            reservationTime,
            seats,
            phone,
          });
          if (validateReservation(newReservation)) {
            await newReservation.save();
          } else {
            return res.status(400).json({ error: "Invalid reservation" });
          }
          // Update the restaurant with the new table
          const updatedRestaurant = await RestaurantModel.findByIdAndUpdate(
            restaurantId,
            {
              $push: { reservations: newReservation._id },
            },
            { new: true }
          );
          console.log(
            `Reservation for Table ${table.tableNumber} at ${reservationTime} for ${customerName} successful.`
          );
          return res.json({ message: "Reservation successful" });
        } else {
          console.log(
            `Table ${table.tableNumber} is already reserved at ${reservationTime}.`
          );
          return res.status(400).json({ error: "Table is already reserved" });
        }
      } else {
        console.log(`Restaurant or Table does not exist.`);
        return res
          .status(404)
          .json({ error: "Restaurant or Table does not exist." });
      }
    } catch (error) {
      console.error("Error making reservation:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getReservations: async (req, res) => {
    try {
      const { restaurantId } = req.params;

      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const reservations = await ReservationModel.find({
        _id: { $in: restaurant.reservations },
      });

      return res.json(reservations);
    } catch (error) {
      console.error("Error getting reservations:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getReservation: async (req, res) => {
    try {
      const { restaurantId, reservationId } = req.params;

      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const reservation = await ReservationModel.findOne({
        _id: reservationId,
        restaurantId: restaurantId,
      });

      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      return res.json(reservation);
    } catch (error) {
      console.error("Error getting reservation:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = reservationController;
