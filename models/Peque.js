const mongoose = require('mongoose');

const pequeSchema = new mongoose.Schema({
    nombreCompleto: {
        type: String,
        required: true,
        trim: true
    },
    fechaNacimiento: {
        type: Date,
        required: true
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
    tipoSangre: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    alergias: {
        type: String,
        default: '',
        trim: true
    },
    servicio: {
        type: String,
        required: true,
        enum: ['Natación', 'Estimulación', 'Baby Spa', 'Paquete de Acuática Inicial', 'Estimulación temprana']
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
    correoTutor: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'El correo electrónico no es válido'
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

// Middleware para calcular la edad automáticamente
pequeSchema.pre('save', function(next) {
    if (this.fechaNacimiento) {
        const hoy = new Date();
        const nacimiento = new Date(this.fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        
        // Si es menor de 1 año, calcular en meses
        if (edad === 0) {
            let meses = mes;
            if (hoy.getDate() < nacimiento.getDate()) {
                meses--;
            }
            if (meses <= 0) {
                meses = 12 + meses;
            }
            this.edad = `${meses} meses`;
        } else {
            this.edad = `${edad} años`;
        }
    }
    next();
});

const Peque = mongoose.model('Peque', pequeSchema, 'peques');

console.log('Modelo Peque creado, collection:', Peque.collection.name);

module.exports = Peque;