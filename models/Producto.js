const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    cantidad: {
        type: Number,
        required: true,
        min: 0
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    caracteristicas: {
        type: String,
        default: '',
        trim: true
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Producto = mongoose.model('Producto', productoSchema, 'tienda');

console.log('🧺 Modelo Producto creado, collection:', Producto.collection.name);

module.exports = Producto;
