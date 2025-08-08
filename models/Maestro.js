const mongoose = require('mongoose');

const maestroSchema = new mongoose.Schema({
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
    celular: {
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
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Maestro = mongoose.model('Maestro', maestroSchema, 'maestros');

console.log('Modelo Maestro creado, collection:', Maestro.collection.name);

module.exports = Maestro;