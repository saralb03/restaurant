const mongoose = require('mongoose');
const Joi = require('joi');

const tableSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    tableNumber: {
        type: Number,
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
    },
    resDates: [
        {
            type: Object,
            required: true,
        }
    ]
});

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

const TableModel = mongoose.model('Table', tableSchema);

// Validation function can be updated accordingly
function validateTable(table) {
    const schema = Joi.object({
        restaurantId: Joi.string().required(),
        capacity: Joi.number().required(),
        resDates: Joi.array().items(Joi.date()).required(),
    });

    return schema.validate(table);
}

module.exports = {
    TableModel,
    validateTable,
};
