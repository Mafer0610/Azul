const mongoose = require('mongoose');

const pequeSchema = new mongoose.Schema({
    nombreCompleto: {
        type: String,
        required: true,
        trim: true
    },
    edad: {
        type: String,
        required: true,
        trim: true
    },
    comportamiento: {
        type: String,
        required: true,
        enum: ['neurotipico', 'neurodivergente']
    },
    caracteristicas: {
        type: String,
        default: '',
        trim: true
    },
    nombreTutor: {
        type: String,
        required: true,
        trim: true
    },
    celularTutor: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: 'El número de celular debe tener 10 dígitos'
        }
    },
    fechaPago: {
        type: Number,
        required: true,
        min: 1,
        max: 31
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Peque = mongoose.model('Peque', pequeSchema, 'peques');

console.log('Modelo Peque creado, collection:', Peque.collection.name);

module.exports = Peque;