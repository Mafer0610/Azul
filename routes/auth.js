const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Ruta de registro
router.post('/register', async (req, res) => {
    try {
        
        const { username, password, role } = req.body;

        // Validar que todos los campos estén presentes
        if (!username || !password || !role) {
            console.log('❌ Faltan campos obligatorios');
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('❌ El usuario ya existe:', username);
            return res.status(400).json({ error: "El usuario ya existe" });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Crear nuevo usuario
        const newUser = new User({ 
            username, 
            password: hashedPassword, 
            role 
        });

        const savedUser = await newUser.save();

        res.json({ message: "Usuario registrado correctamente" });
    } catch (error) {
        console.error("❌ Error en el registro:", error);
        res.status(500).json({ error: "Error interno del servidor: " + error.message });
    }
});

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar usuario
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                error: "Usuario no encontrado" 
            });
        }

        // Verificar contraseña
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ 
                success: false, 
                error: "Contraseña incorrecta" 
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || 'secret_key', 
            { expiresIn: '10h' }
        );

        res.json({ 
            success: true, 
            token, 
            role: user.role,
            username: user.username 
        });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;