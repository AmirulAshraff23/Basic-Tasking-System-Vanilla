let tasks = [];
let nextId = 1;
let currentPage = 1;
const tasksPerPage = 10; // Number of tasks to display per page
//deleteButton.classList.add('delete-button');


document.getElementById('taskForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const taskName = document.getElementById('taskName').value.trim();
    const parentTaskId = document.getElementById('parentTaskId').value.trim();

    if (taskName) {
        if (isCircularDependency(parentTaskId)) {
            alert("Circular dependency detected!");
            return;
        }

        addTask(taskName, parentTaskId); // Only call this once
        document.getElementById('taskName').value = '';
        document.getElementById('parentTaskId').value = '';
    }
});

document.getElementById('prevPage').addEventListener('click', () => {
    const currentPage = getCurrentPage();
    if (currentPage > 1) {
        localStorage.setItem('currentPage', currentPage - 1);
        renderTasks();
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    const currentPage = getCurrentPage();
    const totalPages = getTotalPages(filterTasks());
    if (currentPage < totalPages) {
        localStorage.setItem('currentPage', currentPage + 1);
        renderTasks();
    }
});

function addTask(taskName, parentTaskId) {
    const newTask = {
        id: Date.now(),
        name: taskName,
        parentId: parentTaskId ? parseInt(parentTaskId) : null, // Set parentId if provided
        status: 'IN_PROGRESS'
    };
    tasks.push(newTask);
    renderTasks();
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


function renderTasks() {
    console.log('Rendering tasks...');
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Clear the current list

    const filteredTasks = filterTasks();
    const taskMap = createTaskMap(filteredTasks);
    const currentPage = getCurrentPage(); // Get the current page number
    const totalPages = getTotalPages(filteredTasks); // Get the total number of pages

    // Render top-level tasks
    const tasksPerPage = 5; // Number of tasks per page
    const startTaskIndex = (currentPage - 1) * tasksPerPage;
    const endTaskIndex = startTaskIndex + tasksPerPage;
    const tasksToRender = filteredTasks.slice(startTaskIndex, endTaskIndex);

    tasksToRender.forEach(task => {
        if (!task.parentId) {
            const taskElement = createTaskElement(task, taskMap);
            taskList.appendChild(taskElement);
        }
    });

    // Update pagination controls
    const pageNumberElement = document.getElementById('pageNumber');
    pageNumberElement.textContent = `Page ${currentPage} of ${totalPages}`;

    console.log('Tasks rendered.');
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

function getCurrentPage() {
    const currentPage = parseInt(localStorage.getItem('currentPage')) || 1;
    return currentPage;
}

function getTotalPages(tasks) {
    const tasksPerPage = 10; // Number of tasks per page
    const totalPages = Math.ceil(tasks.length / tasksPerPage);
    return totalPages;
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
    
    // Create a span to display the task name
    const taskDisplay = document.createElement('span');
    taskDisplay.textContent = task.name;
    li.appendChild(taskDisplay);

    // Create an input for task name (initially hidden)
    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.value = task.name;
    taskInput.style.display = 'none'; // Hide initially
    li.appendChild(taskInput);

    // Create an edit button
    const editButton = document.createElement('button');
    editButton.textContent = 'Rename'; // Initial text
    editButton.style.marginLeft = '10px'; // Add margin for spacing
    editButton.addEventListener('click', () => {
        // Toggle visibility of display/input
        if (taskDisplay.style.display === 'none') {
            taskDisplay.style.display = 'inline'; // Show display
            taskInput.style.display = 'none'; // Hide input
            editButton.textContent = 'Rename'; // Reset button text
            updateTaskName(task.id, taskInput.value); // Update on save
        } else {
            taskDisplay.style.display = 'none'; // Hide display
            taskInput.style.display = 'inline'; // Show input
            taskInput.focus(); // Focus on input for editing
            editButton.textContent = 'Confirm'; // Change button text to Confirm
        }
    });
    li.appendChild(editButton);

    // Create a checkbox for task status
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.status === 'DONE';
    checkbox.addEventListener('change', () => toggleTaskStatus(task.id));

    li.prepend(checkbox);
    
    // Create a delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'X'; // Simple delete button
    deleteButton.style.color = 'white'; // White text
    deleteButton.style.backgroundColor = 'red'; // Red background
    deleteButton.style.border = 'none'; // No border
    deleteButton.style.borderRadius = '5px'; // Rounded corners
    deleteButton.style.padding = '5px 10px'; // Padding for better appearance
    deleteButton.style.marginLeft = '10px'; // Add margin for spacing
    deleteButton.addEventListener('click', () => {
        deleteTask(task.id); // Call delete function
    });
    li.appendChild(deleteButton);
    
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

function deleteTask(taskId) {
    // Remove the task from the tasks array
    tasks = tasks.filter(task => task.id !== taskId);
    renderTasks(); // Re-render the task list
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

function updateTaskName(taskId, newName) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.name = newName; // Update task name
        renderTasks(); // Re-render tasks to reflect changes
    }
}

function openEditForm(task) {
    document.getElementById('taskName').value = task.name;
    document.getElementById('parentTaskId').value = task.parentId || '';
    document.getElementById('taskForm').onsubmit = (event) => {
        event.preventDefault();
        updateTask(task.id); // Call updateTask directly
    };
}

function filterTasks() {
    const filterValue = document.getElementById('statusFilter').value;
    if (filterValue === 'all') return tasks;

    return tasks.filter(task => task.status.toLowerCase() === filterValue.toLowerCase().replace(' ', '-'));
}

function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return; // Exit if task not found

    // Toggle the task status
    if (task.status === 'IN PROGRESS') {
        task.status = 'DONE'; // Mark as done
        checkDependenciesStatus(task); // Check dependencies
    } else {
        task.status = 'IN PROGRESS'; // Mark as in progress
        updateParentStatus(task); // Update parent status
    }

    renderTasks(); // Re-render tasks to reflect changes
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