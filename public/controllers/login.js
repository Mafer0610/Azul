// Función que se ejecuta cuando el login es exitoso
function onLoginSuccess(userType, token, username) {
    // Guardar datos de autenticación
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('loginTimestamp', Date.now().toString());
    localStorage.setItem('userType', userType); // 'admin' o 'user'
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);

    // Redirigir según el tipo de usuario
    if (userType === 'admin') {
        window.location.href = '../pages/Administrador.html';
    } else if (userType === 'user') {
        window.location.href = '../pages/Usuario.html';
    } else {
        alert("Rol no reconocido, contacta al soporte.");
    }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Llamar a la función para manejar el éxito
            onLoginSuccess(data.role, data.token, data.username);
        } else {
            alert(data.error || "Credenciales incorrectas, intenta nuevamente.");
        }

    } catch (error) {
        alert("Error al conectar con el servidor.");
        console.error(error);
    }
});