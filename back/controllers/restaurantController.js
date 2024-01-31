// const { table } = require('console');
const { RestaurantModel, validateRestaurant } = require('../models/RestaurantModel');
const { TableModel } = require('../models/TableModel');
const { ReservationModel } = require('../models/ReservationModel');
const { restart } = require('nodemon');

const restaurantController = {
    register: async (req, res) => {
        try {
          const {
            name,
            email,
            address,
            phone,
            psw,
            image,
            limitedSeats,
            openingHour,
            closingHour,
          } = req.body;
          console.log(req.body);
          if (!name || !email || !address || !phone || !psw || !limitedSeats || !openingHour || !closingHour) {
            return res.status(400).json({ error: 'Missing required fields' });
          }
      
          if (!openingHour || !closingHour) {
            return res.status(400).json({ error: 'Invalid hoursOfOperation format' });
          }
      
          const date = new Date().toISOString().slice(0, 10);
          const openingHourD = new Date(`${date}T${openingHour}`);
          const closingHourD = new Date(`${date}T${closingHour}`);
      
          if (isNaN(openingHourD) || isNaN(closingHourD)) {
            throw new Error('Invalid date or time format.');
          }
      
          const existingRestaurant = await RestaurantModel.findOne({ email });
          if (existingRestaurant) {
            return res.status(400).json({ error: 'Email is already in use' });
          }
      
          const newRestaurant = new RestaurantModel({
            name,
            email,
            address,
            phone,
            psw,
            img_url: image,
            limitedSeats,
            hoursOfOperation: {
              openingHour: openingHourD,
              closingHour: closingHourD,
            },
          });
          await newRestaurant.save();
      
          res.status(201).json({ message: 'Restaurant registered successfully' });
        } catch (error) {
          console.error('Error in registration:', error.message);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      },
      
    login: async (req, res) => {
        try {
            const { email, psw } = req.body;
      
            // Check if the email exists
            const restaurant = await RestaurantModel.findOne({ email }).select('psw');
            if (!restaurant) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
      
            // Check if the password is correct
            const passwordMatch = await restaurant.checkPassword(psw);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
      
            // Generate a JWT token
            const token = restaurant.generateAuthToken();
      
            res.json({ token, restaurantId: restaurant._id });
        }catch (error) {
            console.error('Error in login:', error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    getRestaurants: async (req, res) => {
        try {
            const restaurants = await RestaurantModel.find();
            res.json(restaurants);
        } catch (error) {
            console.error('Error getting restaurants:', error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    getRestaurant: async (req, res) => {
        try {
            const { restaurantId } = req.params;
            const restaurant = await RestaurantModel.findById(restaurantId);
            if (!restaurant) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            res.json(restaurant);
            
        } catch (error) {
            console.error('Error getting restaurant:', error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    deleteRestaurant: async (req, res) => {
        try {
            const { restaurantId } = req.params;
    
            // Find and delete the restaurant by ID
            const restaurant = await RestaurantModel.findOneAndDelete({ _id: restaurantId });
    
            if (!restaurant) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
    
            // Delete associated tables
            for (const tableId of restaurant.tables) {
                const table = await TableModel.findOneAndDelete({ _id: tableId });
    
                if (!table) {
                    console.log(`Table not found for ID: ${tableId}`);
                    // Handle the case where a table is not found (optional)
                } else {
                    console.log(`Table ${table.tableNumber} deleted successfully.`);
                }
            }

            // Delete associated reservations
            for (const reservationId of restaurant.reservations) {
                const reservation = await ReservationModel.findOneAndDelete({ _id: reservationId });
    
                if (!reservation) {
                    console.log(`Table not found for ID: ${reservationId}`);
                    // Handle the case where a table is not found (optional)
                } else {
                    console.log(`Table ${reservation.reservationId} deleted successfully.`);
                }
            }
    
            console.log(`Restaurant deleted successfully.`);
            res.json({ message: 'Restaurant deleted successfully' });
        } catch (error) {
            console.error('Error deleting restaurant:', error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    
    updateRestaurant: async (req, res, next) => {
        const { restaurantId } = req.params;
        const { name, email, address, phone, limitedSeats, hoursOfOperation} = req.body;
        const date = new Date().toISOString().slice(0, 10);
        console.log("date " + date);
    
        const openingHourD = new Date(`${date}T${hoursOfOperation.openingHour}`);
        const closingHourD = new Date(`${date}T${hoursOfOperation.closingHour}`);
        console.log("opening hours", openingHourD, "closing hours", closingHourD);
    
        if (isNaN(openingHourD.getTime()) || isNaN(closingHourD.getTime())) {
            throw new Error('Invalid date or time format.');
        }
    
        try {
            const updatedRestaurant = await RestaurantModel.findByIdAndUpdate(
                { _id: restaurantId },
                {
                    name,
                    email,
                    address,
                    phone,
                    limitedSeats,
                    hoursOfOperation: {
                        openingHour: openingHourD,
                        closingHour: closingHourD,
                    },
                },
                {
                    new: true,
                }
            );
    
            if (!updatedRestaurant) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
    
            res.status(200).json("updeted restaurant successfully");
        } catch (err) {
            return next(err);
        }
    },
    
};

module.exports = restaurantController;
