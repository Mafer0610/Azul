// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const pequesRoutes = require('./routes/peques');
const Peque = require('./models/Peque');
const maestroRoutes = require('./routes/maestros');
const Maestro = require('./models/Maestro');
const productoRoutes = require('./routes/productos');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/auth', authRoutes);
app.use('/peques', pequesRoutes);
app.use('/maestros', maestroRoutes);
app.use('/productos', productoRoutes);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Conectado a MongoDB Atlas');
    console.log('Base de datos:', mongoose.connection.db.databaseName);
})
.catch(err => {
    console.error('Error de conexión a MongoDB:', err);
    process.exit(1);
});

// Esquema y modelo para eventos
const eventoSchema = new mongoose.Schema({
    fecha: { type: String, required: true },
    time: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' }
});

const Evento = mongoose.model('Evento', eventoSchema, 'actividades');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Obtener todos los eventos
app.get('/api/eventos', async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        let query = {};
        
        if (fechaInicio && fechaFin) {
            query.fecha = {
                $gte: fechaInicio,
                $lte: fechaFin
            };
        }
        
        const eventos = await Evento.find(query).sort({ fecha: 1, time: 1 });
        
        const eventosAgrupados = {};
        eventos.forEach(evento => {
            if (!eventosAgrupados[evento.fecha]) {
                eventosAgrupados[evento.fecha] = [];
            }
            eventosAgrupados[evento.fecha].push({
                _id: evento._id,
                time: evento.time,
                title: evento.title,
                description: evento.description
            });
        });
        
        res.json(eventosAgrupados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un evento
app.post('/api/eventos', async (req, res) => {
    try {
        const { fecha, time, title, description } = req.body;
        if (!fecha || !time || !title) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        const nuevoEvento = new Evento({ fecha, time, title, description });
        await nuevoEvento.save();
        res.status(201).json(nuevoEvento);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar evento por id
app.put('/api/eventos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, time, title, description } = req.body;
        const eventoActualizado = await Evento.findByIdAndUpdate(
            id,
            { fecha, time, title, description },
            { new: true, runValidators: true }
        );
        if (!eventoActualizado) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.json(eventoActualizado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar evento por id
app.delete('/api/eventos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await Evento.findByIdAndDelete(id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.json({ message: 'Evento eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta de health check (agregar antes del PORT)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Servicios permitidos
const serviciosPermitidos = ['Natación', 'Estimulación', 'Baby Spa', 'Paquete de Acuática Inicial y Estimulación temprana'];

// Crear
app.post('/api/peques', async (req, res) => {
    try {
        console.log('=== INICIO REGISTRO PEQUE ===');
        console.log('Datos recibidos:', req.body);
        
        const { 
            nombreCompleto, 
            fechaNacimiento,
            comportamiento, 
            caracteristicas, 
            tipoSangre,
            alergias,
            servicios,
            nombreTutor, 
            celularTutor, 
            correoTutor,
            fechaPago 
        } = req.body;
        
        // Validaciones básicas
        if (!nombreCompleto || !fechaNacimiento || !comportamiento|| 
            !servicios || !nombreTutor || !celularTutor || !correoTutor || !fechaPago) {
            console.log('❌ Faltan campos obligatorios');
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Validar que servicios sea un array y tenga al menos un elemento
        if (!Array.isArray(servicios) || servicios.length === 0) {
            console.log('❌ Servicios inválidos:', servicios);
            return res.status(400).json({ error: 'Debe seleccionar al menos un servicio' });
        }

        // Validar que todos los servicios están permitidos
        const serviciosInvalidos = servicios.filter(servicio => !serviciosPermitidos.includes(servicio));
        if (serviciosInvalidos.length > 0) {
            console.log('❌ Servicios no válidos:', serviciosInvalidos);
            return res.status(400).json({ 
                error: `Servicios no válidos: ${serviciosInvalidos.join(', ')}` 
            });
        }

        // Validación de fecha de pago
        if (fechaPago < 1 || fechaPago > 31) {
            return res.status(400).json({ error: 'La fecha de pago debe estar entre 1 y 31' });
        }

        // Validación de fecha de nacimiento
        const fechaNac = new Date(fechaNacimiento);
        const hoy = new Date();
        if (fechaNac > hoy) {
            return res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
        }

        console.log('✅ Validaciones básicas pasadas');

        // Verificar si ya existe un peque con el mismo nombre
        const existePeque = await Peque.findOne({ 
            nombreCompleto: nombreCompleto.trim(),
            activo: true 
        });
        
        if (existePeque) {
            console.log('❌ Ya existe peque con ese nombre');
            return res.status(400).json({ error: 'Ya existe un niño registrado con ese nombre' });
        }

        console.log('✅ Nombre único verificado');

        // Crear el objeto sin incluir edad (se calculará automáticamente)
        const pequeData = {
            nombreCompleto: nombreCompleto.trim(),
            fechaNacimiento: new Date(fechaNacimiento),
            comportamiento,
            caracteristicas: caracteristicas?.trim() || '',
            tipoSangre: tipoSangre?.trim() || '',
            alergias: alergias?.trim() || '',
            servicios,
            nombreTutor: nombreTutor.trim(),
            celularTutor: celularTutor.trim(),
            correoTutor: correoTutor.trim(),
            fechaPago: parseInt(fechaPago)
        };

        console.log('Datos para crear Peque:', pequeData);

        const nuevoPeque = new Peque(pequeData);
        console.log('Peque creado (antes de save):', nuevoPeque);

        const savedPeque = await nuevoPeque.save();
        console.log('✅ Peque guardado exitosamente:', savedPeque);
        
        res.status(201).json({ 
            message: 'Niño registrado exitosamente',
            peque: savedPeque 
        });

    } catch (error) {
        console.error('❌ ERROR completo al guardar peque:', error);
        console.error('Stack trace:', error.stack);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Errores de validación:', messages);
            res.status(400).json({ error: messages.join(', ') });
        } else if (error.code === 11000) {
            console.error('Error de duplicado:', error);
            res.status(400).json({ error: 'Ya existe un niño con esos datos' });
        } else {
            console.error('Error genérico:', error.message);
            res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
        }
    }
});

// Actualizar
app.put('/api/peques/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nombreCompleto, 
            fechaNacimiento,
            comportamiento, 
            caracteristicas, 
            tipoSangre,
            alergias,
            servicios,
            nombreTutor, 
            celularTutor, 
            correoTutor,
            fechaPago 
        } = req.body;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'ID no válido' });
        }
        
        if (!nombreCompleto || !fechaNacimiento || !comportamiento || 
            !servicios || !nombreTutor || !celularTutor || !correoTutor || !fechaPago) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (!Array.isArray(servicios) || servicios.length === 0) {
            return res.status(400).json({ error: 'Debe seleccionar al menos un servicio' });
        }

        // Validar que todos los servicios están permitidos
        const serviciosInvalidos = servicios.filter(servicio => !serviciosPermitidos.includes(servicio));
        if (serviciosInvalidos.length > 0) {
            return res.status(400).json({ 
                error: `Servicios no válidos: ${serviciosInvalidos.join(', ')}` 
            });
        }

        if (!/^\d{10}$/.test(celularTutor)) {
            return res.status(400).json({ error: 'El celular debe tener exactamente 10 dígitos' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoTutor)) {
            return res.status(400).json({ error: 'El formato del correo electrónico no es válido' });
        }

        if (fechaPago < 1 || fechaPago > 31) {
            return res.status(400).json({ error: 'La fecha de pago debe estar entre 1 y 31' });
        }

        const fechaNac = new Date(fechaNacimiento);
        const hoy = new Date();
        if (fechaNac > hoy) {
            return res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
        }

        const updatedPeque = await Peque.findByIdAndUpdate(
            id,
            {
                nombreCompleto: nombreCompleto.trim(),
                fechaNacimiento: new Date(fechaNacimiento),
                comportamiento,
                caracteristicas: caracteristicas?.trim() || '',
                tipoSangre: tipoSangre?.trim() || '',
                alergias: alergias?.trim() || '',
                servicios,
                nombreTutor: nombreTutor.trim(),
                celularTutor: celularTutor.trim(),
                correoTutor: correoTutor.trim(),
                fechaPago: parseInt(fechaPago)
            },
            { new: true, runValidators: true }
        );
        
        if (!updatedPeque) {
            return res.status(404).json({ error: 'Niño no encontrado' });
        }
        
        res.json({ 
            message: 'Información actualizada correctamente', 
            peque: updatedPeque 
        });
        
    } catch (error) {
        console.error('Error actualizando peque:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            res.status(400).json({ error: messages.join(', ') });
        } else {
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
});

// Ruta para obtener 
app.get('/api/peques', async (req, res) => {
    try {
        const peques = await Peque.find({ activo: true }).sort({ nombreCompleto: 1 });
        res.json(peques);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/peques/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Peque.findByIdAndDelete(id);
    if (result) {
      res.json({ message: 'Niño eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Niño no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el niño' });
  }
});

// Obtener
app.get('/api/peques/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'ID no válido' });
        }
        
        const peque = await Peque.findById(id);
        
        if (!peque) {
            return res.status(404).json({ error: 'Niño no encontrado' });
        }
        
        res.json(peque);
    } catch (error) {
        console.error('Error obteniendo peque:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Crear maestro
app.post('/api/maestros', async (req, res) => {
    try {
        const { nombreCompleto, edad, celular } = req.body;
        if (!nombreCompleto || !edad || !celular) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const nuevoMaestro = new Maestro({
            nombreCompleto: nombreCompleto.trim(),
            edad: edad.trim(),
            celular: celular.trim()
        });

        await nuevoMaestro.save();
        res.status(201).json({ message: 'Maestro registrado exitosamente', maestro: nuevoMaestro });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener maestros activos
app.get('/api/maestros', async (req, res) => {
    try {
        const maestros = await Maestro.find({ activo: true }).sort({ nombreCompleto: 1 });
        console.log('Maestros encontrados:', maestros);
        res.json(maestros);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/maestros/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Maestro.findByIdAndDelete(id);
        if (result) {
            res.json({ message: 'Maestro eliminado correctamente' });
        } else {
            res.status(404).json({ error: 'Maestro no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el maestro' });
    }
});

// Obtener un maestro específico por ID
app.get('/api/maestros/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'ID no válido' });
        }
        
        const maestro = await Maestro.findById(id);
        
        if (!maestro) {
            return res.status(404).json({ error: 'Maestro no encontrado' });
        }
        
        res.json(maestro);
    } catch (error) {
        console.error('Error obteniendo maestro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Actualizar un maestro por ID
app.put('/api/maestros/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreCompleto, edad, celular } = req.body;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'ID no válido' });
        }
        
        if (!nombreCompleto || !edad || !celular) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (!/^\d{10}$/.test(celular)) {
            return res.status(400).json({ error: 'El celular debe tener exactamente 10 dígitos' });
        }

        const updatedMaestro = await Maestro.findByIdAndUpdate(
            id,
            {
                nombreCompleto: nombreCompleto.trim(),
                edad: edad.trim(),
                celular: celular.trim(),
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );
        
        if (!updatedMaestro) {
            return res.status(404).json({ error: 'Maestro no encontrado' });
        }
        
        res.json({ 
            message: 'Maestro actualizado correctamente', 
            maestro: updatedMaestro 
        });
        
    } catch (error) {
        console.error('Error actualizando maestro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});