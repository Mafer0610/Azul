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
            // Guardar token y rol en localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('username', data.username);
            
            // Redirigir según el rol
            if (data.role === "admin") {
                window.location.href = "../pages/Administrador.html";
            } else if (data.role === "user") {
                window.location.href = "../pages/Usuario.html";
            } else {
                alert("Rol no reconocido, contacta al soporte.");
            }
        } else {
            alert(data.error || "Credenciales incorrectas, intenta nuevamente.");
        }

    } catch (error) {
        alert("Error al conectar con el servidor.");
        console.error(error);
    }
});