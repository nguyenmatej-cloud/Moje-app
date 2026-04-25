import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCMRbYmXpvm1EpbsCqutDu9Dx2bae1MNPM",
    authDomain: "todo-appka.firebaseapp.com",
    databaseURL: "https://todo-appka-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "todo-appka",
    storageBucket: "todo-appka.firebasestorage.app",
    messagingSenderId: "102106437481",
    appId: "1:102106437481:web:52bcad8d38130852a0cff8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const todosRef = ref(db, 'todos');

const input = document.getElementById('todoInput');
const dateInput = document.getElementById('todoDate');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('todoList');
const deadlineList = document.getElementById('deadlineList');
const calendar = document.getElementById('calendar');
const currentDateEl = document.getElementById('currentDate');
const tabs = document.querySelectorAll('.tab');
const calLeft = document.getElementById('calLeft');
const calRight = document.getElementById('calRight');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');

let activeTab = 'todos';
let allTodos = {};
let selectedDay = null;
let selectedMonth = null;
let selectedYear = null;
let slideDirection = null;

const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        selectedDay = null;
        selectedMonth = null;
        selectedYear = null;

        if (activeTab === 'todos') {
            list.style.display = 'block';
            deadlineList.style.display = 'none';
            dateInput.style.display = 'none';
        } else {
            list.style.display = 'none';
            deadlineList.style.display = 'block';
            dateInput.style.display = 'block';
        }

        renderCalendar();
        renderTodos();
    });
});

dateInput.style.display = 'none';

todayBtn.addEventListener('click', () => {
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    selectedDay = today.getDate();
    selectedMonth = today.getMonth();
    selectedYear = today.getFullYear();

    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="deadlines"]').classList.add('active');
    activeTab = 'deadlines';
    list.style.display = 'none';
    deadlineList.style.display = 'block';
    dateInput.style.display = 'block';

    renderCalendar();
    renderTodos();
});

prevMonthBtn.addEventListener('click', () => {
    slideDirection = 'right';
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    selectedDay = null;
    selectedMonth = null;
    selectedYear = null;
    renderCalendar();
    renderTodos();
});

nextMonthBtn.addEventListener('click', () => {
    slideDirection = 'left';
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    selectedDay = null;
    selectedMonth = null;
    selectedYear = null;
    renderCalendar();
    renderTodos();
});

calLeft.addEventListener('click', () => {
    calendar.scrollBy({ left: -150, behavior: 'smooth' });
});

calRight.addEventListener('click', () => {
    calendar.scrollBy({ left: 150, behavior: 'smooth' });
});

function getDeadlineCounts() {
    const counts = {};
    Object.values(allTodos).forEach(todo => {
        if (todo.deadline) {
            const d = new Date(todo.deadline + 'T00:00:00');
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                const day = d.getDate();
                if (!counts[day]) counts[day] = { done: 0, undone: 0 };
                if (todo.done) {
                    counts[day].done++;
                } else {
                    counts[day].undone++;
                }
            }
        }
    });
    return counts;
}

