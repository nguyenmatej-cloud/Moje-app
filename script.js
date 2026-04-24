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
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('todoList');
const calendar = document.getElementById('calendar');
const currentDateEl = document.getElementById('currentDate');

// Zobrazení aktuálního měsíce a roku
const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 
                'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
const today = new Date();
currentDateEl.textContent = months[today.getMonth()] + ' ' + today.getFullYear();

// Vytvoření kalendáře - aktuální týden
const dayNames = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const currentDay = today.getDay();
const monday = new Date(today);
monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

for (let i = 0; i < 30; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (date.toDateString() === today.toDateString()) {
        dayEl.classList.add('active');
    }
    
    const dayName = document.createElement('div');
    dayName.className = 'day-name';
    dayName.textContent = dayNames[date.getDay()];
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    
    dayEl.appendChild(dayName);
    dayEl.appendChild(dayNumber);
    
    dayEl.addEventListener('click', () => {
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
        dayEl.classList.add('active');
    });
    
    calendar.appendChild(dayEl);
}

function addTodo() {
    const text = input.value.trim();
    if (text === '') return;
    
    push(todosRef, {
        text: text,
        done: false
    });
    
    input.value = '';
}

onValue(todosRef, (snapshot) => {
    list.innerHTML = '';
    const data = snapshot.val();
    
    if (data) {
        Object.keys(data).forEach(key => {
            const todo = data[key];
            const li = document.createElement('li');
            if (todo.done) li.classList.add('done');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.done;
            checkbox.addEventListener('change', () => {
                update(ref(db, 'todos/' + key), { done: checkbox.checked });
            });
            
            const span = document.createElement('span');
            span.textContent = todo.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.addEventListener('click', () => {
                remove(ref(db, 'todos/' + key));
            });
            
            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(deleteBtn);
            list.appendChild(li);
        });
    }
});

addBtn.addEventListener('click', addTodo);

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});
