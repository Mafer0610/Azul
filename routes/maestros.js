const express = require('express');
const router = express.Router();
const Maestro = require('../models/Maestro');

// Registrar un nuevo maestro
router.post('/register', async (req, res) => {
    try {
        console.log('📌 INICIO REGISTRO DE MAESTRO');
        console.log('📦 Datos recibidos:', req.body);
        console.log('📚 Collection name:', Maestro.collection.name);
        console.log('🗃️ Database name:', Maestro.db.name);

        const { nombreCompleto, edad, celular } = req.body;

        if (!nombreCompleto || !edad || !celular) {
            console.log('⚠️ Faltan campos obligatorios');
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        console.log('✅ Validaciones pasadas');

        const existeMaestro = await Maestro.findOne({ nombreCompleto: nombreCompleto.trim() });
        console.log('¿Maestro existente?', existeMaestro ? 'SÍ' : 'NO');

        if (existeMaestro) {
            console.log('❌ Ya existe maestro con ese nombre');
            return res.status(400).json({ error: 'Ya existe un maestro registrado con ese nombre' });
        }

        const maestroData = {
            nombreCompleto: nombreCompleto.trim(),
            edad: edad.trim(),
            celular: celular.trim()
        };

        console.log('📤 Datos a guardar:', maestroData);

        const nuevoMaestro = new Maestro(maestroData);
        console.log('🛠️ Maestro creado (antes de save):', nuevoMaestro);

        const savedMaestro = await nuevoMaestro.save();
        console.log('✅ Maestro guardado exitosamente:', savedMaestro);
        console.log('🆔 ID generado:', savedMaestro._id);

        res.status(201).json({
            message: 'Maestro registrado exitosamente',
            maestro: {
                id: savedMaestro._id,
                nombreCompleto: savedMaestro.nombreCompleto,
                edad: savedMaestro.edad
            }
        });

    } catch (error) {
        console.error('❌ ERROR al registrar maestro:', error);
        console.error('🧵 Stack completo:', error.stack);

        if (error.code === 11000) {
            res.status(400).json({ error: 'Ya existe un maestro registrado con esos datos' });
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

        query.activo = activo !== undefined ? activo === 'true' : true;

        const maestros = await Maestro.find(query)
            .select('-__v')
            .sort({ nombreCompleto: 1 });

        res.json(maestros);
    } catch (error) {
        console.error('❌ Error al obtener maestros:', error);
        res.status(500).json({ error: 'Error al obtener la lista de maestros' });
    }
});

module.exports = router;