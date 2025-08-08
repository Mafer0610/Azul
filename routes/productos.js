const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');

router.post('/register', async (req, res) => {
    try {
        const { nombre, cantidad, precio, caracteristicas } = req.body;

        if (!nombre || cantidad == null || precio == null) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const existente = await Producto.findOne({ nombre: nombre.trim() });
        if (existente) {
            return res.status(400).json({ error: 'Ya existe un producto con ese nombre' });
        }

        const nuevoProducto = new Producto({
            nombre: nombre.trim(),
            cantidad: parseInt(cantidad),
            precio: parseFloat(precio),
            caracteristicas: caracteristicas?.trim() || ''
        });

        await nuevoProducto.save();

        res.status(201).json({
            message: 'Producto registrado exitosamente',
            producto: nuevoProducto
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const productos = await Producto.find({ activo: true }).sort({ nombre: 1 });
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const producto = await Producto.findByIdAndDelete(req.params.id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ message: `Producto "${producto.nombre}" eliminado correctamente` });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

router.put('/vender/:id', async (req, res) => {
    const { cantidadVendida } = req.body;

    if (!cantidadVendida || cantidadVendida <= 0) {
        return res.status(400).json({ error: 'Cantidad inválida para vender' });
    }

    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        if (producto.cantidad < cantidadVendida) {
            return res.status(400).json({ error: 'Cantidad insuficiente en inventario' });
        }

        producto.cantidad -= cantidadVendida;
        await producto.save();

        res.json({ message: `Se vendieron ${cantidadVendida} unidad(es) de "${producto.nombre}"` });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar la venta' });
    }
});


module.exports = router;
