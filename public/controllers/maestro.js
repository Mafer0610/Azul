const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('edit');
let isEditing = !!editId;

if (isEditing) {
    loadMaestroData(editId);
    document.querySelector('.form-header h1').textContent = 'Editar Maestro';
    document.querySelector('.form-header p').textContent = 'Modifique la información del maestro';
    document.getElementById('submitBtn').textContent = 'Actualizar Maestro';
}

async function loadMaestroData(id) {
    try {
        const response = await fetch(`http://localhost:5000/api/maestros/${id}`);
        if (!response.ok) throw new Error('Maestro no encontrado');
        
        const maestro = await response.json();
        
        document.getElementById('nombreCompleto').value = maestro.nombreCompleto;
        document.getElementById('edad').value = maestro.edad;
        document.getElementById('celular').value = maestro.celular;
        
    } catch (error) {
        alert('Error al cargar los datos del maestro');
        console.error(error);
        window.location.href = '../pages/master.html';
    }
}

document.getElementById('maestroForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombreCompleto = document.getElementById('nombreCompleto').value;
    const edad = document.getElementById('edad').value;
    const celular = document.getElementById('celular').value;

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="loading-spinner"></span> ${isEditing ? 'Actualizando...' : 'Guardando...'}`;

    try {
        const url = isEditing 
            ? `http://localhost:5000/api/maestros/${editId}`
            : 'http://localhost:5000/api/maestros';
        
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombreCompleto, edad, celular })
        });

        const data = await response.json();

        if (data.message) {
            alert(data.message);
            document.getElementById('maestroForm').reset();
            window.location.href = '../pages/master.html';
        } else {
            alert(data.error || `Error al ${isEditing ? 'actualizar' : 'registrar'} el maestro`);
        }
    } catch (error) {
        alert('Error al conectar con el servidor');
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = isEditing ? 'Actualizar Maestro' : 'Registrar Maestro';
    }
});

function cancelarRegistro() {
    const mensaje = isEditing ? '¿Está seguro de que desea cancelar la edición?' : '¿Está seguro de que desea cancelar?';
    if (confirm(mensaje)) {
        window.location.href = '../pages/master.html';
    }
}

document.getElementById('celular').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    e.target.value = value;
});