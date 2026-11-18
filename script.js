
// ========================================
// TASKIE! — YOUR HAPPY PLANNER
// ========================================

// DOM ELEMENTS
const taskList = document.getElementById("taskList");
const addTaskForm = document.getElementById("addTaskForm");
const taskInput = document.getElementById("taskInput");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskDueDate = document.getElementById("taskDueDate");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");

const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");
const progressMessage = document.getElementById("progressMessage");

const emptyState = document.getElementById("emptyState");
const taskCount = document.getElementById("taskCount");
const listTitle = document.getElementById("listTitle");
const pageTitle = document.getElementById("pageTitle");

const editModal = document.getElementById("editModal");
const editTaskForm = document.getElementById("editTaskForm");
const editTaskInput = document.getElementById("editTaskInput");
const editTaskCategory = document.getElementById("editTaskCategory");
const editTaskPriority = document.getElementById("editTaskPriority");
const editTaskDueDate = document.getElementById("editTaskDueDate");

const toast = document.getElementById("toast");

// ========================================
// APPLICATION STATE
// ========================================

let tasks = JSON.parse(localStorage.getItem("taskie.tasks.v2") || "[]");

if (!Array.isArray(tasks)) {
  tasks = [];
}

let currentView = "all";
let currentFilter = "all";
let selectedCategory = null;
let editingTaskId = null;
let toastTimer;

// ========================================
// LOCAL STORAGE
// ========================================

function saveTasks() {
  localStorage.setItem("taskie.tasks.v2", JSON.stringify(tasks));
}

function saveTheme(theme) {
  localStorage.setItem("taskie.theme.v2", theme);
}

function saveDarkMode(value) {
  localStorage.setItem("taskie.dark.v1", String(value));
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function createId() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2300);
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ========================================
// DATE DISPLAY
// ========================================

document.getElementById("todayDate").textContent =
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).toUpperCase();

// ========================================
// ADD TASK
// ========================================

addTaskForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = taskInput.value.trim();

  if (!name) {
    showToast("Please enter a task!");
    return;
  }

  const newTask = {
    id: createId(),
    name: name,
    category: taskCategory.value,
    priority: taskPriority.value,
    dueDate: taskDueDate.value,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);

  saveTasks();

  addTaskForm.reset();

  taskCategory.value = "Study";
  taskPriority.value = "Medium";

  currentView = "all";
  currentFilter = "all";
  selectedCategory = null;

  updateActiveButtons();
  renderTasks();

  showToast("Task added successfully! ✨");
  taskInput.focus();
});

// ========================================
// DISPLAY TASKS
// ========================================

