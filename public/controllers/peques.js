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
    } else {
        document.getElementById('edad').value = '';
    }
});

document.getElementById('pequeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
    const fechaNacimiento = document.getElementById('fechaNacimiento').value;
    const comportamiento = document.querySelector('input[name="comportamiento"]:checked')?.value || '';
    const caracteristicas = document.getElementById('caracteristicas').value.trim();
    const tipoSangre = document.getElementById('tipoSangre').value.trim();
    const alergias = document.getElementById('alergias').value.trim();
    
    const serviciosSeleccionados = [];
    const checkboxes = document.querySelectorAll('input[name="servicios"]:checked');
    checkboxes.forEach(checkbox => {
        serviciosSeleccionados.push(checkbox.value);
    });
    
    const nombreTutor1 = document.getElementById('nombreTutor1').value.trim();
    const celularTutor1 = document.getElementById('celularTutor1').value.trim();
    const correoTutor1 = document.getElementById('correoTutor1').value.trim();
    const nombreTutor2 = document.getElementById('nombreTutor2').value.trim();
    const celularTutor2 = document.getElementById('celularTutor2').value.trim();
    const correoTutor2 = document.getElementById('correoTutor2').value.trim();
    
    const fechaPago = document.getElementById('fechaPago').value;
    
    if (!nombreCompleto) {
        showMessage('Por favor ingrese el nombre completo', 'error');
        return;
    }
    
    if (celularTutor1 && celularTutor1.length !== 10) {
        showMessage('El celular del tutor 1 debe tener exactamente 10 dígitos', 'error');
        return;
    }

    if (celularTutor2 && celularTutor2.length !== 10) {
        showMessage('El celular del tutor 2 debe tener exactamente 10 dígitos', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correoTutor1 && !emailRegex.test(correoTutor1)) {
        showMessage('Por favor ingrese un correo electrónico válido para el tutor 1', 'error');
        return;
    }

    if (correoTutor2 && !emailRegex.test(correoTutor2)) {
        showMessage('Por favor ingrese un correo electrónico válido para el tutor 2', 'error');
        return;
    }

    if (fechaNacimiento) {
        const fechaNac = new Date(fechaNacimiento);
        const hoy = new Date();
        if (fechaNac > hoy) {
            showMessage('La fecha de nacimiento no puede ser futura', 'error');
            return;
        }
    }

    if (fechaPago) {
        const fechaPagoNum = parseInt(fechaPago);
        if (fechaPagoNum < 1 || fechaPagoNum > 31) {
            showMessage('La fecha de pago debe estar entre 1 y 31', 'error');
            return;
        }
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Guardando...';
    
    try {
        const requestData = {
            nombreCompleto,
            servicios: serviciosSeleccionados
        };

        if (fechaNacimiento) requestData.fechaNacimiento = fechaNacimiento;
        if (comportamiento) requestData.comportamiento = comportamiento;
        if (caracteristicas) requestData.caracteristicas = caracteristicas;
        if (tipoSangre) requestData.tipoSangre = tipoSangre;
        if (alergias) requestData.alergias = alergias;
        
        if (nombreTutor1) requestData.nombreTutor1 = nombreTutor1;
        if (celularTutor1) requestData.celularTutor1 = celularTutor1;
        if (correoTutor1) requestData.correoTutor1 = correoTutor1;
        
        if (nombreTutor2) requestData.nombreTutor2 = nombreTutor2;
        if (celularTutor2) requestData.celularTutor2 = celularTutor2;
        if (correoTutor2) requestData.correoTutor2 = correoTutor2;
        
        if (fechaPago) requestData.fechaPago = parseInt(fechaPago);

        const response = await fetch('http://localhost:5000/api/peques', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
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

document.getElementById('celularTutor1').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    e.target.value = value;
});

document.getElementById('celularTutor2').addEventListener('input', function(e) {
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