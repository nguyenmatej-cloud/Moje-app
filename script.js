// Firebase konfigurace
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
