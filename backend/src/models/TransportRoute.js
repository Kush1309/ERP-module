const mongoose = require('mongoose');

const transportRouteSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Route name is required'],
            trim: true,
            unique: true,
            minLength: [1, 'Route name cannot be empty']
        },
        vehicleNumber: {
            type: String,
            required: [true, 'Vehicle number is required'],
            trim: true,
            minLength: [1, 'Vehicle number cannot be empty']
        },
        driverName: {
            type: String,
            required: [true, 'Driver name is required'],
            trim: true,
            minLength: [1, 'Driver name cannot be empty']
        },
        capacity: {
            type: Number,
            required: [true, 'Capacity is required'],
            min: [0, 'Capacity cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value for capacity'
            }
        },
        stops: {
            type: [
                {
                    type: String,
                    trim: true,
                    minLength: [1, 'Stop name cannot be empty']
                }
            ],
            required: [true, 'Stops array is required'],
            validate: {
                validator: function (v) {
                    return Array.isArray(v) && v.length > 0 && v.every(stop => typeof stop === 'string' && stop.trim().length > 0);
                },
                message: 'Stops array must contain at least one valid string stop'
            }
        }
    },
    {
        timestamps: true
    }
);

transportRouteSchema.index({ name: 1 }, { unique: true });

const TransportRoute = mongoose.model('TransportRoute', transportRouteSchema);

module.exports = TransportRoute;
