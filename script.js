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

let activeTab = 'todos';
let allTodos = {};
let selectedDay = null;
let selectedMonth = null;
let selectedYear = null;

const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// Záložky
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;

        if (activeTab === 'todos') {
            list.style.display = 'block';
            deadlineList.style.display = 'none';
            dateInput.style.display = 'none';
        } else {
            list.style.display = 'none';
            deadlineList.style.display = 'block';
            dateInput.style.display = 'block';
        }

        renderTodos();
    });
});

dateInput.style.display = 'none';

// Navigace měsíce
prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    selectedDay = null;
    selectedMonth = null;
    selectedYear = null;
    renderCalendar();
    renderTodos();
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    selectedDay = null;
    selectedMonth = null;
    selectedYear = null;
    renderCalendar();
    renderTodos();
});

// Šipky scrollování
calLeft.addEventListener('click', () => {
    calendar.scrollBy({ left: -130, behavior: 'smooth' });
});

calRight.addEventListener('click', () => {
    calendar.scrollBy({ left: 130, behavior: 'smooth' });
});

// Spočítej deadliny pro každý den – zvlášť splněné a nesplněné
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

// Vykreslení kalendáře
function renderCalendar() {
    calendar.innerHTML = '';
    currentDateEl.textContent = months[currentMonth] + ' ' + currentYear;

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

        // Tečky – červené (nesplněné) a zelené (splněné)
        const counts = deadlineCounts[i];
        if (counts) {
            const dotsEl = document.createElement('div');
            dotsEl.className = 'deadline-dots';

            // Červené tečky (nesplněné) – max 3
            const undoneDots = Math.min(counts.undone, 3);
            for (let d = 0; d < undoneDots; d++) {
                const dot = document.createElement('span');
                dot.className = 'deadline-dot red';
                dotsEl.appendChild(dot);
            }

            // Zelené tečky (splněné) – max 3
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

            // Přepni automaticky na záložku Deadlines
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="deadlines"]').classList.add('active');
            activeTab = 'deadlines';
            list.style.display = 'none';
            deadlineList.style.display = 'block';
            dateInput.style.display = 'block';

            renderTodos();
        });

        calendar.appendChild(dayEl);
    }

    setTimeout(() => {
        const active = calendar.querySelector('.active, .today');
        if (active) {
            active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, 100);
}

// Formátování data
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.getDate() + '. ' + (date.getMonth() + 1) + '. ' + date.getFullYear();
}

// Vykreslení úkolů
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

        if (data && !filterByDay) {
            Object.keys(data).forEach(key => {
                const todo = data[key];
                if (todo.deadline) return;
                list.appendChild(createTodoItem(key, todo));
                found = true;
            });
        }

        if (filterByDay) {
            const dateFormatted = selectedDay + '. ' + (selectedMonth + 1) + '. ' + selectedYear;
            const empty = document.createElement('li');
            empty.className = 'empty-message';
            empty.textContent = '😊 Na ' + dateFormatted + ' nemáte žádné úkoly!';
            list.appendChild(empty);
        } else if (!found) {
            const empty = document.createElement('li');
            empty.className = 'empty-message';
            empty.textContent = 'Žádné úkoly';
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
                empty.textContent = 'Žádné deadlines';
            }
            deadlineList.appendChild(empty);
        } else {
            deadlines.forEach(todo => deadlineList.appendChild(createDeadlineItem(todo.key, todo)));
        }
    }
}

// Přidání úkolu
function addTodo() {
    const text = input.value.trim();
    if (text === '') return;

    const date = dateInput.value;

    if (activeTab === 'deadlines' && !date) {
        alert('Prosím vyber datum pro deadline!');
        return;
    }

    push(todosRef, {
        text: text,
        done: false,
        deadline: date || null
    });

    input.value = '';
    dateInput.value = '';
}

// Načtení z Firebase
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
    deleteBtn.addEventListener('click', () => remove(ref(db, 'todos/' + key)));

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
    deleteBtn.addEventListener('click', () => remove(ref(db, 'todos/' + key)));

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
