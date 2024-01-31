const express = require('express');
const router = express.Router();
const { RestaurantBookingSystem } = require('../models/RestaurantBookingSystem');
const { RestaurantModel, validateRestaurant } = require('../models/RestaurantModel');

const bookingSystem = new RestaurantBookingSystem();

router.get("/", (req, res) => {
  res.json({ msg: "resturant work" });
});

router.post('/add-table/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { capacity } = req.body;
    await bookingSystem.addTable(capacity, restaurantId);
    res.json({ message: 'Table added successfully' });
  } catch (error) {
    console.error('Error adding table:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/make-reservation/:restaurantId/:tableId', async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    const { customerName, reservationTime } = req.body;
    await bookingSystem.makeReservation(restaurantId, tableId, customerName, reservationTime);
    res.json({ message: 'Reservation successful' });
  } catch (error) {
    console.error('Error making reservation:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update the route definition to use query parameters
router.get('/available-tables', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const { date, time } = req.query;
    const availableTables = await bookingSystem.getAvailableTables(restaurantId, date, time);
    res.json(availableTables);
  } catch (error) {
    console.error('Error getting available tables:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/restaurants', async (req, res) => { 
  try {
    const restaurants = await RestaurantModel.find();
    res.json(restaurants);
  } catch (error) {
    console.error('Error getting restaurants:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/register', async (req, res) => {
  try {
      const { error } = validateRestaurant(req.body);
      if (error) {
          return res.status(400).json({ error: error.details[0].message });
      }

      const { name, email, address, phone, psw, hoursOfOperation } = req.body;

      // Check if the email is already in use
      const existingRestaurant = await RestaurantModel.findOne({ email });
      if (existingRestaurant) {
          return res.status(400).json({ error: 'Email is already in use' });
      }

      // Add the restaurant
      const newRestaurant = new RestaurantModel({
          name,
          email,
          address,
          phone,
          psw,
          hoursOfOperation,
      });
      await newRestaurant.save();

      res.status(201).json({ message: 'Restaurant registered successfully' });
  } catch (error) {
      console.error('Error in registration:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// login Route
router.post('/login', async (req, res) => {
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

      res.json({ token });
  } catch (error) {
      console.error('Error in login:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
