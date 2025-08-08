const express = require('express');
const router = express.Router();
const Peque = require('../models/Peque');

// Crear un nuevo peque
router.post('/register', async (req, res) => {
    try {
        console.log('INICIO REGISTRO');
        console.log('Datos recibidos:', req.body);
        console.log('Collection name:', Peque.collection.name);
        console.log('Database name:', Peque.db.name);
        
        const { nombreCompleto, edad, comportamiento, caracteristicas, nombreTutor, celularTutor } = req.body;
        
        if (!nombreCompleto || !edad || !comportamiento || !nombreTutor || !celularTutor) {
            console.log('Faltan campos obligatorios');
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        console.log('Validaciones pasadas');

        const existePeque = await Peque.findOne({ nombreCompleto: nombreCompleto.trim() });
        console.log('Peque existente?', existePeque ? 'SÍ' : 'NO');
        
        if (existePeque) {
            console.log('❌ Ya existe peque con ese nombre');
            return res.status(400).json({ error: 'Ya existe un niño registrado con ese nombre' });
        }

        const pequeData = {
            nombreCompleto: nombreCompleto.trim(),
            edad: parseInt(edad),
            comportamiento,
            caracteristicas: caracteristicas || '',
            nombreTutor: nombreTutor.trim(),
            celularTutor: celularTutor.trim()
        };
        
        console.log('Datos a guardar:', pequeData);
        
        const nuevoPeque = new Peque(pequeData);
        console.log('Peque creado (antes de save):', nuevoPeque);

        const savedPeque = await nuevoPeque.save();
        console.log('✅ Peque guardado exitosamente:', savedPeque);
        console.log('ID generado:', savedPeque._id);
        
        res.status(201).json({ 
            message: 'Niño registrado exitosamente',
            peque: {
                id: savedPeque._id,
                nombreCompleto: savedPeque.nombreCompleto,
                edad: savedPeque.edad,
                comportamiento: savedPeque.comportamiento
            }
        });

    } catch (error) {
        console.error('❌ ERROR al registrar peque:', error);
        console.error('Error completo:', error.stack);
        
        if (error.code === 11000) {
            res.status(400).json({ error: 'Ya existe un niño registrado con esos datos' });
        } else if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            res.status(400).json({ error: messages.join(', ') });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

router.get('/', async (req, res) => {
    try {
        const { activo } = req.query;
        let query = {};
        
        if (activo !== undefined) {
            query.activo = activo === 'true';
        } else {
            query.activo = true;
        }
        
        const peques = await Peque.find(query)
            .select('-__v')
            .sort({ nombreCompleto: 1 });
            
        res.json(peques);
    } catch (error) {
        console.error('Error al obtener peques:', error);
        res.status(500).json({ error: 'Error al obtener la lista de niños' });
    }
});

module.exports = router;