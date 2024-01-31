const mongoose = require('mongoose');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { config } = require('../config/secret');

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 99,
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        minlength: 5,
        maxlength: 255,
    },
    address: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
    },
    phone: {
        type: String,
        minlength: 5,
        maxlength: 20,
    },
    psw: {
        type: String,
        minlength: 5,
        maxlength: 20,
        select: false,
    },
    img_url: {
        type: String,
        minlength: 2,
        maxlength: 99,
        default: null,
    },
    capacity:{
        type: Number,
        required: false,
    },
    limitedSeats:{
        type: Number,
        required: true,
    },
    tables: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table'
    }],
    reservations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation'
    }],
    hoursOfOperation: {
        openingHour: {
            type: Date,
            required: true,
        },
        closingHour: {
            type: Date,
            required: true,
        },
    },
});

// Pre-save hook to hash the password
restaurantSchema.pre('save', async function (next) {
    if (!this.isModified('psw')) return next();
    this.psw = await bcrypt.hash(this.psw, 12);
    next();
});

//check the password
restaurantSchema.methods.checkPassword = async function (password) {
    return await bcrypt.compare(password, this.psw);
};

//generate a JWT token
restaurantSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, config.tokenSecret);
    return token;
};

// Pre-remove hook to delete associated tables
restaurantSchema.pre('remove', async function (next) {
    try {
        // Use the TableModel to delete tables associated with this restaurant
        await TableModel.deleteMany({ _id: { $in: this.tables } });
        next();
    } catch (error) {
        next(error);
    }
});

// Custom method to set opening and closing hours from a string
restaurantSchema.methods.setOpeningHoursFromString = function (hoursString) {
    const [opening, closing] = hoursString.split(' - ');

    // Extract hours and set them in the schema
    this.hoursOfOperation.openingHour = parseInt(opening.split(':')[0], 10);
    this.hoursOfOperation.closingHour = parseInt(closing.split(':')[0], 10);
};

const RestaurantModel = mongoose.model('Restaurant', restaurantSchema);

function validateRestaurant(restaurant) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(99).required(),
        email: Joi.string().email({ tlds: { allow: ['com', 'net', 'org'] } }).error(() => Error('Email is not valid')).required(),
        address: Joi.string().min(5).max(255).required(),
        phone: Joi.string().min(5).max(20),
        psw: Joi.string()
            .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/)
            .required()
            .messages({
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
            }),
        limitedSeats: Joi.number().min(0).required(),
        hoursOfOperation: Joi.object({
            openingHour: Joi.date().min(0).max(23).required(),
            closingHour: Joi.date().min(0).max(23).required(),
        }).required(),
    });

    return schema.validate(restaurant);
}

module.exports = {
    RestaurantModel,
    validateRestaurant,
};
