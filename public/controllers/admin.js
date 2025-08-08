class AgendaSemanalmMongoDB {
    constructor() {
        this.eventos = {};
        this.diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        this.meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        this.eventoEditando = null;
        this.fechaSeleccionada = null;
        this.nombreDiaSeleccionado = null;
        this.semanaActual = 0;
        this.API_BASE_URL = window.location.origin + '/api';
        this.USER_ID = 'user_' + Date.now(); 
        
        this.inicializar();
    }

    async inicializar() {
        await this.verificarConexion();
        await this.cargarEventos();
        await this.cargarDatosInfantes();
        await this.cargarMaestros();
        this.renderizarCalendario();
        this.configurarModal();
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
        // CAMBIADO: Solo 6 días (Lunes a Sábado)
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
            const fechaFin = this.obtenerClaveEvento(fechasSemana[5]); // CAMBIADO: índice 5 en lugar de 6

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

    async cargarDatosInfantes() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/peques`);
            this.infantes = response.ok ? await response.json() : [];

            console.log('Infantes cargados:', this.infantes);

            const datalist = document.getElementById('sugerenciasNino');
            datalist.innerHTML = '';
            this.infantes.forEach(nino => {
                const option = document.createElement('option');
                option.value = nino.nombreCompleto;
                datalist.appendChild(option);
            });
            document.getElementById('nombreNino').addEventListener('input', (e) => {
                const nombre = e.target.value.trim();
                const nombreInput = e.target.value.trim().toLowerCase();

                const encontrado = this.infantes.find(n =>
                    n.nombreCompleto &&
                    n.nombreCompleto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
                    nombreInput.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                );

                if (encontrado) {
                    // CORRECCIÓN: Usar las propiedades correctas del modelo
                    document.getElementById('caracteristicasNino').value = encontrado.caracteristicas || '';
                    document.getElementById('nombreTutor').value = encontrado.nombreTutor || ''; // Era 'tutor'
                    document.getElementById('celularTutor').value = encontrado.celularTutor || ''; // Era 'celular'
                    console.log('Infante encontrado:', encontrado);
                } else {
                    // Limpiar campos si no se encuentra el niño
                    document.getElementById('caracteristicasNino').value = '';
                    document.getElementById('nombreTutor').value = '';
                    document.getElementById('celularTutor').value = '';
                    console.warn('Infante no encontrado:', nombre);
                }
            });

            // OPCIONAL: También puedes agregar un evento 'change' para cuando seleccionan de la lista
            document.getElementById('nombreNino').addEventListener('change', (e) => {
                // Disparar el mismo evento que 'input' para consistencia
                e.target.dispatchEvent(new Event('input'));
            });
        } catch (error) {
            console.error('Error cargando infantes:', error);
        }
    }

    async cargarMaestros() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/maestros`);
            this.maestros = response.ok ? await response.json() : [];

            console.log('Maestros cargados:', this.maestros);

            const selector = document.getElementById('maestro');
            selector.innerHTML = '<option value="">-- Seleccionar --</option>';
            this.maestros.forEach(m => {
                const option = document.createElement('option');
                // CORRECCIÓN: Usar 'nombreCompleto' en lugar de 'nombre'
                option.value = m.nombreCompleto;  // Era m.nombre
                option.textContent = m.nombreCompleto;  // Era m.nombre
                selector.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando maestros:', error);
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
                        <button class="add-btn" onclick="agenda.abrirModal('${claveEvento}', '${this.diasSemana[index]} ${fecha.getDate()}/${fecha.getMonth() + 1}')">+</button>
                    </div>
                    <div class="events-container">
                        ${this.renderizarEventos(eventosDelDia, claveEvento)}
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
    }
    
    renderizarEventos(eventos, claveEvento) {
        if (eventos.length === 0) {
            return '<div class="empty-state">No hay eventos</div>';
        }

        eventos.sort((a, b) => a.time.localeCompare(b.time));

        return eventos.map((evento) => {
            // Extraer la clase del título del evento
            let clase = '';
            if (evento.title && evento.title.includes(' - ')) {
                clase = evento.title.split(' - ')[1]; // Obtiene la parte después del " - "
            } else if (evento.clase) {
                clase = evento.clase; // Si tienes el campo clase directamente
            }
            
            // Obtener el color según la clase (solo para el borde)
            const colorBorde = this.getColorPorClase(clase);
            
            return `
                <div class="event-item" style="border-left-color: ${colorBorde};">
                    <div class="event-actions">
                        <button class="edit-btn" onclick="agenda.editarEvento('${evento._id}', '${claveEvento}')" title="Editar">✏️</button>
                        <button class="delete-btn" onclick="agenda.eliminarEvento('${evento._id}')" title="Eliminar">🗑️</button>
                    </div>
                    <div class="event-time">${this.formatearHora(evento.time)}</div>
                    <div class="event-title">${evento.title}</div>
                    ${evento.description ? `<div class="event-description">${evento.description}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // Tu función getColorPorClase se mantiene igual:
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
        return colores[clase] || '#F24B99'; // Color por defecto si no encuentra la clase
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

    abrirModal(claveEvento, nombreDia) {
        this.fechaSeleccionada = claveEvento;
        this.nombreDiaSeleccionado = nombreDia;
        this.eventoEditando = null;
        
        document.getElementById('modalTitle').textContent = `Agregar Evento - ${nombreDia}`;
        document.getElementById('eventForm').reset();
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('eventModal').style.display = 'block';
    }

    async editarEvento(eventoId, claveEvento) {
        const eventosDelDia = this.eventos[claveEvento] || [];
        const evento = eventosDelDia.find(e => e._id === eventoId);
        
        if (!evento) {
            alert('Evento no encontrado');
            return;
        }

        this.fechaSeleccionada = claveEvento;
        this.eventoEditando = eventoId;
        
        document.getElementById('modalTitle').textContent = `Editar Evento`;
        document.getElementById('eventTime').value = evento.time;
        
        // CORRECCIÓN: Llenar los campos correctos del formulario
        // Si tienes los datos almacenados en campos separados, úsalos:
        if (evento.nombreNino) {
            document.getElementById('nombreNino').value = evento.nombreNino;
        }
        if (evento.clase) {
            document.getElementById('clase').value = evento.clase;
        }
        if (evento.maestro) {
            document.getElementById('maestro').value = evento.maestro;
        }
        if (evento.caracteristicas) {
            document.getElementById('caracteristicasNino').value = evento.caracteristicas;
        }
        if (evento.nombreTutor) {
            document.getElementById('nombreTutor').value = evento.nombreTutor;
        }
        if (evento.celularTutor) {
            document.getElementById('celularTutor').value = evento.celularTutor;
        }
        
        // Si no tienes esos campos, puedes intentar parsear el title y description:
        if (!evento.nombreNino && evento.title) {
            // Ejemplo: "Juan Pérez - CEMS" -> extraer nombre
            const partes = evento.title.split(' - ');
            if (partes.length >= 2) {
                document.getElementById('nombreNino').value = partes[0];
                document.getElementById('clase').value = partes[1];
            }
        }
        
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('eventModal').style.display = 'block';
    }

    async eliminarEvento(eventoId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/eventos/${eventoId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                await this.cargarEventos();
                this.renderizarCalendario();
            } else {
                const error = await response.json();
                alert('Error eliminando evento: ' + error.error);
            }
        } catch (error) {
            console.error('Error eliminando evento:', error);
            alert('Error de conexión al eliminar evento');
        }
    }

    configurarModal() {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.cerrarModal();
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarEvento();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                this.cerrarModal();
            }
        });
    }

    mostrarError(mensaje) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = mensaje;
        errorElement.style.display = 'block';
    }

    async guardarEvento() {
        const time = document.getElementById('eventTime').value;
        // CORRECCIÓN: Usar los campos correctos que existen en tu HTML
        const nombreNino = document.getElementById('nombreNino').value.trim();
        const clase = document.getElementById('clase').value;
        const maestro = document.getElementById('maestro').value;
        const caracteristicas = document.getElementById('caracteristicasNino').value.trim();
        const nombreTutor = document.getElementById('nombreTutor').value.trim();
        const celularTutor = document.getElementById('celularTutor').value.trim();
        const saveBtn = document.getElementById('saveBtn');

        // Validación corregida
        if (!time || !nombreNino || !clase || !maestro) {
            this.mostrarError('Por favor completa todos los campos requeridos');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="loading-spinner"></span> Guardando...';

        try {
            const eventoData = {
                fecha: this.fechaSeleccionada,
                time,
                // CORRECCIÓN: Crear el title y description basado en tus datos
                title: `${nombreNino} - ${clase}`,
                description: `Maestro: ${maestro}${caracteristicas ? `\nCaracterísticas: ${caracteristicas}` : ''}${nombreTutor ? `\nTutor: ${nombreTutor}` : ''}${celularTutor ? `\nTel: ${celularTutor}` : ''}`,
                // Datos adicionales para tu aplicación
                nombreNino,
                clase,
                maestro,
                caracteristicas,
                nombreTutor,
                celularTutor,
                userId: this.USER_ID
            };

            let response;
            if (this.eventoEditando) {
                // Actualizar evento existente
                response = await fetch(`${this.API_BASE_URL}/eventos/${this.eventoEditando}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(eventoData)
                });
            } else {
                // Crear nuevo evento
                response = await fetch(`${this.API_BASE_URL}/eventos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(eventoData)
                });
            }

            if (response.ok) {
                await this.cargarEventos();
                this.renderizarCalendario();
                this.cerrarModal();
            } else {
                const error = await response.json();
                this.mostrarError(error.error || 'Error guardando evento');
            }
        } catch (error) {
            console.error('Error guardando evento:', error);
            this.mostrarError('Error de conexión al guardar evento');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Guardar';
        }
    }

    cerrarModal() {
        document.getElementById('eventModal').style.display = 'none';
        document.getElementById('eventForm').reset();
        document.getElementById('errorMessage').style.display = 'none';
        this.eventoEditando = null;
        this.fechaSeleccionada = null;
        this.nombreDiaSeleccionado = null;
    }
}

let agenda;
document.addEventListener('DOMContentLoaded', () => {
    agenda = new AgendaSemanalmMongoDB();
    agenda.cargarDatosInfantes(); 
    agenda.cargarMaestros();
});

function closeModal() {
    agenda.cerrarModal();
}

// Funciones del menú
function toggleMenu() {
    const dropdown = document.getElementById('menuDropdown');
    dropdown.classList.toggle('active');
    
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', function closeMenu(e) {
        if (!e.target.closest('.menu-container')) {
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeMenu);
        }
    });
}

function infantes() {
    window.location.href = '../pages/infant.html';
}

function masters() {
    window.location.href = '../pages/master.html';
}

function irTienda() {
    window.location.href = '../pages/tienda.html';
}

function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        window.location.href = '../index.html';
    } else {
        document.getElementById('menuDropdown').classList.remove('active');
    }
}

