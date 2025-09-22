// Configuración de usuarios válidos
const users = [
    { username: "admin", password: "admin" }
];

// Estado de la aplicación
let currentUser = null;
let todos = [];
let editingTodoId = null;

// Elementos del DOM
const loginPage = document.getElementById('login-page');
const todoPage = document.getElementById('todo-page');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const addTodoForm = document.getElementById('add-todo-form');
const todosContainer = document.getElementById('todos-container');
const loginError = document.getElementById('login-error');
const todoError = document.getElementById('todo-error');

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setupEventListeners();
});

// Función de inicialización
function initializeApp() {
    // Verificar si el usuario ya está autenticado
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showTodoPage();
        loadTodos();
        loadExternalTodos();
    } else {
        showLoginPage();
    }
}


function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    addTodoForm.addEventListener('submit', handleAddTodo);
}

// Manejo del login
function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validar credenciales
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showTodoPage();
        loadTodos();
        loadExternalTodos();
        hideError(loginError);
    } else {
        showError(loginError, 'Credenciales incorrectas. Intenta nuevamente.');
    }
}

// Manejo del logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('todos');
    showLoginPage();
}

// Agregar nueva tarea
function handleAddTodo(e) {
    e.preventDefault();

    const todoText = document.getElementById('todo-text').value.trim();

    if (validateTodoText(todoText)) {
        const newTodo = {
            id: Date.now(),
            text: todoText,
            done: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        todos.push(newTodo);
        saveTodos();
        renderTodos();
        addTodoForm.reset();
        hideError(todoError);
    }
}

// 
function validateTodoText(text) {
    // Verificar que no esté vacío
    if (!text || text.trim() === '') {
        showError(todoError, 'El campo de texto no puede estar vacío.');
        return false;
    }

    // Verificar longitud mínima
    if (text.length < 10) {
        showError(todoError, 'La tarea debe tener al menos 10 caracteres.');
        return false;
    }

    // Verificar que no sea solo números
    if (/^\d+$/.test(text)) {
        showError(todoError, 'La tarea no puede contener solo números.');
        return false;
    }

    // Verificar que no esté duplicada
    const isDuplicate = todos.some(todo =>
        todo.text.toLowerCase() === text.toLowerCase() && todo.id !== editingTodoId
    );

    if (isDuplicate) {
        showError(todoError, 'Ya existe una tarea con este texto.');
        return false;
    }

    return true;
}

// Alternar estado de completado de una tarea
function toggleTodo(id) {
    // Convertir id a string 
    const todoId = String(id);
    const todo = todos.find(t => String(t.id) === todoId);
    if (todo) {
        todo.done = !todo.done;
        todo.updatedAt = Date.now();
        saveTodos();
        renderTodos();
    }
}

// Funcion para iniciar una tarea
function startEditTodo(id) {
    editingTodoId = id;
    renderTodos();
}

// Guardar edición de una tarea
function saveEditTodo(id, newText) {
    const todoId = String(id);
    const todo = todos.find(t => String(t.id) === todoId);
    if (todo && validateTodoText(newText)) {
        todo.text = newText.trim();
        todo.updatedAt = Date.now();
        saveTodos();
        editingTodoId = null;
        renderTodos();
        hideError(todoError);
        return true;
    }
    return false;
}

// Cancelar edición de una tarea
function cancelEditTodo() {
    editingTodoId = null;
    renderTodos();
    hideError(todoError);
}

// Eliminar una tarea
function deleteTodo(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        const todoId = String(id);
        todos = todos.filter(t => String(t.id) !== todoId);
        saveTodos();
        renderTodos();
    }
}

// Renderizar todas las tareas
function renderTodos() {
    if (todos.length === 0) {
        todosContainer.innerHTML = '<div class="no-todos">No tienes tareas pendientes. ¡Agrega una nueva!</div>';
        return;
    }

    // Ordenar tareas por fecha de creación (más recientes primero)
    const sortedTodos = [...todos].sort((a, b) => b.createdAt - a.createdAt);

    todosContainer.innerHTML = sortedTodos.map(todo => `
        <div class="todo-item ${todo.done ? 'completed' : ''}">
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${todo.done ? 'checked' : ''} 
                onchange="toggleTodo('${todo.id}')"
            >
            <div class="todo-content">
                ${editingTodoId === todo.id ?
            `<input 
                        type="text" 
                        class="todo-text editing" 
                        value="${escapeHtml(todo.text)}" 
                        onkeypress="handleEditKeypress(event, '${todo.id}')"
                        onblur="saveEditTodo('${todo.id}', this.value)"
                        autofocus
                    >` :
            `<div class="todo-text">${escapeHtml(todo.text)}</div>`
        }
                <div class="todo-meta">
                    Creada: ${formatDate(todo.createdAt)}
                    ${todo.updatedAt !== todo.createdAt ? ` | Actualizada: ${formatDate(todo.updatedAt)}` : ''}
                </div>
            </div>
            <div class="todo-actions">
                ${editingTodoId === todo.id ?
            `<button class="todo-btn save-btn" onclick="saveEditTodo('${todo.id}', document.querySelector('.todo-text.editing').value)">Guardar</button>
                    <button class="todo-btn cancel-btn" onclick="cancelEditTodo()">Cancelar</button>` :
            `<button class="todo-btn edit-btn" onclick="startEditTodo('${todo.id}')">Editar</button>
                    <button class="todo-btn delete-btn" onclick="deleteTodo('${todo.id}')">Eliminar</button>`
        }
            </div>
        </div>
    `).join('');
}

// Manejar tecla Enter en edición
function handleEditKeypress(event, id) {
    if (event.key === 'Enter') {
        saveEditTodo(id, event.target.value);
    } else if (event.key === 'Escape') {
        cancelEditTodo();
    }
}

// Cargar tareas desde localStorage
function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    } else {
        todos = [];
    }
    renderTodos();
}

// Guardar tareas en localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Cargar tareas desde API externa
async function loadExternalTodos() {
    try {
        const response = await fetch('https://dummyjson.com/c/28e8-a101-4223-a35c');
        const data = await response.json();

        if (data && Array.isArray(data)) {
            // Agregar tareas externas
            const externalTodos = data.map(todo => ({
                id: `external_${todo.id}`,
                text: todo.text,
                done: todo.done,
                createdAt: todo.createdAt,
                updatedAt: todo.updatedAt
            }));

            // Filtrar tareas externas existentes
            const newExternalTodos = externalTodos.filter(externalTodo =>
                !todos.some(localTodo => localTodo.id === externalTodo.id)
            );

            todos.push(...newExternalTodos);
            saveTodos();
            renderTodos();
        }
    } catch (error) {
        console.error('Error al cargar tareas externas:', error);
    }
}

// Login
function showLoginPage() {
    loginPage.classList.add('active');
    todoPage.classList.remove('active');
}

// Tareas
function showTodoPage() {
    todoPage.classList.add('active');
    loginPage.classList.remove('active');
}

// Mostrar mensaje de error
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

// Ocultar mensaje de error
function hideError(element) {
    element.style.display = 'none';
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Formatear fecha
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