function getFilteredTasks() {
  let filtered = [...tasks];

  // Sidebar navigation
  if (currentView === "pending") {
    filtered = filtered.filter(task => !task.completed);
  }

  if (currentView === "completed") {
    filtered = filtered.filter(task => task.completed);
  }

  // Category filter
  if (selectedCategory) {
    filtered = filtered.filter(
      task => task.category === selectedCategory
    );
  }

  // All / Pending / Completed filters
  if (currentFilter === "pending") {
    filtered = filtered.filter(task => !task.completed);
  }

  if (currentFilter === "completed") {
    filtered = filtered.filter(task => task.completed);
  }

  return filtered;
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  taskList.innerHTML = "";

  emptyState.style.display =
    filteredTasks.length === 0 ? "block" : "none";

  taskCount.textContent =
    filteredTasks.length +
    (filteredTasks.length === 1 ? " task" : " tasks");

  // Render every task
  filteredTasks.forEach(task => {
    const card = document.createElement("article");

    card.className =
      "task-card" + (task.completed ? " completed" : "");

    const priorityClass = {
      High: "priority-high",
      Medium: "priority-medium",
      Low: "priority-low"
    }[task.priority] || "priority-medium";

    const dueDateText = task.dueDate
      ? `📅 ${formatDate(task.dueDate)}`
      : "";

    const dueDateClass =
      task.dueDate && task.dueDate < getTodayDate() && !task.completed
        ? " overdue"
        : "";

    card.innerHTML = `
      <input
        type="checkbox"
        class="task-check"
        aria-label="Complete task"
        ${task.completed ? "checked" : ""}
      >

      <div class="task-details">
        <p class="task-name">${escapeHTML(task.name)}</p>

        <div class="task-meta">
          <span class="meta-tag">
            ${escapeHTML(task.category)}
          </span>

          <span class="meta-tag ${priorityClass}">
            ${escapeHTML(task.priority)} priority
          </span>

          ${
            dueDateText
              ? `<span class="meta-tag${dueDateClass}">
                  ${dueDateText}
                </span>`
              : ""
          }
        </div>
      </div>

      <div class="task-actions">
        <button class="edit-btn" aria-label="Edit task" title="Edit">✎</button>
        <button class="delete-btn" aria-label="Delete task" title="Delete">🗑</button>
      </div>
    `;

    // Complete / uncomplete task
    card.querySelector(".task-check").addEventListener("change", function() {
      toggleTask(task.id);
    });

    // Edit task
    card.querySelector(".edit-btn").addEventListener("click", function() {
      openEditModal(task.id);
    });

    // Delete task
    card.querySelector(".delete-btn").addEventListener("click", function() {
      deleteTask(task.id);
    });

    taskList.appendChild(card);
  });

  updateStats();
  updateListHeading();
}

// ========================================
// COMPLETE / UNCOMPLETE TASK
// ========================================

function toggleTask(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  task.completed = !task.completed;

  saveTasks();
  renderTasks();

  showToast(
    task.completed
      ? "Wonderful! Task completed 🎉"
      : "Task moved back to pending"
  );
}

// ========================================
// DELETE TASK
// ========================================

function deleteTask(id) {
  const confirmed = confirm("Are you sure you want to delete this task?");

  if (!confirmed) return;

  tasks = tasks.filter(task => task.id !== id);

  saveTasks();
  renderTasks();

  showToast("Task deleted!");
}

// ========================================
// EDIT TASK
// ========================================

function openEditModal(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  editingTaskId = id;

  editTaskInput.value = task.name;
  editTaskCategory.value = task.category;
  editTaskPriority.value = task.priority;
  editTaskDueDate.value = task.dueDate || "";

  editModal.classList.add("open");
  editTaskInput.focus();
}

function closeEditModal() {
  editModal.classList.remove("open");
  editingTaskId = null;
}

document.getElementById("closeEdit").addEventListener(
  "click",
  closeEditModal
);

editModal.addEventListener("click", function(event) {
  if (event.target === editModal) {
    closeEditModal();
  }
});

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    closeEditModal();
  }
});

editTaskForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const task = tasks.find(item => item.id === editingTaskId);

  if (!task) return;

  const newName = editTaskInput.value.trim();

  if (!newName) {
    showToast("Task name cannot be empty!");
    return;
  }

  task.name = newName;
  task.category = editTaskCategory.value;
  task.priority = editTaskPriority.value;
  task.dueDate = editTaskDueDate.value;

  saveTasks();
  closeEditModal();
  renderTasks();

  showToast("Task updated successfully! ✨");
});

// ========================================
// UPDATE STATISTICS AND PROGRESS
// ========================================

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;

  const percentage = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  totalTasks.textContent = total;
  pendingTasks.textContent = pending;
  completedTasks.textContent = completed;

  progressPercent.textContent = percentage + "%";
  progressFill.style.width = percentage + "%";

  if (total === 0) {
    progressMessage.textContent =
      "Add your first task and get started!";
  } else if (percentage === 100) {
    progressMessage.textContent =
      "Amazing! You completed everything! 🎉";
  } else if (percentage >= 50) {
    progressMessage.textContent =
      "You're doing great. Keep going!";
  } else {
    progressMessage.textContent =
      "Every task completed is a little victory!";
  }
}

