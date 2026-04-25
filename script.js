import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const todosRef = ref(db, 'todos');
const usersRef = ref(db, 'users');

let currentUser = null;
let currentNickname = null;
let allUsers = {};
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

const categoryLabels = {
    home: '🏠 Domácnost',
    work: '💼 Práce',
    shopping: '🛒 Nákup',
    personal: '👤 Osobní'
};

const priorityLabels = {
    high: { label: '🔴 Vysoká', color: '#ff453a' },
    medium: { label: '🟡 Střední', color: '#ffd60a' },
    low: { label: '🟢 Nízká', color: '#30d158' }
};

// Nejdřív zkontroluj výsledek redirectu
getRedirectResult(auth).then(async (result) => {
    if (result && result.user) {
        console.log('Redirect login successful:', result.user.displayName);
    }
}).catch(err => {
    console.error('Redirect error:', err.code, err.message);
    if (err.code !== 'auth/no-auth-event') {
        alert('Chyba přihlášení: ' + err.code + ' - ' + err.message);
    }
});

// Login přes redirect
document.getElementById('loginBtn').addEventListener('click', () => {
    signInWithRedirect(auth, provider);
});

// Auth stav
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userSnap = await get(ref(db, 'users/' + user.uid));
        const userData = userSnap.val();

        if (!userData || !userData.nickname) {
            showNicknameDialog(user);
        } else {
            currentNickname = userData.nickname;
            startApp(user, userData);
        }
    } else {
        currentUser = null;
        currentNickname = null;
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('nicknameDialog')?.remove();
    }
});

function showNicknameDialog(user) {
    document.getElementById('nicknameDialog')?.remove();

    const dialog = document.createElement('div');
    dialog.id = 'nicknameDialog';
    dialog.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; justify-content: center;
        align-items: center; z-index: 2000;
    `;

    dialog.innerHTML = `
        <div style="background: #1c1c1e; padding: 40px; border-radius: 24px; text-align: center; max-width: 360px; width: 90%; border: 1px solid #2c2c2e;">
            <img src="${user.photoURL}" style="width: 64px; height: 64px; border-radius: 50%; margin-bottom: 16px;">
            <h2 style="color: #fff; font-size: 22px; margin-bottom: 8px;">Ahoj! Jak ti máme říkat?</h2>
            <p style="color: #8e8e93; margin-bottom: 24px; font-size: 15px;">Zadej přezdívku která se bude zobrazovat u úkolů</p>
            <input id="nicknameInput" type="text" placeholder="Přezdívka..." 
                style="width: 100%; padding: 14px 16px; background: #2c2c2e; border: 1px solid #3a3a3c; 
                border-radius: 12px; color: #fff; font-size: 17px; outline: none; margin-bottom: 16px;">
            <button id="nicknameSubmit" 
                style="width: 100%; padding: 14px; background: #0a84ff; color: #fff; border: none; 
                border-radius: 12px; font-size: 17px; font-weight: 600; cursor: pointer;">
                Potvrdit
            </button>
        </div>
    `;

    document.body.appendChild(dialog);

    const input = dialog.querySelector('#nicknameInput');
    const submit = dialog.querySelector('#nicknameSubmit');
    input.focus();

    const confirm = async () => {
        const nickname = input.value.trim();
        if (!nickname) { input.style.borderColor = '#ff453a'; return; }

        currentNickname = nickname;
        await update(ref(db, 'users/' + user.uid), {
            name: user.displayName,
            nickname: nickname,
            photo: user.photoURL,
            email: user.email
        });

        dialog.remove();
        startApp(user, { nickname, photo: user.photoURL });
    };

    submit.addEventListener('click', confirm);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') confirm(); });
}

function startApp(user, userData) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = `
        <img src="${userData.photo || user.photoURL}" alt="${currentNickname}">
        <span>${currentNickname}</span>
        <button class="logout-btn" id="changeNickBtn">✏️</button>
        <button class="logout-btn" id="logoutBtn">Odhlásit</button>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));
    document.getElementById('changeNickBtn').addEventListener('click', () => showNicknameDialog(currentUser));

    initApp();
}

