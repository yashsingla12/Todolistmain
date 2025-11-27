// DOM Elements
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const filterTabs = document.querySelectorAll('.filter-tab');
const searchInput = document.getElementById('search-input');
const emptyState = document.getElementById('empty-state');
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const progressCircle = document.getElementById('progress-circle');
const progressText = document.getElementById('progress-text');
const upcomingTasksList = document.getElementById('upcoming-tasks');
const themeToggle = document.getElementById('theme-toggle');
const clearCompletedBtn = document.getElementById('clear-completed');
const clearAllBtn = document.getElementById('clear-all');

// Task data
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let searchQuery = '';

// Initialize the app
function init() {
    renderTasks();
    updateStats();
    updateProgress();
    updateUpcomingTasks();
    
    // Event listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderTasks();
        });
    });
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTasks();
    });
    
    themeToggle.addEventListener('change', toggleTheme);
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    clearAllBtn.addEventListener('click', clearAllTasks);
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.min = today;
    
    // Check if dark mode is enabled
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('light-theme');
        themeToggle.checked = false;
    } else {
        document.body.classList.remove('light-theme');
        themeToggle.checked = true;
    }
}

// Add a new task
function addTask() {
    const title = taskInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value;
    
    if (title === '') {
        alert('Please enter a task title');
        return;
    }
    
    const newTask = {
        id: Date.now(),
        title,
        priority,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    updateProgress();
    updateUpcomingTasks();
    
    // Reset input
    taskInput.value = '';
    dueDateInput.value = '';
    taskInput.focus();
}

// Toggle task completion
function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
    updateStats();
    updateProgress();
    updateUpcomingTasks();
}

// Delete a task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
        updateProgress();
        updateUpcomingTasks();
    }
}

// Edit a task
function editTask(id) {
    const task = tasks.find(task => task.id === id);
    const newTitle = prompt('Edit task title:', task.title);
    
    if (newTitle !== null && newTitle.trim() !== '') {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, title: newTitle.trim() };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        updateUpcomingTasks();
    }
}

// Clear completed tasks
function clearCompletedTasks() {
    if (confirm('Are you sure you want to clear all completed tasks?')) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStats();
        updateProgress();
        updateUpcomingTasks();
    }
}

// Clear all tasks
function clearAllTasks() {
    if (confirm('Are you sure you want to clear ALL tasks? This cannot be undone.')) {
        tasks = [];
        saveTasks();
        renderTasks();
        updateStats();
        updateProgress();
        updateUpcomingTasks();
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Render tasks based on current filter and search
function renderTasks() {
    // Filter tasks based on current filter and search query
    let filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery);
        
        if (currentFilter === 'all') return matchesSearch;
        if (currentFilter === 'active') return !task.completed && matchesSearch;
        if (currentFilter === 'completed') return task.completed && matchesSearch;
        if (currentFilter === 'high') return task.priority === 'high' && matchesSearch;
        
        return matchesSearch;
    });
    
    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
        taskList.innerHTML = '';
        taskList.appendChild(emptyState);
    } else {
        emptyState.style.display = 'none';
        
        // Create task elements
        const taskElements = filteredTasks.map(task => {
            const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
            
            return `
                <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-checkbox" onclick="toggleTask(${task.id})"></div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span class="task-priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
                            <span class="task-due">
                                <i class="far fa-calendar"></i> ${dueDate}
                            </span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" onclick="editTask(${task.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="deleteTask(${task.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `;
        }).join('');
        
        taskList.innerHTML = taskElements;
    }
}

// Update statistics
function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    totalTasksEl.textContent = totalTasks;
    completedTasksEl.textContent = completedTasks;
    pendingTasksEl.textContent = pendingTasks;
}

// Update progress circle
function updateProgress() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Update progress circle
    const circumference = 314; // 2 * π * r (r=50)
    const offset = circumference - (progress / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
    
    // Update progress text
    progressText.textContent = `${progress}%`;
}

// Update upcoming tasks
function updateUpcomingTasks() {
    // Get incomplete tasks with due dates
    const upcomingTasks = tasks
        .filter(task => !task.completed && task.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5); // Show only 5 upcoming tasks
    
    if (upcomingTasks.length === 0) {
        upcomingTasksList.innerHTML = '<p style="text-align: center; color: var(--gray);">No upcoming tasks</p>';
    } else {
        const upcomingElements = upcomingTasks.map(task => {
            const dueDate = new Date(task.dueDate).toLocaleDateString();
            
            return `
                <li class="upcoming-task">
                    <div class="task-priority priority-${task.priority}"></div>
                    <div>
                        <div>${task.title}</div>
                        <div style="font-size: 0.8rem; color: var(--gray);">Due: ${dueDate}</div>
                    </div>
                </li>
            `;
        }).join('');
        
        upcomingTasksList.innerHTML = upcomingElements;
    }
}

// Toggle theme
function toggleTheme() {
    if (themeToggle.checked) {
        document.body.classList.remove('light-theme');
        localStorage.setItem('darkMode', 'disabled');
    } else {
        document.body.classList.add('light-theme');
        localStorage.setItem('darkMode', 'enabled');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);