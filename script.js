// Data structure
let colaboradores = [];
let tasks = {}; // { weekKey: { colaboradorId: { dia: { manha: bool, tarde: bool } } } }
let currentWeekOffset = 0;

// Days of week
const diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
const diasSemanaFull = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

// Initialize
function init() {
    loadData();
    renderSchedule();
    updateStats();
    updateWeekDisplay();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('btnGerenciar').addEventListener('click', openModal);
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('btnAddColaborador').addEventListener('click', addColaborador);
    document.getElementById('inputNome').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addColaborador();
    });
    document.getElementById('btnPrevWeek').addEventListener('click', () => changeWeek(-1));
    document.getElementById('btnNextWeek').addEventListener('click', () => changeWeek(1));
    document.getElementById('btnToday').addEventListener('click', () => {
        currentWeekOffset = 0;
        updateWeekDisplay();
        renderSchedule();
        updateStats();
    });

    // Close modal on outside click
    document.getElementById('modalGerenciar').addEventListener('click', (e) => {
        if (e.target.id === 'modalGerenciar') closeModal();
    });
}

// Get week key
function getWeekKey() {
    const today = new Date();
    today.setDate(today.getDate() + (currentWeekOffset * 7));
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);
    return startOfWeek.toISOString().split('T')[0];
}

// Update week display
function updateWeekDisplay() {
    const weekKey = getWeekKey();
    const date = new Date(weekKey);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 6);
    
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const startStr = date.toLocaleDateString('pt-BR', options);
    const endStr = endDate.toLocaleDateString('pt-BR', options);
    
    document.getElementById('currentWeek').textContent = `Semana de ${startStr} a ${endStr}`;
}

// Change week
function changeWeek(offset) {
    currentWeekOffset += offset;
    updateWeekDisplay();
    renderSchedule();
    updateStats();
}

// Load data from localStorage
function loadData() {
    const savedColaboradores = localStorage.getItem('colaboradores');
    const savedTasks = localStorage.getItem('tasks');
    
    if (savedColaboradores) {
        colaboradores = JSON.parse(savedColaboradores);
    }
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('colaboradores', JSON.stringify(colaboradores));
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Open modal
function openModal() {
    document.getElementById('modalGerenciar').classList.remove('hidden');
    renderColaboradores();
}

// Close modal
function closeModal() {
    document.getElementById('modalGerenciar').classList.add('hidden');
    document.getElementById('inputNome').value = '';
}

// Add colaborador
function addColaborador() {
    const input = document.getElementById('inputNome');
    const nome = input.value.trim();
    
    if (!nome) {
        alert('Por favor, insira um nome válido');
        return;
    }

    const id = Date.now().toString();
    colaboradores.push({ id, nome });
    saveData();
    input.value = '';
    renderColaboradores();
    renderSchedule();
    updateStats();
}

// Remove colaborador
function removeColaborador(id) {
    if (confirm('Deseja realmente remover este colaborador?')) {
        colaboradores = colaboradores.filter(c => c.id !== id);
        
        // Remove all tasks for this colaborador
        Object.keys(tasks).forEach(weekKey => {
            if (tasks[weekKey][id]) {
                delete tasks[weekKey][id];
            }
        });
        
        saveData();
        renderColaboradores();
        renderSchedule();
        updateStats();
    }
}

// Render colaboradores list
function renderColaboradores() {
    const list = document.getElementById('listColaboradores');
    const emptyMsg = document.getElementById('emptyMessage');
    
    if (colaboradores.length === 0) {
        list.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        return;
    }

    emptyMsg.classList.add('hidden');
    list.innerHTML = colaboradores.map(c => `
        <li class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span class="font-medium text-gray-900">${c.nome}</span>
            <button onclick="removeColaborador('${c.id}')" 
                class="text-red-500 hover:text-red-700 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </li>
    `).join('');
}

// Render schedule
function renderSchedule() {
    const tbody = document.getElementById('scheduleBody');
    const weekKey = getWeekKey();
    
    if (!tasks[weekKey]) {
        tasks[weekKey] = {};
    }

    if (colaboradores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                    Nenhum colaborador cadastrado. Clique em "Gerenciar Colaboradores" para adicionar.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = colaboradores.map(colaborador => {
        if (!tasks[weekKey][colaborador.id]) {
            tasks[weekKey][colaborador.id] = {};
            diasSemana.forEach(dia => {
                tasks[weekKey][colaborador.id][dia] = { manha: false, tarde: false };
            });
        }

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white">
                    ${colaborador.nome}
                </td>
                ${diasSemana.map((dia, index) => {
                    const dayTasks = tasks[weekKey][colaborador.id][dia] || { manha: false, tarde: false };
                    return `
                        <td class="px-2 py-3">
                            <div class="space-y-1">
                                <label class="flex items-center justify-center cursor-pointer group">
                                    <input type="checkbox" 
                                        ${dayTasks.manha ? 'checked' : ''} 
                                        onchange="toggleTask('${weekKey}', '${colaborador.id}', '${dia}', 'manha')"
                                        class="sr-only">
                                    <div class="w-full px-2 py-1.5 rounded ${dayTasks.manha ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} text-xs font-medium text-center group-hover:ring-2 group-hover:ring-blue-300 transition-all">
                                        ${dayTasks.manha ? '✓' : ''} Manhã
                                    </div>
                                </label>
                                <label class="flex items-center justify-center cursor-pointer group">
                                    <input type="checkbox" 
                                        ${dayTasks.tarde ? 'checked' : ''} 
                                        onchange="toggleTask('${weekKey}', '${colaborador.id}', '${dia}', 'tarde')"
                                        class="sr-only">
                                    <div class="w-full px-2 py-1.5 rounded ${dayTasks.tarde ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} text-xs font-medium text-center group-hover:ring-2 group-hover:ring-blue-300 transition-all">
                                        ${dayTasks.tarde ? '✓' : ''} Tarde
                                    </div>
                                </label>
                            </div>
                        </td>
                    `;
                }).join('')}
            </tr>
        `;
    }).join('');
}

// Toggle task
function toggleTask(weekKey, colaboradorId, dia, turno) {
    if (!tasks[weekKey]) tasks[weekKey] = {};
    if (!tasks[weekKey][colaboradorId]) tasks[weekKey][colaboradorId] = {};
    if (!tasks[weekKey][colaboradorId][dia]) {
        tasks[weekKey][colaboradorId][dia] = { manha: false, tarde: false };
    }

    tasks[weekKey][colaboradorId][dia][turno] = !tasks[weekKey][colaboradorId][dia][turno];
    saveData();
    renderSchedule();
    updateStats();
}

// Update statistics
function updateStats() {
    const weekKey = getWeekKey();
    let completed = 0;
    let total = 0;

    if (tasks[weekKey]) {
        Object.values(tasks[weekKey]).forEach(colaboradorTasks => {
            Object.values(colaboradorTasks).forEach(dayTasks => {
                if (dayTasks.manha !== undefined) {
                    total++;
                    if (dayTasks.manha) completed++;
                }
                if (dayTasks.tarde !== undefined) {
                    total++;
                    if (dayTasks.tarde) completed++;
                }
            });
        });
    }

    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statRate').textContent = rate + '%';
}

// Make functions global
window.removeColaborador = removeColaborador;
window.toggleTask = toggleTask;

// Start app
document.addEventListener('DOMContentLoaded', init);