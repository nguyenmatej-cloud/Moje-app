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
                d
