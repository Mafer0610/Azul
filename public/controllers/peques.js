function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
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
        return `${Math.max(meses, 1)} meses`;
    } else {
        return `${edad} años`;
    }
}

document.getElementById('fechaNacimiento').addEventListener('change', function(e) {
    const fechaNacimiento = e.target.value;
    if (fechaNacimiento) {
        const edad = calcularEdad(fechaNacimiento);
        document.getElementById('edad').value = edad;
    }
});

document.getElementById('pequeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Recopilar todos los datos del formulario
    const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
    const fechaNacimiento = document.getElementById('fechaNacimiento').value;
    const comportamiento = document.querySelector('input[name="comportamiento"]:checked')?.value;
    const caracteristicas = document.getElementById('caracteristicas').value.trim();
    const tipoSangre = document.getElementById('tipoSangre').value.trim(); // CORREGIDO: quitar el punto después de trim
    const alergias = document.getElementById('alergias').value.trim();
    
    // Obtener servicios seleccionados (checkboxes)
    const serviciosSeleccionados = [];
    const checkboxes = document.querySelectorAll('input[name="servicios"]:checked');
    checkboxes.forEach(checkbox => {
        serviciosSeleccionados.push(checkbox.value);
    });
    
    const nombreTutor = document.getElementById('nombreTutor').value.trim();
    const celularTutor = document.getElementById('celularTutor').value.trim();
    const correoTutor = document.getElementById('correoTutor').value.trim();
    const fechaPago = document.getElementById('fechaPago').value;
    
    // Validaciones
    if (!nombreCompleto || !fechaNacimiento || !comportamiento || 
        !nombreTutor || !celularTutor || !correoTutor || !fechaPago) {
        showMessage('Por favor complete todos los campos obligatorios (*)', 'error');
        return;
    }
    
    // Validar que al menos un servicio esté seleccionado
    if (serviciosSeleccionados.length === 0) {
        showMessage('Debe seleccionar al menos un servicio', 'error');
        return;
    }
    
    if (celularTutor.length !== 10) {
        showMessage('El celular debe tener exactamente 10 dígitos', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoTutor)) {
        showMessage('Por favor ingrese un correo electrónico válido', 'error');
        return;
    }

    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    if (fechaNac > hoy) {
        showMessage('La fecha de nacimiento no puede ser futura', 'error');
        return;
    }

    // Validar fecha de pago
    const fechaPagoNum = parseInt(fechaPago);
    if (fechaPagoNum < 1 || fechaPagoNum > 31) {
        showMessage('La fecha de pago debe estar entre 1 y 31', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Guardando...';
    
    try {
        const response = await fetch('http://localhost:5000/api/peques', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombreCompleto,
                fechaNacimiento,
                comportamiento,
                caracteristicas,
                tipoSangre,
                alergias,
                servicios: serviciosSeleccionados,
                nombreTutor,
                celularTutor,
                correoTutor,
                fechaPago: fechaPagoNum
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('✅ ' + data.message, 'success');
            document.getElementById('pequeForm').reset();
            document.getElementById('edad').value = '';
            
            setTimeout(() => {
                window.location.href = '../pages/infant.html';
            }, 2000);
        } else {
            showMessage('❌ ' + (data.error || 'Error al registrar el niño'), 'error');
        }
    } catch (error) {
        showMessage('❌ Error al conectar con el servidor', 'error');
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Registrar Niño';
    }
});

function showMessage(message, type) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `<div class="${type}-message">${message}</div>`;
    container.scrollIntoView({ behavior: 'smooth' });
    
    if (type === 'error') {
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}

function cancelarRegistro() {
    if (confirm('¿Está seguro de que desea cancelar?')) {
        window.location.href = '../pages/infant.html';
    }
}

document.getElementById('celularTutor').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    e.target.value = value;
});

document.addEventListener('DOMContentLoaded', function() {
    const fechaNacimiento = document.getElementById('fechaNacimiento');
    if (fechaNacimiento && fechaNacimiento.value) {
        const edad = calcularEdad(fechaNacimiento.value);
        document.getElementById('edad').value = edad;
    }
});