function showMonthGrid() {
    const existing = document.getElementById('monthGrid');
    if (existing) { existing.remove(); return; }
    document.getElementById('yearPicker')?.remove();

    const grid = document.createElement('div');
    grid.id = 'monthGrid';
    grid.className = 'month-grid';

    const dayNamesRow = document.createElement('div');
    dayNamesRow.className = 'month-grid-header';
    ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].forEach(d => {
        const cell = document.createElement('div');
        cell.className = 'month-grid-dayname';
        cell.textContent = d;
        dayNamesRow.appendChild(cell);
    });
    grid.appendChild(dayNamesRow);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const daysRow = document.createElement('div');
    daysRow.className = 'month-grid-days';

    for (let i = 0; i < offset; i++) {
        const empty = document.createElement('div');
        empty.className = 'month-grid-day empty';
        daysRow.appendChild(empty);
    }

    const deadlineCounts = getDeadlineCounts();

    for (let i = 1; i <= daysInMonth; i++) {
        const cell = document.createElement('div');
        cell.className = 'month-grid-day';

        const date = new Date(currentYear, currentMonth, i);
        if (date.toDateString() === today.toDateString()) {
            cell.classList.add('today');
        }
        if (i === selectedDay && currentMonth === selectedMonth && currentYear === selectedYear) {
            cell.classList.add('active');
        }

        const num = document.createElement('span');
        num.textContent = i;
        cell.appendChild(num);

        const counts = deadlineCounts[i];
        if (counts) {
            const dots = document.createElement('div');
            dots.className = 'month-grid-dots';

            const undoneDots = Math.min(counts.undone, 2);
            for (let d = 0; d < undoneDots; d++) {
                const dot = document.createElement('span');
                dot.className = 'month-grid-dot red';
                dots.appendChild(dot);
            }

            const doneDots = Math.min(counts.done, 2);
            for (let d = 0; d < doneDots; d++) {
                const dot = document.createElement('span');
                dot.className = 'month-grid-dot green';
                dots.appendChild(dot);
            }

            cell.appendChild(dots);
        }

        cell.addEventListener('click', () => {
            selectedDay = i;
            selectedMonth = currentMonth;
            selectedYear = currentYear;
            grid.remove();

            tabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="deadlines"]').classList.add('active');
            activeTab = 'deadlines';
            list.style.display = 'none';
            deadlineList.style.display = 'block';
            dateInput.style.display = 'block';

            renderCalendar();
            renderTodos();
        });

        daysRow.appendChild(cell);
    }

    grid.appendChild(daysRow);
    document.querySelector('.header').appendChild(grid);
}

function showYearPicker() {
    const existing = document.getElementById('yearPicker');
    if (existing) { existing.remove(); return; }
    document.getElementById('monthGrid')?.remove();

    const picker = document.createElement('div');
    picker.id = 'yearPicker';
    picker.className = 'year-picker';

    for (let y = 2024; y <= 2030; y++) {
        const btn = document.createElement('button');
        btn.className = 'year-option' + (y === currentYear ? ' active' : '');
        btn.textContent = y;
        btn.addEventListener('click', () => {
            currentYear = y;
            selectedDay = null;
            selectedMonth = null;
            selectedYear = null;
            picker.remove();
            renderCalendar();
            renderTodos();
        });
        picker.appendChild(btn);
    }

    document.querySelector('.header').appendChild(picker);
}

