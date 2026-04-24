const input = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('todoList');

function addTodo() {
    const text = input.value.trim();
    if (text === '') return;
    
    const li = document.createElement('li');
    
    const span = document.createElement('span');
    span.textContent = text;
    span.addEventListener('click', () => {
        li.classList.toggle('done');
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Smazat';
    deleteBtn.addEventListener('click', () => {
        li.remove();
    });
    
    li.appendChild(span);
    li.appendChild(deleteBtn);
    list.appendChild(li);
    
    input.value = '';
}

addBtn.addEventListener('click', addTodo);

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();​​​​​​​​​​​​​​​​

        