// ========================================
// SIDEBAR NAVIGATION
// ========================================

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", function() {
    currentView = this.dataset.view;

    currentFilter = "all";
    selectedCategory = null;

    updateActiveButtons();
    renderTasks();

    document.querySelector(".task-list-section")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// ========================================
// CATEGORY FILTERS
// ========================================

document.querySelectorAll(".category-btn").forEach(button => {
  button.addEventListener("click", function() {
    const category = this.dataset.category;

    if (selectedCategory === category) {
      selectedCategory = null;
    } else {
      selectedCategory = category;
    }

    currentView = "all";
    currentFilter = "all";

    updateActiveButtons();
    renderTasks();

    document.querySelector(".task-list-section")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

// ========================================
// ALL / PENDING / COMPLETED FILTERS
// ========================================

document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", function() {
    currentFilter = this.dataset.filter;

    currentView = "all";
    selectedCategory = null;

    updateActiveButtons();
    renderTasks();
  });
});

// ========================================
// ACTIVE BUTTONS
// ========================================

function updateActiveButtons() {
  // Sidebar
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === currentView
    );
  });

  // Categories
  document.querySelectorAll(".category-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.category === selectedCategory
    );
  });

  // Filters
  document.querySelectorAll(".filter-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.filter === currentFilter
    );
  });
}

// ========================================
// UPDATE SECTION HEADINGS
// ========================================

function updateListHeading() {
  let heading = "Your tasks";
  let page = "Dashboard";

  if (currentView === "pending") {
    heading = "Pending tasks";
    page = "My Tasks";
  }

  if (currentView === "completed") {
    heading = "Completed tasks";
    page = "Completed";
  }

  if (selectedCategory) {
    heading = selectedCategory + " tasks";
    page = selectedCategory;
  }

  if (currentFilter === "pending") {
    heading = "Pending tasks";
  }

  if (currentFilter === "completed") {
    heading = "Completed tasks";
  }

  listTitle.textContent = heading;
  pageTitle.textContent = page;
}

// ========================================
// DARK MODE
// ========================================

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

function applyDarkMode(isDark) {
  document.body.classList.toggle("dark", isDark);

  themeIcon.textContent = isDark ? "☀" : "☾";
  themeText.textContent = isDark ? "Light mode" : "Dark mode";

  saveDarkMode(isDark);
}

const savedDarkMode =
  localStorage.getItem("taskie.dark.v1") === "true";

applyDarkMode(savedDarkMode);

themeToggle.addEventListener("click", function() {
  const isDark = !document.body.classList.contains("dark");

  applyDarkMode(isDark);
});

// ========================================
// COLOUR THEMES
// ========================================

const paletteToggle = document.getElementById("paletteToggle");
const palettePanel = document.getElementById("palettePanel");

function applyTheme(theme) {
  const availableThemes = [
    "sunset",
    "lavender",
    "mint",
    "ocean"
  ];

  if (!availableThemes.includes(theme)) {
    theme = "sunset";
  }

  document.body.dataset.theme = theme;
  saveTheme(theme);
}

const savedTheme =
  localStorage.getItem("taskie.theme.v2") || "sunset";

applyTheme(savedTheme);

paletteToggle.addEventListener("click", function() {
  palettePanel.classList.toggle("open");
});

document.querySelectorAll("[data-theme]").forEach(button => {
  button.addEventListener("click", function() {
    applyTheme(this.dataset.theme);

    palettePanel.classList.remove("open");

    showToast("Your new theme is ready! 🎨");
  });
});

document.addEventListener("click", function(event) {
  if (
    !event.target.closest("#themePicker")
  ) {
    palettePanel.classList.remove("open");
  }
});

// ========================================
// INITIALIZE APPLICATION
// ========================================

function initializeApp() {
  updateActiveButtons();
  renderTasks();
}

initializeApp();