function initApp() {
    onValue(usersRef, (snapshot) => {
        allUsers = snapshot.val() || {};
        updateAssignSelect();
    });

    onValue(todosRef, (snapshot) => {
        allTodos = snapshot.val() || {};
        renderCalendar();
        renderTodos();
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeTab = tab.dataset.tab;
            selectedDay = null;
            selectedMonth = null;
            selectedYear = null;

            if (activeTab === 'todos') {
                document.getElementById('todoList').style.display = 'block';
                document.getElementById('deadlineList').style.display = 'none';
                document.getElementById('todoDate').style.display = 'none';
            } else {
                document.getElementById('todoList').style.display = 'none';
                document.getElementById('deadlineList').style.display = 'block';
                document.getElementById('todoDate').style.display = 'block';
            }

            renderCalendar();
            renderTodos();
        });
    });

    document.getElementById('todoDate').style.display = 'none';

    document.getElementById('todayBtn').addEventListener('click', () => {
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        selectedDay = today.getDate();
        selectedMonth = today.getMonth();
        selectedYear = today.getFullYear();

        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-tab="deadlines"]').classList.add('active');
        activeTab = 'deadlines';
        document.getElementById('todoList').style.display = 'none';
        document.getElementById('deadlineList').style.display = 'block';
        document.getElementById('todoDate').style.display = 'block';

        renderCalendar();
        renderTodos();
    });

    document.getElementById('prevMonth').addEventListener('click', () => {
        slideDirection = 'right';
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        selectedDay = null; selectedMonth = null; selectedYear = null;
        renderCalendar(); renderTodos();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        slideDirection = 'left';
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        selectedDay = null; selectedMonth = null; selectedYear = null;
        renderCalendar(); renderTodos();
    });

    document.getElementById('calLeft').addEventListener('click', () => {
        document.getElementById('calendar').scrollBy({ left: -150, behavior: 'smooth' });
    });

    document.getElementById('calRight').addEventListener('click', () => {
        document.getElementById('calendar').scrollBy({ left: 150, behavior: 'smooth' });
    });

    document.getElementById('addBtn').addEventListener('click', addTodo);
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
}

function updateAssignSelect() {
    const select = document.getElementById('assignTo');
    select.innerHTML = '<option value="">👤 Komu?</option>';
    Object.entries(allUsers).forEach(([uid, user]) => {
        const option = document.createElement('option');
        option.value = uid;
        option.textContent = user.nickname || user.name.split(' ')[0];
        select.appendChild(option);
    });
}

