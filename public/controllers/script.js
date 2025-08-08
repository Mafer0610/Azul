document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const response = await fetch('http://localhost:5000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();

        if (data.message) {
            alert(data.message);
            window.location.href = "../index.html";
        } else {
            alert(data.error || "Error en el registro, intenta de nuevo.");
        }
    } catch (error) {
        alert("Error al conectar con el servidor.");
        console.error(error);
    }
});