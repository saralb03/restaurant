const { RestaurantModel } = require("../models/RestaurantModel");
const { TableModel, validateTable } = require("../models/TableModel");

const tableController = {
  getTables: async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      const tables = await TableModel.find({
        _id: { $in: restaurant.tables },
      });
      return res.json(tables);
    } catch (error) {
      console.error("Error getting tables:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  addTable: async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const { capacity } = req.body;
      const restaurant = await RestaurantModel.findById(restaurantId);

      if (!restaurant) {
        console.log(`Restaurant with ID ${restaurantId} does not exist.`);
        return res.status(404).json({ error: "Restaurant not found" });
      }

      // Calculate the new tableNumber based on the length of the tables array
      const tableNumber = restaurant.tables.length + 1;
      console.log(restaurant.tables.length);
      console.log(restaurant.tables);
      // Create a new table
      const newTable = new TableModel({
        capacity,
        restaurantId,
        tableNumber,
      });
      if (validateTable(newTable)) {
        // Save the new table
        await newTable.save();
      } else {
        return res.status(400).json({ error: "Invalid table" });
      }

      // Update the restaurant with the new table
      const updatedRestaurant = await RestaurantModel.findByIdAndUpdate(
        restaurantId,
        {
          $inc: { capacity: capacity },
          $push: { tables: newTable._id },
        },
        { new: true }
      );

      console.log(
        `Table ${newTable.tableNumber} with capacity ${capacity} added successfully.`
      );
      res.json({ message: "Table added successfully" });
    } catch (error) {
      console.error("Error adding table:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getAvailableTable: async (req, res) => {
    try {
      const { restaurantId, date, time, seats } = req.query;
      console.log(req.query);
      // Validate date and time
      const reservationDateTime = new Date(`${date}T${time}`);
      if (isNaN(reservationDateTime)) {
        throw new Error("Invalid date or time format.");
      }

      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      const openHour = restaurant.hoursOfOperation.openingHour.getHours();
      const closeHour = restaurant.hoursOfOperation.closingHour.getHours();
      const openMinute = restaurant.hoursOfOperation.openingHour.getMinutes();
      const closeMinute = restaurant.hoursOfOperation.closingHour.getMinutes();
      // const reservationHour = reservationDateTime.getHours();

      //check the opening and closing hours of the restaurant
      if (
        reservationDateTime.getHours() >= closeHour ||
        reservationDateTime.getHours() < openHour
      ) {
        return res.status(400).json({
          error: `The requested time is outside the opening and closing hours of the restaurant. Please contact us on ${restaurant.phone}`,
        });
      }
      if (reservationDateTime.getHours() == openHour) {
        if (reservationDateTime.getMinutes() < openMinute) {
          return res.status(400).json({
            error: `The requested time is outside the opening hour of the restaurant. Please contact us on ${restaurant.phone}`,
          });
        }
      }
      if (reservationDateTime.getHours() == closeHour - 1) {
        if (reservationDateTime.getMinutes() > closeMinute) {
          return res.status(400).json({
            error: `The requested time is outside the closing hour of the restaurant. Please contact us on ${restaurant.phone}`,
          });
        }
      }
      // check if the reservation is not more seats than the restaurant's seats
      if (restaurant.limitedSeats < seats) {
        return res.status(400).json({
          error: `More seats than the limited amount of seats. Please contact us on ${restaurant.phone}`,
        });
      }

      // Find all available tables
      const availableTables = await TableModel.find({
        restaurantId,
        capacity: { $gte: seats }, // Filter by minimum required seats
        $or: [
          { resDates: { $size: 0 } }, // Tables with no reservations
          { resDates: { $nin: [reservationDateTime] } }, // Tables without the specified date
        ],
      });

      // Filter tables based on overlapping reservations
      const filteredTables = availableTables.filter((table) => {
        const overlappingReservations = table.resDates.filter(
          (reservation) =>
            reservationDateTime >= reservation.start &&
            reservationDateTime <= reservation.end
        );

        return overlappingReservations.length === 0;
      });

      // Find the table with the smallest amount of seats but enough for the requested number of seats
      let selectedTable = null;
      let minSeats = Infinity;

      filteredTables.forEach((table) => {
        if (table.capacity >= seats && table.capacity < minSeats) {
          minSeats = table.capacity;
          selectedTable = table;
        }
      });
      console.log(selectedTable);
      if (selectedTable) {
        return res.json({
          tableNumber: selectedTable.tableNumber,
          capacity: selectedTable.capacity,
          id: selectedTable._id,
        });
      } else {
        return res.status(404).json({
          error: "No available table with sufficient capacity found.",
        });
      }
    } catch (error) {
      console.error("Error getting available table:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  deleteTable: async (req, res) => {
    try {
      const { restaurantId, tableId } = req.params;
      const restaurant = await RestaurantModel.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const table = await TableModel.findOneAndDelete({ _id: tableId });
      const tableNumber = table.tableNumber;
      console.log(table);
      if (!table) {
        return res.status(404).json({ error: "Table not found" });
      }
      // Remove the deleted table ID from the restaurant's tables array
      restaurant.tables = restaurant.tables.filter(
        (id) => id.toString() !== tableId
      );

      await restaurant.save();
      console.log(`Table ${tableNumber} deleted successfully.`);
      res.json({ message: `Table ${tableNumber} deleted successfully` });
    } catch (error) {
      console.error("Error deleting table:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = tableController;
