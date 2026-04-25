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

// Záložky - reset výběru dne → zobrazí vše
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;

        // Reset výběru dne
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

        // Fade in animace
        const activeList = activeTab === 'todos' ? list : deadlineList;
        activeList.style.animation = 'none';
        activeList.offsetHeight;
        activeList.style.animation = 'fadeIn 0.3s ease';

        renderCalendar();
        renderTodos();
    });
});

dateInput.style.display = 'none';

// Tlačítko Dnes
todayBtn.addEventListener('click', () => {
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    selectedDay = today.getDate();
    selectedMonth = today.getMonth();
    selectedYear = today.getFullYear();

    // Přepni na Deadlines
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="deadlines"]').classList.add('active');
    activeTab = 'deadlines';
    list.style.display = 'none';
    deadlineList.style.display = 'block';
    dateInput.style.display = 'block';

    renderCalendar();
    renderTodos();
});

// Navigace měsíce
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

// Šipky scrollování
calLeft.addEventListener('click', () => {
    calendar.scrollBy({ left: -150, behavior: 'smooth' });
});

calRight.addEventListener('click', () => {
    calendar.scrollBy({ left: 150, behavior: 'smooth' });
});

// Spočítej deadliny pro každý den
function getDeadlineCounts() {
    const counts = {};
    Object.values(allTodos).forEach(todo => {
        if (todo.deadline) {
            con
