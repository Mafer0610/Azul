class AgendaVisualizacion {
    constructor() {
        this.eventos = {};
        this.diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        this.meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        this.semanaActual = 0;
        
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.USER_ID = 'user_' + Date.now();
        
        this.inicializar();
    }

    async inicializar() {
        await this.verificarConexion();
        await this.cargarEventos();
        this.renderizarCalendario();
        this.actualizarNavegacion();
    }

    async verificarConexion() {
        const statusElement = document.getElementById('connectionStatus');
        try {
            const response = await fetch(`${this.API_BASE_URL.replace('/api', '')}/health`);
            if (response.ok) {
                statusElement.className = 'connection-status connected';
                statusElement.innerHTML = '✅ Conectado';
            } else {
                throw new Error('Servidor no disponible');
            }
        } catch (error) {
            statusElement.className = 'connection-status disconnected';
            statusElement.innerHTML = '❌ Sin conexión';
            console.error('Error de conexión:', error);
        }
    }

    obtenerFechasSemana(offsetSemanas = 0) {
        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1 + (offsetSemanas * 7));
        
        const fechas = [];
        for (let i = 0; i < 6; i++) {
            const fecha = new Date(inicioSemana);
            fecha.setDate(inicioSemana.getDate() + i);
            fechas.push(fecha);
        }
        return fechas;
    }

    obtenerClaveEvento(fecha) {
        return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    }

    esHoy(fecha) {
        const hoy = new Date();
        return fecha.toDateString() === hoy.toDateString();
    }

    async cargarEventos() {
        try {
            const fechasSemana = this.obtenerFechasSemana(this.semanaActual);
            const fechaInicio = this.obtenerClaveEvento(fechasSemana[0]);
            const fechaFin = this.obtenerClaveEvento(fechasSemana[5]);

            const response = await fetch(`${this.API_BASE_URL}/eventos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
            
            if (response.ok) {
                this.eventos = await response.json();
            } else {
                console.error('Error cargando eventos:', response.statusText);
                this.eventos = {};
            }
        } catch (error) {
            console.error('Error cargando eventos:', error);
            this.eventos = {};
        }
    }

    renderizarCalendario() {
        const grid = document.getElementById('calendarGrid');
        const fechasSemana = this.obtenerFechasSemana(this.semanaActual);
        let html = '';

        fechasSemana.forEach((fecha, index) => {
            const claveEvento = this.obtenerClaveEvento(fecha);
            const eventosDelDia = this.eventos[claveEvento] || [];
            const esHoy = this.esHoy(fecha);
            
            html += `
                <div class="day-column ${esHoy ? 'today-indicator' : ''}">
                    <div class="day-header">
                        <div class="day-name">${this.diasSemana[index]}</div>
                        <div class="day-date">${fecha.getDate()} ${this.meses[fecha.getMonth()].substring(0, 3)}</div>
                    </div>
                    <div class="events-container">
                        ${this.renderizarEventos(eventosDelDia)}
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
    }

    renderizarEventos(eventos) {
        if (eventos.length === 0) {
            return '<div class="empty-state">No hay eventos</div>';
        }

        eventos.sort((a, b) => a.time.localeCompare(b.time));

        return eventos.map((evento) => {
            let clase = '';
            if (evento.title && evento.title.includes(' - ')) {
                clase = evento.title.split(' - ')[1];
            } else if (evento.clase) {
                clase = evento.clase;
            }
            
            const colorBorde = this.getColorPorClase(clase);
            
            return `
                <div class="event-item" style="border-left-color: ${colorBorde};">
                    <div class="event-time">${this.formatearHora(evento.time)}</div>
                    <div class="event-title">${evento.title}</div>
                    ${evento.description ? `<div class="event-description">${evento.description}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    getColorPorClase(clase) {
        const colores = {
            'CEMS': '#C4C7F2',
            'AI': '#05F2DB',
            'OCUPACIONAL': '#F2E205',
            'BABY SPA': '#F4CCCC',
            'CANCELAR': '#FF0000',
            'MUESTRA': '#C6E0B4',
            'REPOSICIÓN': '#FF00FF'
        };
        return colores[clase] || '#F24B99';
    }

    formatearHora(hora) {
        const [horas, minutos] = hora.split(':');
        const horaNum = parseInt(horas);
        const periodo = horaNum >= 12 ? 'PM' : 'AM';
        const hora12 = horaNum > 12 ? horaNum - 12 : (horaNum === 0 ? 12 : horaNum);
        return `${hora12}:${minutos} ${periodo}`;
    }

    async cambiarSemana(direccion) {
        const nuevaSemana = this.semanaActual + direccion;
        if (nuevaSemana >= 0 && nuevaSemana <= 2) {
            this.semanaActual = nuevaSemana;
            await this.cargarEventos();
            this.renderizarCalendario();
            this.actualizarNavegacion();
        }
    }

    actualizarNavegacion() {
        const indicador = document.getElementById('weekIndicator');
        const prevBtn = document.getElementById('prevWeek');
        const nextBtn = document.getElementById('nextWeek');
        
        const nombres = ['Semana Actual', 'Próxima Semana', 'Semana +2'];
        indicador.textContent = nombres[this.semanaActual];
        
        prevBtn.disabled = this.semanaActual === 0;
        nextBtn.disabled = this.semanaActual === 2;
    }
}

let agenda;
document.addEventListener('DOMContentLoaded', () => {
    agenda = new AgendaVisualizacion();
});

function toggleMenu() {
    const dropdown = document.getElementById('menuDropdown');
    dropdown.classList.toggle('active');
    
    document.addEventListener('click', function closeMenu(e) {
        if (!e.target.closest('.menu-container')) {
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeMenu);
        }
    });
}

function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('loginTimestamp');
        
        window.location.href = '../index.html';
    } else {
        const dropdown = document.getElementById('menuDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
}