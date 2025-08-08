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
        // NO requerido aquí porque se calcula automáticamente
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
        required: false, // CORREGIDO: cambiar de '' a false
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] // Agregar cadena vacía como opción válida
    },
    alergias: {
        type: String,
        default: '',
        trim: true
    },
    servicios: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'Debe seleccionar al menos un servicio'
        },
        enum: ['Natación', 'Estimulación', 'Baby Spa', 'Paquete de Acuática Inicial y Estimulación temprana']
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

// Middleware para calcular la edad automáticamente ANTES de validar
pequeSchema.pre('validate', function(next) {
    console.log('Middleware pre-validate ejecutándose...');
    console.log('fechaNacimiento:', this.fechaNacimiento);
    
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
            this.edad = `${Math.max(meses, 1)} meses`;
        } else {
            this.edad = `${edad} años`;
        }
        
        console.log('Edad calculada:', this.edad);
    }
    next();
});

// También mantener el middleware pre-save como respaldo
pequeSchema.pre('save', function(next) {
    console.log('Middleware pre-save ejecutándose...');
    
    if (this.fechaNacimiento && !this.edad) {
        const hoy = new Date();
        const nacimiento = new Date(this.fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        
        if (edad === 0) {
            let meses = mes;
            if (hoy.getDate() < nacimiento.getDate()) {
                meses--;
            }
            if (meses <= 0) {
                meses = 12 + meses;
            }
            this.edad = `${Math.max(meses, 1)} meses`;
        } else {
            this.edad = `${edad} años`;
        }
        
        console.log('Edad calculada en pre-save:', this.edad);
    }
    next();
});

const Peque = mongoose.model('Peque', pequeSchema, 'peques');

console.log('Modelo Peque creado, collection:', Peque.collection.name);

module.exports = Peque;