const mongoose = require('mongoose');

const pequeSchema = new mongoose.Schema({
    nombreCompleto: {
        type: String,
        required: true,
        trim: true
    },
    fechaNacimiento: {
        type: Date,
        required: false
    },
    edad: {
        type: String,
        trim: true
    },
    comportamiento: {
        type: String,
        required: false,
        enum: ['neurotipico', 'neurodivergente', '']
    },
    caracteristicas: {
        type: String,
        default: '',
        trim: true
    },
    tipoSangre: {
        type: String,
        required: false,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
    },
    alergias: {
        type: String,
        default: '',
        trim: true
    },
    servicios: {
        type: [String],
        required: false,
        validate: {
            validator: function(v) {
                return true;
            },
            message: 'Debe seleccionar al menos un servicio'
        },
        enum: ['Natación', 'Estimulación', 'Baby Spa', 'Paquete de Acuática Inicial y Estimulación temprana', 'Lenguaje']
    },
    nombreTutor1: {
        type: String,
        required: false,
        trim: true
    },
    celularTutor1: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v || v === '') return true;
                return /^\d{10}$/.test(v);
            },
            message: 'El número de celular del tutor 1 debe tener 10 dígitos'
        }
    },
    correoTutor1: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v || v === '') return true;
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'El correo electrónico del tutor 1 no es válido'
        }
    },
    nombreTutor2: {
        type: String,
        required: false,
        trim: true
    },
    celularTutor2: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v || v === '') return true;
                return /^\d{10}$/.test(v);
            },
            message: 'El número de celular del tutor 2 debe tener 10 dígitos'
        }
    },
    correoTutor2: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v || v === '') return true;
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'El correo electrónico del tutor 2 no es válido'
        }
    },
    fechaPago: {
        type: Number,
        required: false,
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
    } else {
        this.edad = '';
    }
    next();
});

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