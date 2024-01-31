const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const restaurantController = require('../controllers/restaurantController');
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/auth');

// Table routes
router.post('/add-table/:restaurantId',authMiddleware.auth, tableController.addTable);
router.get('/get-tables/:restaurantId',authMiddleware.auth, tableController.getTables);
router.get('/available-table', tableController.getAvailableTable);
router.delete('/delete-table/:restaurantId/:tableId',authMiddleware.auth, tableController.deleteTable);

// Restaurant routes
router.post('/register', restaurantController.register);
router.post('/login', restaurantController.login);
router.get('/restaurants', restaurantController.getRestaurants);
router.get('/restaurant/:restaurantId', restaurantController.getRestaurant);
router.patch('/update-restaurant/:restaurantId', authMiddleware.auth, restaurantController.updateRestaurant);
router.delete('/delete-restaurant/:restaurantId', authMiddleware.auth, restaurantController.deleteRestaurant);

// Reservation routes
router.post('/make-reservation/:restaurantId/:tableId', reservationController.makeReservation);
router.get('/get-reservation/:restaurantId/:reservationId',authMiddleware.auth, reservationController.getReservation);
router.get('/get-reservations/:restaurantId',authMiddleware.auth, reservationController.getReservations);


// Additional routes
router.get("/", (req, res) => {
    res.json({ msg: "restaurant work" });
});

module.exports = router;
