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

app.post('/api/peques', async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        
        const { nombreCompleto, edad, comportamiento, caracteristicas, nombreTutor, celularTutor, fechaPago } = req.body;
        
        if (!nombreCompleto || !edad || !comportamiento || !nombreTutor || !celularTutor || !fechaPago) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (fechaPago < 1 || fechaPago > 31) {
            return res.status(400).json({ error: 'La fecha de pago debe estar entre 1 y 31' });
        }

        const nuevoPeque = new Peque({
            nombreCompleto: nombreCompleto.trim(),
            edad,
            comportamiento,
            caracteristicas: caracteristicas || '',
            nombreTutor: nombreTutor.trim(),
            celularTutor: celularTutor.trim(),
            fechaPago: parseInt(fechaPago)
        });

        await nuevoPeque.save();
        console.log('Peque guardado:', nuevoPeque); 
        
        res.status(201).json({ 
            message: 'Niño registrado exitosamente',
            peque: nuevoPeque 
        });
    } catch (error) {
        console.error('Error guardando peque:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ruta para obtener peques
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

// Obtener un peque específico por ID
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

// Actualizar un peque por ID
app.put('/api/peques/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreCompleto, edad, comportamiento, caracteristicas, nombreTutor, celularTutor, fechaPago } = req.body;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'ID no válido' });
        }
        
        if (!nombreCompleto || !edad || !comportamiento || !nombreTutor || !celularTutor || !fechaPago) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (edad < 1 || edad > 18) {
            return res.status(400).json({ error: 'La edad debe estar entre 1 y 18 años' });
        }

        if (!/^\d{10}$/.test(celularTutor)) {
            return res.status(400).json({ error: 'El celular debe tener exactamente 10 dígitos' });
        }

        if (fechaPago < 1 || fechaPago > 31) {
            return res.status(400).json({ error: 'La fecha de pago debe estar entre 1 y 31' });
        }

        const updatedPeque = await Peque.findByIdAndUpdate(
            id,
            {
                nombreCompleto: nombreCompleto.trim(),
                edad: parseInt(edad),
                comportamiento,
                caracteristicas: caracteristicas?.trim() || '',
                nombreTutor: nombreTutor.trim(),
                celularTutor: celularTutor.trim(),
                fechaPago: parseInt(fechaPago),
                updatedAt: new Date()
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