function renderCalendar() {
    calendar.innerHTML = '';

    // Název měsíce a rok - klikatelné
    currentDateEl.innerHTML = `<span class="month-btn-label" id="monthLabel">${months[currentMonth]}</span> <span class="year-btn" id="yearBtn">${currentYear}</span>`;

    document.getElementById('monthLabel').addEventListener('click', showMonthGrid);
    document.getElementById('yearBtn').addEventListener('click', showYearPicker);

    if (slideDirection === 'left') {
        calendar.classList.remove('slide-left', 'slide-right');
        calendar.offsetHeight;
        calendar.classList.add('slide-left');
    } else if (slideDirection === 'right') {
        calendar.classList.remove('slide-left', 'slide-right');
        calendar.offsetHeight;
        calendar.classList.add('slide-right');
    }
    slideDirection = null;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const deadlineCounts = getDeadlineCounts();

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i);
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';

        if (date.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
        }
        if (i === selectedDay && currentMonth === selectedMonth && currentYear === selectedYear) {
            dayEl.classList.add('active');
        }

        const dayName = document.createElement('div');
        dayName.className = 'day-name';
        dayName.textContent = dayNames[date.getDay()];

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i;

        dayEl.appendChild(dayName);
        dayEl.appendChild(dayNumber);

        const counts = deadlineCounts[i];
        if (counts) {
            const dotsEl = document.createElement('div');
            dotsEl.className = 'deadline-dots';
            const undoneDots = Math.min(counts.undone, 3);
            for (let d = 0; d < undoneDots; d++) {
                const dot = document.createElement('span');
                dot.className = 'deadline-dot red';
                dotsEl.appendChild(dot);
            }
            const doneDots = Math.min(counts.done, 3);
            for (let d = 0; d < doneDots; d++) {
                const dot = document.createElement('span');
                dot.className = 'deadline-dot green';
                dotsEl.appendChild(dot);
            }
            dayEl.appendChild(dotsEl);
        }

        dayEl.addEventListener('click', () => {
            selectedDay = i;
            selectedMonth = currentMonth;
            selectedYear = currentYear;
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
            dayEl.classList.add('active');
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="deadlines"]').classList.add('active');
            activeTab = 'deadlines';
            list.style.display = 'none';
            deadlineList.style.display = 'block';
            dateInput.style.display = 'block';
            document.getElementById('monthGrid')?.remove();
            renderTodos();
        });

        calendar.appendChild(dayEl);
    }

    setTimeout(() => {
        const active = calendar.querySelector('.active') || calendar.querySelector('.today');
        if (active) {
            active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, 100);
}

function spawnConfetti(x, y) {
    const colors = ['#0a84ff', '#30d158', '#ff453a', '#ffd60a', '#bf5af2'];
    for (let i = 0; i < 8; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = (x + (Math.random() - 0.5) * 40) + 'px';
        piece.style.top = y + 'px';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = (Math.random() * 0.2) + 's';
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 1000);
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.getDate() + '. ' + (date.getMonth() + 1) + '. ' + date.getFullYear();
}

function renderTodos() {
    list.innerHTML = '';
    deadlineList.innerHTML = '';

    const data = allTodos;
    const deadlines = [];

    const filterByDay = selectedDay !== null;
    const selectedDateStr = filterByDay
        ? `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
        : null;

    if (activeTab === 'todos') {
        let found = false;

        if (data) {
            Object.keys(data).forEach(key => {
                const todo = data[key];
                if (todo.deadline) return;
                list.appendChild(createTodoItem(key, todo));
                found = true;
            });
        }

        if (!found) {
            const empty = document.createElement('li');
            empty.className = 'empty-message';
            empty.textContent = 'Žádné úkoly 😊';
            list.appendChild(empty);
        }

    } else {
        if (data) {
            Object.keys(data).forEach(key => {
                const todo = data[key];
                if (!todo.deadline) return;
                if (filterByDay && todo.deadline !== selectedDateStr) return;
                deadlines.push({ key, ...todo });
            });
        }

        deadlines.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        if (deadlines.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'empty-message';
            if (filterByDay) {
                const dateFormatted = selectedDay + '. ' + (selectedMonth + 1) + '. ' + selectedYear;
                empty.textContent = '😊 Na ' + dateFormatted + ' nemáte žádné deadliny!';
            } else {
                empty.textContent = 'Žádné deadlines 😊';
            }
            deadlineList.appendChild(empty);
        } else {
            deadlines.forEach(todo => deadlineList.appendChild(createDeadlineItem(todo.key, todo)));
        }
    }
}

function addTodo() {
    const text = input.value.trim();
    if (text === '') return;

    const date = dateInput.value;

    if (activeTab === 'deadlines' && !date) {
        alert('Prosím vyber datum pro deadline!');
        return;
    }

    if (date) {
        const rect = addBtn.getBoundingClientRect();
        spawnConfetti(rect.left + rect.width / 2, rect.top);
    }

    push(todosRef, {
        text: text,
        done: false,
        deadline: date || null
    });

    input.value = '';
    dateInput.value = '';
}

onValue(todosRef, (snapshot) => {
    allTodos = snapshot.val() || {};
    renderCalendar();
    renderTodos();
});

function createTodoItem(key, todo) {
    const li = document.createElement('li');
    if (todo.done) li.classList.add('done');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => {
        update(ref(db, 'todos/' + key), { done: checkbox.checked });
    });

    const content = document.createElement('div');
    content.className = 'content';
    const span = document.createElement('span');
    span.textContent = todo.text;
    content.appendChild(span);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => {
        li.classList.add('removing');
        setTimeout(() => remove(ref(db, 'todos/' + key)), 280);
    });

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(deleteBtn);
    return li;
}

function createDeadlineItem(key, todo) {
    const li = document.createElement('li');
    if (todo.done) li.classList.add('done');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => {
        update(ref(db, 'todos/' + key), { done: checkbox.checked });
    });

    const content = document.createElement('div');
    content.className = 'content';
    const span = document.createElement('span');
    span.textContent = todo.text;
    const dateSpan = document.createElement('div');
    dateSpan.className = 'deadline-date';
    dateSpan.textContent = '📅 ' + formatDate(todo.deadline);
    content.appendChild(span);
    content.appendChild(dateSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => {
        li.classList.add('removing');
        setTimeout(() => remove(ref(db, 'todos/' + key)), 280);
    });

    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(deleteBtn);
    return li;
}

addBtn.addEventListener('click', addTodo);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

renderCalendar();