function getDeadlineCounts() {
    const counts = {};
    Object.values(allTodos).forEach(todo => {
        if (todo.deadline) {
            const d = new Date(todo.deadline + 'T00:00:00');
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                const day = d.getDate();
                if (!counts[day]) counts[day] = { done: 0, undone: 0 };
                if (todo.done) counts[day].done++;
                else counts[day].undone++;
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

    const header = document.createElement('div');
    header.className = 'month-grid-header';
    ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].forEach(d => {
        const cell = document.createElement('div');
        cell.className = 'month-grid-dayname';
        cell.textContent = d;
        header.appendChild(cell);
    });
    grid.appendChild(header);

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
        if (date.toDateString() === today.toDateString()) cell.classList.add('today');
        if (i === selectedDay && currentMonth === selectedMonth && currentYear === selectedYear) cell.classList.add('active');

        const num = document.createElement('span');
        num.textContent = i;
        cell.appendChild(num);

        const counts = deadlineCounts[i];
        if (counts) {
            const dots = document.createElement('div');
            dots.className = 'month-grid-dots';
            for (let d = 0; d < Math.min(counts.undone, 2); d++) {
                const dot = document.createElement('span');
                dot.className = 'month-grid-dot red';
                dots.appendChild(dot);
            }
            for (let d = 0; d < Math.min(counts.done, 2); d++) {
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
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="deadlines"]').classList.add('active');
            activeTab = 'deadlines';
            document.getElementById('todoList').style.display = 'none';
            document.getElementById('deadlineList').style.display = 'block';
            document.getElementById('todoDate').style.display = 'block';
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
            selectedDay = null; selectedMonth = null; selectedYear = null;
            picker.remove();
            renderCalendar(); renderTodos();
        });
        picker.appendChild(btn);
    }

    document.querySelector('.header').appendChild(picker);
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const currentDateEl = document.getElementById('currentDate');
    calendar.innerHTML = '';

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

        if (date.toDateString() === today.toDateString()) dayEl.classList.add('today');
        if (i === selectedDay && currentMonth === selectedMonth && currentYear === selectedYear) dayEl.classList.add('active');

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
            for (let d = 0; d < Math.min(counts.undone, 3); d++) {
                const dot = document.createElement('span');
                dot.className = 'deadline-dot red';
                dotsEl.appendChild(dot);
            }
            for (let d = 0; d < Math.min(counts.done, 3); d++) {
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
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="deadlines"]').classList.add('active');
            activeTab = 'deadlines';
            document.getElementById('todoList').style.display = 'none';
            document.getElementById('deadlineList').style.display = 'block';
            document.getElementById('todoDate').style.display = 'block';
            document.getElementById('monthGrid')?.remove();
            renderTodos();
        });

        calendar.appendChild(dayEl);
    }

    setTimeout(() => {
        const active = calendar.querySelector('.active') || calendar.querySelector('.today');
        if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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
    const list = document.getElementById('todoList');
    const deadlineList = document.getElementById('deadlineList');
    list.innerHTML = '';
    deadlineList.innerHTML = '';

    const deadlines = [];
    const filterByDay = selectedDay !== null;
    const selectedDateStr = filterByDay
        ? `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
        : null;

    if (activeTab === 'todos') {
        let found = false;
        Object.keys(allTodos).forEach(key => {
            const todo = allTodos[key];
            if (todo.deadline) return;
            list.appendChild(createTodoItem(key, todo));
            found = true;
        });
        if (!found) {
            const empty = document.createElement('li');
            empty.className = 'empty-message';
            empty.textContent = 'Žádné úkoly 😊';
            list.appendChild(empty);
        }
    } else {
        Object.keys(allTodos).forEach(key => {
            const todo = allTodos[key];
            if (!todo.deadline) return;
            if (filterByDay && todo.deadline !== selectedDateStr) return;
            deadlines.push({ key, ...todo });
        });

        deadlines.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        if (deadlines.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'empty-message';
            empty.textContent = filterByDay
                ? `😊 Na ${selectedDay}. ${selectedMonth + 1}. ${selectedYear} nemáte žádné deadliny!`
                : 'Žádné deadlines 😊';
            deadlineList.appendChild(empty);
        } else {
            deadlines.forEach(todo => deadlineList.appendChild(createDeadlineItem(todo.key, todo)));
        }
    }
}

function addTodo() {
    const input = document.getElementById('todoInput');
    const dateInput = document.getElementById('todoDate');
    const assignTo = document.getElementById('assignTo');
    const category = document.getElementById('category');
    const priority = document.getElementById('priority');
    const addBtn = document.getElementById('addBtn');

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

    const assignedUid = assignTo.value;
    const assignedUser = assignedUid && allUsers[assignedUid] ? {
        uid: assignedUid,
        name: allUsers[assignedUid].nickname || allUsers[assignedUid].name,
        photo: allUsers[assignedUid].photo
    } : null;

    push(todosRef, {
        text: text,
        done: false,
        deadline: date || null,
        category: category.value || null,
        priority: priority.value || 'medium',
        createdBy: {
            uid: currentUser.uid,
            name: currentNickname,
            photo: currentUser.photoURL
        },
        assignedTo: assignedUser
    });

    input.value = '';
    dateInput.value = '';
    assignTo.value = '';
    category.value = '';
    priority.value = 'medium';
}

function createTodoItem(key, todo) {
    const li = document.createElement('li');
    if (todo.done) li.classList.add('done');

    if (todo.priority && priorityLabels[todo.priority]) {
        li.style.borderLeft = `4px solid ${priorityLabels[todo.priority].color}`;
    }

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

    const meta = document.createElement('div');
    meta.className = 'todo-meta';
    if (todo.category && categoryLabels[todo.category]) {
        const cat = document.createElement('span');
        cat.className = 'tag category-tag';
        cat.textContent = categoryLabels[todo.category];
        meta.appendChild(cat);
    }
    if (todo.priority && priorityLabels[todo.priority]) {
        const pri = document.createElement('span');
        pri.className = 'tag priority-tag';
        pri.style.color = priorityLabels[todo.priority].color;
        pri.textContent = priorityLabels[todo.priority].label;
        meta.appendChild(pri);
    }
    if (meta.children.length > 0) content.appendChild(meta);

    if (todo.assignedTo) {
        const assigned = document.createElement('div');
        assigned.className = 'assigned-to';
        assigned.innerHTML = `<img src="${todo.assignedTo.photo}" alt=""> Pro: <strong>${todo.assignedTo.name}</strong> · Zadal: ${todo.createdBy?.name || '?'}`;
        content.appendChild(assigned);
    } else if (todo.createdBy) {
        const created = document.createElement('div');
        created.className = 'assigned-to';
        created.innerHTML = `<img src="${todo.createdBy.photo}" alt=""> Zadal: <strong>${todo.createdBy.name}</strong>`;
        content.appendChild(created);
    }

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

    if (todo.priority && priorityLabels[todo.priority]) {
        li.style.borderLeft = `4px solid ${priorityLabels[todo.priority].color}`;
    }

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

    const dateSpan = document.createElement('div');
    dateSpan.className = 'deadline-date';
    dateSpan.textContent = '📅 ' + formatDate(todo.deadline);
    content.appendChild(dateSpan);

    const meta = document.createElement('div');
    meta.className = 'todo-meta';
    if (todo.category && categoryLabels[todo.category]) {
        const cat = document.createElement('span');
        cat.className = 'tag category-tag';
        cat.textContent = categoryLabels[todo.category];
        meta.appendChild(cat);
    }
    if (todo.priority && priorityLabels[todo.priority]) {
        const pri = document.createElement('span');
        pri.className = 'tag priority-tag';
        pri.style.color = priorityLabels[todo.priority].color;
        pri.textContent = priorityLabels[todo.priority].label;
        meta.appendChild(pri);
    }
    if (meta.children.length > 0) content.appendChild(meta);

    if (todo.assignedTo) {
        const assigned = document.createElement('div');
        assigned.className = 'assigned-to';
        assigned.innerHTML = `<img src="${todo.assignedTo.photo}" alt=""> Pro: <strong>${todo.assignedTo.name}</strong> · Zadal: ${todo.createdBy?.name || '?'}`;
        content.appendChild(assigned);
    } else if (todo.createdBy) {
        const created = document.createElement('div');
        created.className = 'assigned-to';
        created.innerHTML = `<img src="${todo.createdBy.photo}" alt=""> Zadal: <strong>${todo.createdBy.name}</strong>`;
        content.appendChild(created);
    }

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
