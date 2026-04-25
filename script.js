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

let activeTab = 'todos';

const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let selectedDay = today.getDate();

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
    });
});

dateInput.style.display = 'none';

// Vytvoření navigace měsíce
function updateMonthHeader() {
    currentDateEl.innerHTML = `
        <button class="month-nav" id="prevMonth">‹</button>
        <span class="month-label">${months[currentMonth]} ${currentYear}</span>
        <button class="month-nav" id="nextMonth">›</button>
    `;

    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        selectedDay = null;
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        selectedDay = null;
        renderCalendar();
    });
}

// Vykreslení kalendáře
function renderCalendar() {
    calendar.innerHTML = '';
    updateMonthHeader();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i);

        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';

        // Zvýrazni dnešní den
        if (date.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
        }

        // Zvýrazni vybraný den
        if (i === selectedDay && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayEl.classList.add('active');
        } else if (i === selectedDay) {
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

        dayEl.addEventListener('click', () => {
            selectedDay = i;
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
            dayEl.classList.add('active');
        });

        calendar.appendChild(dayEl);
    }

    // Scrollni na dnešní den
    if (currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
        setTimeout(() => {
            const activeDays = calendar.querySelectorAll('.calendar-day.active, .calendar-day.today');
            if (activeDays.length > 0) {
                activeDays[0].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 100);
    }
}

// Formátování data
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.getDate() + '. ' + (date.getMonth() + 1) + '. ' + date.getFullYear();
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

// Načtení úkolů z Firebase
onValue(todosRef, (snapshot) => {
    list.innerHTML = '';
    deadlineList.innerHTML = '';

    const data = snapshot.val();
    const deadlines = [];

    if (data) {
        Object.keys(data).forEach(key => {
            const todo = data[key];

            if (todo.deadline) {
                deadlines.push({ key, ...todo });
            } else {
                const li = createTodoItem(key, todo);
                list.appendChild(li);
            }
        });

        deadlines.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        if (deadlines.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty-message';
            empty.textContent = 'Žádné deadlines';
            deadlineList.appendChild(empty);
        } else {
            deadlines.forEach(todo => {
                const li = createDeadlineItem(todo.key, todo);
                deadlineList.appendChild(li);
            });
        }
    } else {
        const empty = document.createElement('p');
        empty.className = 'empty-message';
        empty.textContent = 'Žádné úkoly';
        list.appendChild(empty);
    }
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

// Přidat styly pro navigaci měsíce
const style = document.createElement('style');
style.textContent = `
    .subtitle {
        display: flex !important;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
    }
    .month-nav {
        background: #333;
        color: #fff;
        border: none;
        border-radius: 8px;
        width: 30px;
        height: 30px;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .month-nav:active {
        background: #f5c518;
        color: #1a1a1a;
    }
    .month-label {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .calendar-day.today {
        border-color: #f5c518 !important;
    }
`;
document.head.appendChild(style);

// Spustit
renderCalendar();
