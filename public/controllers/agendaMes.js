class AgendaMensualMongoDB {
    constructor() {
        this.eventos = {};
        this.meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        this.diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        this.eventoEditando = null;
        this.fechaSeleccionada = null;
        this.nombreDiaSeleccionado = null;
        this.mesActual = new Date().getMonth();
        this.añoActual = new Date().getFullYear();
        this.API_BASE_URL = window.location.origin + '/api';
        this.USER_ID = 'user_' + Date.now();
        this.maestrosOcupados = {};
        
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

    obtenerClaveEvento(fecha) {
        return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    }

    esHoy(fecha) {
        const hoy = new Date();
        return fecha.toDateString() === hoy.toDateString();
    }

    async cargarEventos() {
        try {
            const primerDia = new Date(this.añoActual, this.mesActual, 1);
            const ultimoDia = new Date(this.añoActual, this.mesActual + 1, 0);
            
            const fechaInicio = this.obtenerClaveEvento(primerDia);
            const fechaFin = this.obtenerClaveEvento(ultimoDia);

            const response = await fetch(`${this.API_BASE_URL}/eventos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
            
            if (response.ok) {
                this.eventos = await response.json();
                await this.actualizarMaestrosOcupados();
            } else {
                console.error('Error cargando eventos:', response.statusText);
                this.eventos = {};
            }
        } catch (error) {
            console.error('Error cargando eventos:', error);
            this.eventos = {};
        }
    }

    async actualizarMaestrosOcupados() {
        this.maestrosOcupados = {};
        
        try {
            // Obtener eventos completos para tener la información del maestro
            const response = await fetch(`${this.API_BASE_URL}/eventos/completos`);
            if (!response.ok) {
                // Si no existe la ruta, usar los eventos ya cargados
                this.procesarMaestrosOcupados();
                return;
            }
            
            const eventosCompletos = await response.json();
            
            for (const [fecha, eventos] of Object.entries(eventosCompletos)) {
                if (!this.maestrosOcupados[fecha]) {
                    this.maestrosOcupados[fecha] = {};
                }
                
                eventos.forEach(evento => {
                    if (evento.maestro && evento.time) {
                        if (!this.maestrosOcupados[fecha][evento.time]) {
                            this.maestrosOcupados[fecha][evento.time] = [];
                        }
                        if (!this.maestrosOcupados[fecha][evento.time].includes(evento.maestro)) {
                            this.maestrosOcupados[fecha][evento.time].push(evento.maestro);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error actualizando maestros ocupados:', error);
            this.procesarMaestrosOcupados();
        }
    }

    procesarMaestrosOcupados() {
        // Método alternativo usando los eventos ya cargados
        this.maestrosOcupados = {};
        
        for (const [fecha, eventos] of Object.entries(this.eventos)) {
            if (!this.maestrosOcupados[fecha]) {
                this.maestrosOcupados[fecha] = {};
            }
            
            eventos.forEach(evento => {
                // Intentar extraer maestro del título o descripción
                let maestro = '';
                if (evento.description) {
                    const lineas = evento.description.split('\n');
                    const lineaMaestro = lineas.find(linea => linea.startsWith('Maestro:'));
                    if (lineaMaestro) {
                        maestro = lineaMaestro.replace('Maestro:', '').trim();
                    }
                }
                
                if (maestro && evento.time) {
                    if (!this.maestrosOcupados[fecha][evento.time]) {
                        this.maestrosOcupados[fecha][evento.time] = [];
                    }
                    if (!this.maestrosOcupados[fecha][evento.time].includes(maestro)) {
                        this.maestrosOcupados[fecha][evento.time].push(maestro);
                    }
                }
            });
        }
    }

    async cargarDatosInfantes() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/peques`);
            this.infantes = response.ok ? await response.json() : [];

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
                    document.getElementById('caracteristicasNino').value = encontrado.caracteristicas || '';
                    document.getElementById('nombreTutor1').value = encontrado.nombreTutor1 || '';
                    document.getElementById('celularTutor1').value = encontrado.celularTutor1 || '';
                    console.log('Infante encontrado:', encontrado);
                } else {
                    document.getElementById('caracteristicasNino').value = '';
                    document.getElementById('nombreTutor1').value = '';
                    document.getElementById('celularTutor1').value = '';
                    console.warn('Infante no encontrado:', nombre);
                }
            });

        } catch (error) {
            console.error('Error cargando infantes:', error);
        }
    }

    async cargarMaestros() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/maestros`);
            this.maestros = response.ok ? await response.json() : [];

            const selector = document.getElementById('maestro');
            selector.innerHTML = '<option value="">-- Seleccionar --</option>';
            this.maestros.forEach(m => {
                const option = document.createElement('option');
                option.value = m.nombreCompleto;
                option.textContent = m.nombreCompleto;
                selector.appendChild(option);
            });

            // Agregar eventos para validación en tiempo real
            this.configurarValidacionMaestros();
        } catch (error) {
            console.error('Error cargando maestros:', error);
        }
    }

    configurarValidacionMaestros() {
        const timeInput = document.getElementById('eventTime');
        const maestroSelect = document.getElementById('maestro');
        
        const validarMaestro = () => {
            if (!this.fechaSeleccionada || !timeInput.value) return;
            
            this.actualizarOpcionesMaestros();
        };

        timeInput.addEventListener('change', validarMaestro);
        timeInput.addEventListener('input', validarMaestro);
    }

    actualizarOpcionesMaestros() {
        const selector = document.getElementById('maestro');
        const timeInput = document.getElementById('eventTime');
        const selectedValue = selector.value;
        
        if (!this.fechaSeleccionada || !timeInput.value) {
            // Restaurar todas las opciones
            selector.innerHTML = '<option value="">-- Seleccionar --</option>';
            this.maestros.forEach(m => {
                const option = document.createElement('option');
                option.value = m.nombreCompleto;
                option.textContent = m.nombreCompleto;
                selector.appendChild(option);
            });
            return;
        }

        const maestrosOcupadosEnHora = this.maestrosOcupados[this.fechaSeleccionada]?.[timeInput.value] || [];
        
        selector.innerHTML = '<option value="">-- Seleccionar --</option>';
        
        this.maestros.forEach(m => {
            const option = document.createElement('option');
            option.value = m.nombreCompleto;
            
            const estaOcupado = maestrosOcupadosEnHora.includes(m.nombreCompleto);
            const esEventoActual = this.eventoEditando && selectedValue === m.nombreCompleto;
            
            if (estaOcupado && !esEventoActual) {
                option.textContent = `${m.nombreCompleto} (Ocupado)`;
                option.disabled = true;
                option.style.color = '#999';
                option.style.fontStyle = 'italic';
            } else {
                option.textContent = m.nombreCompleto;
            }
            
            selector.appendChild(option);
        });
        
        // Restaurar selección si era válida
        if (selectedValue && !maestrosOcupadosEnHora.includes(selectedValue)) {
            selector.value = selectedValue;
        }
    }

    renderizarCalendario() {
        const grid = document.getElementById('calendarGrid');
        const primerDia = new Date(this.añoActual, this.mesActual, 1);
        const ultimoDia = new Date(this.añoActual, this.mesActual + 1, 0);
        
        const inicioCalendario = new Date(primerDia);
        const diaSemana = primerDia.getDay();
        const diasAtras = diaSemana === 0 ? 6 : diaSemana - 1;
        inicioCalendario.setDate(primerDia.getDate() - diasAtras);
        
        let html = '';
        let fechaActual = new Date(inicioCalendario);
        
        for (let i = 0; i < 42; i++) {
            const claveEvento = this.obtenerClaveEvento(fechaActual);
            const eventosDelDia = this.eventos[claveEvento] || [];
            const esHoy = this.esHoy(fechaActual);
            const esMesActual = fechaActual.getMonth() === this.mesActual;
            
            const clasesDia = [
                'calendar-day',
                esHoy ? 'today' : '',
                !esMesActual ? 'other-month' : ''
            ].filter(Boolean).join(' ');
            
            html += `
                <div class="${clasesDia}" onclick="agendaMes.abrirModal('${claveEvento}', '${fechaActual.getDate()}/${fechaActual.getMonth() + 1}/${fechaActual.getFullYear()}')">
                    <div class="day-number">${fechaActual.getDate()}</div>
                    <button class="add-day-btn" onclick="event.stopPropagation(); agendaMes.abrirModal('${claveEvento}', '${fechaActual.getDate()}/${fechaActual.getMonth() + 1}/${fechaActual.getFullYear()}')">+</button>
                    <div class="day-events">
                        ${this.renderizarEventosMini(eventosDelDia)}
                    </div>
                </div>
            `;
            
            fechaActual.setDate(fechaActual.getDate() + 1);
        }

        grid.innerHTML = html;
    }

    renderizarEventosMini(eventos) {
        if (eventos.length === 0) return '';

        eventos.sort((a, b) => a.time.localeCompare(b.time));

        return eventos.map(evento => {
            let clase = '';
            if (evento.title && evento.title.includes(' - ')) {
                clase = evento.title.split(' - ')[1];
            }
            
            const claseCSS = clase.replace(/\s+/g, '-');
            const horaFormateada = this.formatearHoraMini(evento.time);
            
            return `
                <div class="mini-event clase-${claseCSS}" 
                     onclick="event.stopPropagation(); agendaMes.verDetalleEvento('${evento._id}')" 
                     title="${evento.title} - ${horaFormateada}${evento.description ? '\n' + evento.description : ''}">
                    ${horaFormateada} ${evento.title}
                </div>
            `;
        }).join('');
    }

    formatearHoraMini(hora) {
        const [horas, minutos] = hora.split(':');
        const horaNum = parseInt(horas);
        const periodo = horaNum >= 12 ? 'PM' : 'AM';
        const hora12 = horaNum > 12 ? horaNum - 12 : (horaNum === 0 ? 12 : horaNum);
        return `${hora12}:${minutos}${periodo}`;
    }

    formatearHora(hora) {
        const [horas, minutos] = hora.split(':');
        const horaNum = parseInt(horas);
        const periodo = horaNum >= 12 ? 'PM' : 'AM';
        const hora12 = horaNum > 12 ? horaNum - 12 : (horaNum === 0 ? 12 : horaNum);
        return `${hora12}:${minutos} ${periodo}`;
    }

    async cambiarMes(direccion) {
        this.mesActual += direccion;
        
        if (this.mesActual > 11) {
            this.mesActual = 0;
            this.añoActual++;
        } else if (this.mesActual < 0) {
            this.mesActual = 11;
            this.añoActual--;
        }
        
        await this.cargarEventos();
        this.renderizarCalendario();
        this.actualizarNavegacion();
    }

    actualizarNavegacion() {
        const indicador = document.getElementById('monthIndicator');
        indicador.textContent = `${this.meses[this.mesActual]} ${this.añoActual}`;
    }

    abrirModal(claveEvento, nombreDia) {
        this.fechaSeleccionada = claveEvento;
        this.nombreDiaSeleccionado = nombreDia;
        this.eventoEditando = null;
        
        document.getElementById('modalTitle').textContent = `Agregar Evento - ${nombreDia}`;
        document.getElementById('eventForm').reset();
        document.getElementById('errorMessage').style.display = 'none';
        
        document.getElementById('deleteBtn').style.display = 'none';
        
        document.getElementById('eventModal').style.display = 'block';
        
        this.actualizarOpcionesMaestros();
    }

    async verDetalleEvento(eventoId) {
        let eventoEncontrado = null;
        let claveEvento = null;
        
        for (const [fecha, eventosDelDia] of Object.entries(this.eventos)) {
            const evento = eventosDelDia.find(e => e._id === eventoId);
            if (evento) {
                eventoEncontrado = evento;
                claveEvento = fecha;
                break;
            }
        }
        
        if (eventoEncontrado) {
            await this.editarEvento(eventoId, claveEvento);
        }
    }

    async editarEvento(eventoId, claveEvento) {
        const eventosDelDia = this.eventos[claveEvento] || [];
        const evento = eventosDelDia.find(e => e._id === eventoId);
        
        if (!evento) {
            alert('Evento no encontrado');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/eventos/${eventoId}`);
            const eventoCompleto = response.ok ? await response.json() : evento;
            
            this.fechaSeleccionada = claveEvento;
            this.eventoEditando = eventoId;
            
            const fecha = new Date(claveEvento + 'T00:00:00');
            const nombreDia = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
            
            document.getElementById('modalTitle').textContent = `Editar Evento - ${nombreDia}`;
            
            document.getElementById('eventTime').value = eventoCompleto.time || '';
            
            if (eventoCompleto.nombreNino) {
                document.getElementById('nombreNino').value = eventoCompleto.nombreNino;
            } else if (eventoCompleto.title && eventoCompleto.title.includes(' - ')) {
                const partes = eventoCompleto.title.split(' - ');
                document.getElementById('nombreNino').value = partes[0] || '';
            } else {
                document.getElementById('nombreNino').value = eventoCompleto.title || '';
            }
            
            if (eventoCompleto.clase) {
                document.getElementById('clase').value = eventoCompleto.clase;
            } else if (eventoCompleto.title && eventoCompleto.title.includes(' - ')) {
                const partes = eventoCompleto.title.split(' - ');
                document.getElementById('clase').value = partes[1] || '';
            }
            
            this.actualizarOpcionesMaestros();
            document.getElementById('maestro').value = eventoCompleto.maestro || '';
            
            document.getElementById('caracteristicasNino').value = eventoCompleto.caracteristicas || '';
            
            let nombreTutor = '';
            let celularTutor = '';
            
            if (eventoCompleto.nombreTutor1) {
                nombreTutor = eventoCompleto.nombreTutor1;
            } else if (eventoCompleto.nombreTutor) {
                nombreTutor = eventoCompleto.nombreTutor;
            } else if (eventoCompleto.description) {
                const lineas = eventoCompleto.description.split('\n');
                const lineaTutor = lineas.find(linea => linea.startsWith('Tutor:'));
                if (lineaTutor) {
                    nombreTutor = lineaTutor.replace('Tutor:', '').trim();
                }
            }
            
            if (eventoCompleto.celularTutor1) {
                celularTutor = eventoCompleto.celularTutor1;
            } else if (eventoCompleto.celularTutor) {
                celularTutor = eventoCompleto.celularTutor;
            } else if (eventoCompleto.description) {
                const lineas = eventoCompleto.description.split('\n');
                const lineaTel = lineas.find(linea => linea.startsWith('Tel:'));
                if (lineaTel) {
                    celularTutor = lineaTel.replace('Tel:', '').trim();
                }
            }
            
            document.getElementById('nombreTutor1').value = nombreTutor;
            document.getElementById('celularTutor1').value = celularTutor;
            
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('deleteBtn').style.display = 'inline-block';
            
            document.getElementById('eventModal').style.display = 'block';
            
            console.log('Evento cargado para edición:', {
                eventoCompleto,
                nombreTutor,
                celularTutor
            });
            
        } catch (error) {
            console.error('Error obteniendo evento completo:', error);
            this.editarEventoBasico(evento, claveEvento);
        }
    }

    editarEventoBasico(evento, claveEvento) {
        this.fechaSeleccionada = claveEvento;
        this.eventoEditando = evento._id;
        
        const fecha = new Date(claveEvento + 'T00:00:00');
        const nombreDia = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
        
        document.getElementById('modalTitle').textContent = `Editar Evento - ${nombreDia}`;
        document.getElementById('eventTime').value = evento.time || '';
        
        if (evento.title && evento.title.includes(' - ')) {
            const partes = evento.title.split(' - ');
            document.getElementById('nombreNino').value = partes[0] || '';
            document.getElementById('clase').value = partes[1] || '';
        } else {
            document.getElementById('nombreNino').value = evento.title || '';
        }
        
        this.actualizarOpcionesMaestros();
        document.getElementById('maestro').value = '';
        document.getElementById('caracteristicasNino').value = '';
        document.getElementById('nombreTutor1').value = '';
        document.getElementById('celularTutor1').value = '';
        
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('deleteBtn').style.display = 'inline-block';
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
                
                // Cerrar el modal después de eliminar
                this.cerrarModal();
                
                // Mostrar mensaje de éxito
                alert('Evento eliminado correctamente');
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

    async validarDisponibilidadMaestro(maestro, fecha, hora, eventoId = null) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/maestros/disponibilidad`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    maestro,
                    fecha,
                    hora,
                    eventoId
                })
            });

            const result = await response.json();
            return result.disponible;
        } catch (error) {
            console.error('Error validando disponibilidad:', error);
            const maestrosOcupadosEnHora = this.maestrosOcupados[fecha]?.[hora] || [];
            return !maestrosOcupadosEnHora.includes(maestro);
        }
    }

    async guardarEvento() {
        const time = document.getElementById('eventTime').value;
        const nombreNino = document.getElementById('nombreNino').value.trim();
        const clase = document.getElementById('clase').value;
        const maestro = document.getElementById('maestro').value;
        const caracteristicas = document.getElementById('caracteristicasNino').value.trim();
        const nombreTutor = document.getElementById('nombreTutor1').value.trim();
        const celularTutor = document.getElementById('celularTutor1').value.trim();
        const saveBtn = document.getElementById('saveBtn');

        if (!time || !nombreNino || !clase || !maestro) {
            this.mostrarError('Por favor completa todos los campos requeridos');
            return;
        }

        // Validar disponibilidad del maestro
        const disponible = await this.validarDisponibilidadMaestro(
            maestro, 
            this.fechaSeleccionada, 
            time, 
            this.eventoEditando
        );

        if (!disponible) {
            this.mostrarError(`El maestro ${maestro} ya está ocupado en esta hora. Por favor selecciona otro maestro o cambia la hora.`);
            return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="loading-spinner"></span> Guardando...';

        try {
            const eventoData = {
                fecha: this.fechaSeleccionada,
                time,
                title: `${nombreNino} - ${clase}`,
                description: `Maestro: ${maestro}${caracteristicas ? `\nCaracterísticas: ${caracteristicas}` : ''}${nombreTutor ? `\nTutor: ${nombreTutor}` : ''}${celularTutor ? `\nTel: ${celularTutor}` : ''}`,
                nombreNino,
                clase,
                maestro,
                caracteristicas,
                nombreTutor1: nombreTutor,
                celularTutor1: celularTutor,
                nombreTutor: nombreTutor,
                celularTutor: celularTutor,
                userId: this.USER_ID
            };

            let response;
            if (this.eventoEditando) {
                response = await fetch(`${this.API_BASE_URL}/eventos/${this.eventoEditando}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(eventoData)
                });
            } else {
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
        
        // OCULTAR el botón de eliminar al cerrar el modal
        document.getElementById('deleteBtn').style.display = 'none';
        
        this.eventoEditando = null;
        this.fechaSeleccionada = null;
        this.nombreDiaSeleccionado = null;
    }
}

let agendaMes;
document.addEventListener('DOMContentLoaded', () => {
    agendaMes = new AgendaMensualMongoDB();
});

function closeModal() {
    agendaMes.cerrarModal();
}

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

function infantes() {
    window.location.href = '../pages/infant.html';
}

function masters() {
    window.location.href = '../pages/master.html';
}

function irTienda() {
    window.location.href = '../pages/tienda.html';
}

function volverSemanal() {
    window.location.href = '../pages/Administrador.html';
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