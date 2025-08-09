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

// Ruta de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Servicios permitidos - ACTUALIZADO con Lenguaje
const serviciosPermitidos = ['Natación', 'Estimulación', 'Baby Spa', 'Paquete de Acuática Inicial y Estimulación temprana', 'Lenguaje'];

// Crear peque - ACTUALIZADO para dos tutores
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
            nombreTutor1, 
            celularTutor1, 
            correoTutor1,
            nombreTutor2,
            celularTutor2,
            correoTutor2,
            fechaPago 
        } = req.body;
        
        // VALIDACIÓN MÍNIMA - Solo nombre es obligatorio
        if (!nombreCompleto || !nombreCompleto.trim()) {
            console.log('❌ Falta nombre completo');
            return res.status(400).json({ error: 'El nombre completo es obligatorio' });
        }

        console.log('✅ Validación básica pasada');

        // Validar servicios solo si se proporcionan
        if (servicios && Array.isArray(servicios) && servicios.length > 0) {
            const serviciosInvalidos = servicios.filter(servicio => !serviciosPermitidos.includes(servicio));
            if (serviciosInvalidos.length > 0) {
                console.log('❌ Servicios no válidos:', serviciosInvalidos);
                return res.status(400).json({ 
                    error: `Servicios no válidos: ${serviciosInvalidos.join(', ')}` 
                });
            }
        }

        // Validaciones opcionales - solo si se proporcionan
        if (fechaPago && (fechaPago < 1 || fechaPago > 31)) {
            return res.status(400).json({ error: 'La fecha de pago debe estar entre 1 y 31' });
        }

        if (fechaNacimiento) {
            const fechaNac = new Date(fechaNacimiento);
            const hoy = new Date();
            if (fechaNac > hoy) {
                return res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
            }
        }

        // Validar celulares de tutores
        if (celularTutor1 && !/^\d{10}$/.test(celularTutor1)) {
            return res.status(400).json({ error: 'El celular del tutor 1 debe tener exactamente 10 dígitos' });
        }

        if (celularTutor2 && !/^\d{10}$/.test(celularTutor2)) {
            return res.status(400).json({ error: 'El celular del tutor 2 debe tener exactamente 10 dígitos' });
        }

        // Validar correos de tutores
        if (correoTutor1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoTutor1)) {
            return res.status(400).json({ error: 'El formato del correo electrónico del tutor 1 no es válido' });
        }

        if (correoTutor2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoTutor2)) {
            return res.status(400).json({ error: 'El formato del correo electrónico del tutor 2 no es válido' });
        }

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

        // Crear el objeto con solo los campos que tienen valor
        const pequeData = {
            nombreCompleto: nombreCompleto.trim()
        };

        // Solo agregar campos si tienen valor
        if (fechaNacimiento) pequeData.fechaNacimiento = new Date(fechaNacimiento);
        if (comportamiento) pequeData.comportamiento = comportamiento;
        if (caracteristicas && caracteristicas.trim()) pequeData.caracteristicas = caracteristicas.trim();
        if (tipoSangre && tipoSangre.trim()) pequeData.tipoSangre = tipoSangre.trim();
        if (alergias && alergias.trim()) pequeData.alergias = alergias.trim();
        if (servicios && Array.isArray(servicios)) pequeData.servicios = servicios;
        
        // Tutor 1
        if (nombreTutor1 && nombreTutor1.trim()) pequeData.nombreTutor1 = nombreTutor1.trim();
        if (celularTutor1 && celularTutor1.trim()) pequeData.celularTutor1 = celularTutor1.trim();
        if (correoTutor1 && correoTutor1.trim()) pequeData.correoTutor1 = correoTutor1.trim();
        
        // Tutor 2
        if (nombreTutor2 && nombreTutor2.trim()) pequeData.nombreTutor2 = nombreTutor2.trim();
        if (celularTutor2 && celularTutor2.trim()) pequeData.celularTutor2 = celularTutor2.trim();
        if (correoTutor2 && correoTutor2.trim()) pequeData.correoTutor2 = correoTutor2.trim();
        
        if (fechaPago) pequeData.fechaPago = parseInt(fechaPago);

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
            nombreTutor1, 
            celularTutor1, 
            correoTutor1,
            nombreTutor2,
            celularTutor2,
            correoTutor2,
            fechaPago 
        } = req.body;
        
        console.log('=== ACTUALIZANDO PEQUE ===');
        console.log('ID:', id);
        console.log('Datos recibidos:', req.body);
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'ID no válido' });
        }
        
        if (!nombreCompleto || !nombreCompleto.trim()) {
            return res.status(400).json({ error: 'El nombre completo es obligatorio' });
        }

        if (servicios && Array.isArray(servicios) && servicios.length > 0) {
            const serviciosInvalidos = servicios.filter(servicio => !serviciosPermitidos.includes(servicio));
            if (serviciosInvalidos.length > 0) {
                return res.status(400).json({ 
                    error: `Servicios no válidos: ${serviciosInvalidos.join(', ')}` 
                });
            }
        }

        if (celularTutor1 && !/^\d{10}$/.test(celularTutor1)) {
            return res.status(400).json({ error: 'El celular del tutor 1 debe tener exactamente 10 dígitos' });
        }

        if (celularTutor2 && !/^\d{10}$/.test(celularTutor2)) {
            return res.status(400).json({ error: 'El celular del tutor 2 debe tener exactamente 10 dígitos' });
        }

        if (correoTutor1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoTutor1)) {
            return res.status(400).json({ error: 'El formato del correo electrónico del tutor 1 no es válido' });
        }

        if (correoTutor2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoTutor2)) {
            return res.status(400).json({ error: 'El formato del correo electrónico del tutor 2 no es válido' });
        }

        if (fechaPago && (fechaPago < 1 || fechaPago > 31)) {
            return res.status(400).json({ error: 'La fecha de pago debe estar entre 1 y 31' });
        }

        if (fechaNacimiento) {
            const fechaNac = new Date(fechaNacimiento);
            const hoy = new Date();
            if (fechaNac > hoy) {
                return res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
            }
        }

        const updateData = {
            nombreCompleto: nombreCompleto.trim(),
            fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
            comportamiento: comportamiento || '',
            caracteristicas: caracteristicas || '',
            tipoSangre: tipoSangre || '',
            alergias: alergias || '',
            servicios: servicios || [],
            nombreTutor1: nombreTutor1 || '',
            celularTutor1: celularTutor1 || '',
            correoTutor1: correoTutor1 || '',
            nombreTutor2: nombreTutor2 || '',
            celularTutor2: celularTutor2 || '',
            correoTutor2: correoTutor2 || '',
            fechaPago: fechaPago ? parseInt(fechaPago) : null
        };

        console.log('Datos para actualizar:', updateData);

        const updatedPeque = await Peque.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedPeque) {
            return res.status(404).json({ error: 'Niño no encontrado' });
        }
        
        console.log('✅ Peque actualizado:', updatedPeque);
        
        res.json({ 
            message: 'Información actualizada correctamente', 
            peque: updatedPeque 
        });
        
    } catch (error) {
        console.error('❌ Error actualizando peque:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            res.status(400).json({ error: messages.join(', ') });
        } else {
            res.status(500).json({ error: 'Error del servidor: ' + error.message });
        }
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

// Eliminar peque
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

// Obtener peque por ID
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

// Eliminar maestro
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

// Obtener producto por ID
app.get('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const Producto = require('./models/Producto');
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'ID no válido' });
        }
        
        const producto = await Producto.findById(id);
        
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(producto);
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Actualizar producto por ID
app.put('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, cantidad, caracteristicas } = req.body;
        const Producto = require('./models/Producto');
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'ID no válido' });
        }
        
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
        }

        if (!precio || precio <= 0) {
            return res.status(400).json({ error: 'El precio es obligatorio y debe ser mayor a 0' });
        }

        const updateData = {
            nombre: nombre.trim(),
            precio: parseFloat(precio)
        };

        if (cantidad !== undefined && cantidad !== '') {
            updateData.cantidad = parseInt(cantidad);
        }

        if (caracteristicas !== undefined) {
            updateData.caracteristicas = caracteristicas.trim();
        }

        const updatedProducto = await Producto.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedProducto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json({ 
            message: 'Producto actualizado correctamente', 
            producto: updatedProducto 
        });
        
    } catch (error) {
        console.error('Error actualizando producto:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            res.status(400).json({ error: messages.join(', ') });
        } else {
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
});

// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const Producto = require('./models/Producto');
        const productos = await Producto.find({ activo: true }).sort({ nombre: 1 });
        res.json(productos);
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});