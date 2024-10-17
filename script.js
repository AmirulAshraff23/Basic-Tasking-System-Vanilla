let tasks = [];
let nextId = 1;

document.getElementById('taskForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const taskName = document.getElementById('taskName').value.trim();
    const parentTaskId = document.getElementById('parentTaskId').value.trim();
    
    if (taskName) {
        if (isCircularDependency(parentTaskId)) {
            alert("Circular dependency detected!");
            return;
        }
        
        addTask(taskName, parentTaskId);
        document.getElementById('taskName').value = '';
        document.getElementById('parentTaskId').value = '';
        renderTasks();
    }
});

function addTask(name, parentId) {
    const newTask = {
        id: nextId++,
        name: name,
        status: 'IN PROGRESS',
        parentId: parentId ? parseInt(parentId) : null,
        dependencies: []
    };
    tasks.push(newTask);
}

function isCircularDependency(parentId) {
    // Check if the parentId exists and if adding this task would create a circular dependency
    if (!parentId) return false; // No parent means no circular dependency

    const parentTask = tasks.find(task => task.id === parseInt(parentId));
    if (!parentTask) return false; // Parent task does not exist

    // Check if the current task is a dependency of its own parent
    return checkCircularDependency(parentTask.id, parentId);
}

function checkCircularDependency(currentId, targetId) {
    const currentTask = tasks.find(task => task.id === currentId);
    if (!currentTask || !currentTask.parentId) return false;

    if (currentTask.parentId === parseInt(targetId)) {
        return true; // Circular dependency found
    }

    return checkCircularDependency(currentTask.parentId, targetId);
}

let currentPage = 1;
const tasksPerPage = 5; // Number of tasks to display per page

function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Clear the current list

    const filteredTasks = filterTasks();
    const taskMap = createTaskMap(filteredTasks);
    
    // Calculate start and end indices for pagination
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    // Render top-level tasks
    paginatedTasks.forEach(task => {
        if (!task.parentId) {
            const taskElement = createTaskElement(task, taskMap);
            taskList.appendChild(taskElement);
        }
    });

    // Add pagination controls
    updatePaginationControls(filteredTasks.length);
}

function updatePaginationControls(totalTasks) {
    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = ''; // Clear existing controls

    const totalPages = Math.ceil(totalTasks / tasksPerPage);
    
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTasks();
        }
    });
    paginationControls.appendChild(prevButton);
    
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTasks();
        }
    });
    paginationControls.appendChild(nextButton);
}

function createTaskMap(tasks) {
    const map = {};
    tasks.forEach(task => {
        map[task.id] = task;
        map[task.id].children = []; // Initialize children array
    });
    tasks.forEach(task => {
        if (task.parentId) {
            map[task.parentId].children.push(map[task.id]); // Add task to its parent's children
        }
    });
    return map;
}

function createTaskElement(task, taskMap) {
    const li = document.createElement('li');
    li.textContent = `${task.id}: ${task.name} - ${task.status}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.status === 'DONE';
    checkbox.addEventListener('change', () => toggleTaskStatus(task.id));

    li.prepend(checkbox);
    
    // Create edit button
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => openEditForm(task));
    li.appendChild(editButton);

    // Create a nested list for child tasks
    if (taskMap[task.id].children.length > 0) {
        const childList = document.createElement('ul');
        taskMap[task.id].children.forEach(childTask => {
            const childElement = createTaskElement(childTask, taskMap);
            childList.appendChild(childElement);
        });
        li.appendChild(childList);
    }

    return li;
}

function openEditForm(task) {
    document.getElementById('taskName').value = task.name;
    document.getElementById('parentTaskId').value = task.parentId || '';
    document.getElementById('taskForm').onsubmit = (event) => {
        event.preventDefault();
        updateTask(task.id);
    };
}

function updateTask(taskId) {
    const taskName = document.getElementById('taskName').value.trim();
    const parentTaskId = document.getElementById('parentTaskId').value.trim();

    if (taskName) {
        // Check for circular dependency
        if (isCircularDependency(parentTaskId)) {
            alert("Circular dependency detected!");
            return;
        }

        const task = tasks.find(t => t.id === taskId);
        task.name = taskName;
        task.parentId = parentTaskId ? parseInt(parentTaskId) : null;

        renderTasks();
        document.getElementById('taskName').value = '';
        document.getElementById('parentTaskId').value = '';
        document.getElementById('taskForm').onsubmit = (event) => {
            event.preventDefault();
            addTask(taskName, parentTaskId);
        };
    }
}

function filterTasks() {
    const filterValue = document.getElementById('statusFilter').value;
    if (filterValue === 'all') return tasks;

    return tasks.filter(task => task.status.toLowerCase() === filterValue.toLowerCase().replace(' ', '-'));
}

function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === 'IN PROGRESS') {
        task.status = 'DONE';
        checkDependenciesStatus(task);
    } else {
        task.status = 'IN PROGRESS';
        updateParentStatus(task);
    }

    renderTasks();
}

function checkDependenciesStatus(task) {
    const dependencies = tasks.filter(t => t.parentId === task.id);
    if (dependencies.length === 0) {
        task.status = 'COMPLETE';
    } else {
        const allComplete = dependencies.every(dep => dep.status === 'COMPLETE');
        if (allComplete) {
            task.status = 'COMPLETE';
        }
    }
}

function updateParentStatus(task) {
    if (task.parentId) {
        const parentTask = tasks.find(t => t.id === task.parentId);
        if (parentTask && parentTask.status !== 'DONE') {
            parentTask.status = 'DONE'; // Update parent's status to DONE
            updateParentStatus(parentTask); // Recursively update parent status
        }
    }
}

// Initial rendering of tasks
renderTasks();