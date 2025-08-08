document.getElementById('pequeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
    const edad = document.getElementById('edad').value.trim();
    const comportamiento = document.querySelector('input[name="comportamiento"]:checked')?.value;
    const caracteristicas = document.getElementById('caracteristicas').value.trim();
    const nombreTutor = document.getElementById('nombreTutor').value.trim();
    const celularTutor = document.getElementById('celularTutor').value.trim();
    const fechaPago = document.getElementById('fechaPago').value;
    
    if (!nombreCompleto || !edad || !comportamiento || !nombreTutor || !celularTutor || !fechaPago) {
        showMessage('Por favor complete todos los campos obligatorios (*)', 'error');
        return;
    }
    
    if (celularTutor.length !== 10) {
        showMessage('El celular debe tener exactamente 10 dígitos', 'error');
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
                edad,
                comportamiento,
                caracteristicas,
                nombreTutor,
                celularTutor,
                fechaPago: parseInt(fechaPago)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('✅ ' + data.message, 'success');
            document.getElementById('pequeForm').reset();
            
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

document.getElementById('edad').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
        value = value.slice(0, 2);
    }
    e.target.value = value;
});