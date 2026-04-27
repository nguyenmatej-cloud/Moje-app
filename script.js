import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
let searchQuery = '';
let activeFilter = 'all';

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

// ✅ OPRAVENO: getRedirectResult správně zpracovává výsledek
getRedirectResult(auth).then(async (result) => {
    if (result && result.user) {
        console.log('Redirect login OK:', result.user.displayName);
    }
}).catch((err) => {
    if (err.code && err.code !== 'auth/no-auth-event' && err.code !== 'auth/null-user') {
        console.warn('getRedirectResult:', err.code);
    }
});

// ✅ OPRAVENO: detekce iOS a Safari
function isMobileOrSafari() {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isChromeIOS = /CriOS/i.test(ua);
    return isIOS || isSafari || isChromeIOS;
}

document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
        if (isMobileOrSafari()) {
            await signInWithRedirect(auth, provider);
            return;
        }
        await signInWithPopup(auth, provider);
    } catch (err) {
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
            try {
                await signInWithRedirect(auth, provider);
            } catch (redirectErr) {
                alert('Chyba přihlášení: ' + redirectErr.code + '\n' + redirectErr.message);
            }
        } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
            alert('Chyba přihlášení: ' + err.code + '\n' + err.message);
        }
    }
});

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

const ADMIN_EMAIL = 'nguyenmatej@gmail.com';

function isAdmin() {
    return currentUser?.email === ADMIN_EMAIL || allUsers[currentUser?.uid]?.isAdmin === true;
}

function startApp(user, userData) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    const adminBtnHtml = user.email === ADMIN_EMAIL
        ? `<button class="logout-btn admin-btn" id="adminBtn">⚙️ Správa</button>`
        : '';

    const userInfo = document.getElementById('userInfo');
    userInfo.innerHTML = `
        <img src="${userData.photo || user.photoURL}" alt="${currentNickname}">
        <span>${currentNickname}</span>
        <button class="logout-btn" id="changeNickBtn">✏️</button>
        ${adminBtnHtml}
        <button class="logout-btn" id="logoutBtn">Odhlásit</button>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));
    document.getElementById('changeNickBtn').addEventListener('click', () => showNicknameDialog(currentUser));
    document.getElementById('adminBtn')?.addEventListener('click', showAdminPanel);

    initApp();
}

function initApp() {
    onValue(usersRef, (snapshot) => {
        allUsers = snapshot.val() || {};
        updateAssignSelect();
        renderFilterBar();
        if (activeTab === 'stats') renderStats();
        if (document.getElementById('adminBody')) renderAdminBody();
    });

    onValue(todosRef, (snapshot) => {
        allTodos = snapshot.val() || {};
        renderCalendar();
        if (activeTab === 'stats') renderStats();
        else renderTodos();
        checkDeadlineNotifications();
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeTab = tab.dataset.tab;
            selectedDay = null; selectedMonth = null; selectedYear = null;
            showTab(activeTab);
            renderCalendar();
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
        showTab('deadlines');
        renderCalendar();
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

    document.getElementById('addBtn').addEventListener('click', addTodo);
    document.getElementById('todoInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    document.getElementById('searchBtn').addEventListener('click', () => {
        const bar = document.getElementById('searchBar');
        const open = bar.style.display !== 'none';
        if (open) {
            bar.style.display = 'none';
            document.getElementById('searchInput').value = '';
            searchQuery = '';
            showTab(activeTab);
        } else {
            bar.style.display = 'flex';
            document.getElementById('searchInput').focus();
        }
    });

    document.getElementById('searchClose').addEventListener('click', () => {
        document.getElementById('searchBar').style.display = 'none';
        document.getElementById('searchInput').value = '';
        searchQuery = '';
        showTab(activeTab);
    });

    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderSearch();
    });

    requestNotificationPermission();
}

function matchesFilter(todo) {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'mine') {
        if (todo.assignedTo) return todo.assignedTo.uid === currentUser.uid;
        return todo.createdBy?.uid === currentUser.uid;
    }
    if (todo.assignedTo) return todo.assignedTo.uid === activeFilter;
    return false;
}

function setFilter(filter) {
    activeFilter = filter;
    renderFilterBar();
    renderCalendar();
    renderTodos();
}

function renderFilterBar() {
    const bar = document.getElementById('filterBar');
    if (!bar || !currentUser) return;
    bar.innerHTML = '';

    const defs = [
        { filter: 'all', label: 'Všichni', photo: null, karma: null },
        { filter: 'mine', label: 'Moje', photo: currentUser.photoURL, karma: allUsers[currentUser.uid]?.karma || 0 }
    ];
    Object.entries(allUsers).forEach(([uid, user]) => {
        if (uid === currentUser.uid) return;
        defs.push({ filter: uid, label: user.nickname || user.name?.split(' ')[0] || '?', photo: user.photo, karma: user.karma || 0 });
    });

    defs.forEach(({ filter, label, photo, karma }) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (activeFilter === filter ? ' active' : '');
        if (photo) {
            const img = document.createElement('img');
            img.src = photo;
            btn.appendChild(img);
        }
        btn.appendChild(document.createTextNode(label));
        if (karma !== null) {
            const karmaSpan = document.createElement('span');
            karmaSpan.className = 'filter-karma';
            karmaSpan.textContent = karma + '⚡';
            btn.appendChild(karmaSpan);
        }
        btn.addEventListener('click', () => setFilter(filter));
        bar.appendChild(btn);
    });
}

function showTab(tab) {
    const isStats = tab === 'stats';
    const isDeadlines = tab === 'deadlines';
    const isTodos = tab === 'todos';

    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('mainContent').style.display = isStats ? 'none' : '';
    document.getElementById('statsPanel').style.display = isStats ? '' : 'none';
    document.getElementById('inputArea').style.display = isStats ? 'none' : '';
    document.getElementById('todoList').style.display = isTodos ? '' : 'none';
    document.getElementById('deadlineList').style.display = isDeadlines ? '' : 'none';
    document.getElementById('todoDate').style.display = isDeadlines ? '' : 'none';

    if (searchQuery) renderSearch();
    else if (isStats) renderStats();
    else renderTodos();
}

async function deltaKarma(uid, delta) {
    if (!uid || !delta) return;
    const snap = await get(ref(db, 'users/' + uid + '/karma'));
    const current = snap.val() || 0;
    update(ref(db, 'users/' + uid), { karma: Math.max(0, current + delta) });
}

function renderStats() {
    const panel = document.getElementById('statsPanel');
    if (!panel) return;
    panel.innerHTML = '';

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let totalTodos = 0, doneTodos = 0;
    let totalDeadlines = 0, doneDeadlines = 0;

    Object.values(allTodos).forEach(todo => {
        if (todo.deadline) {
            const d = new Date(todo.deadline + 'T00:00:00');
            if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
                totalDeadlines++;
                if (todo.done) doneDeadlines++;
            }
        } else {
            totalTodos++;
            if (todo.done) doneTodos++;
        }
    });

    const totalAll = totalTodos + totalDeadlines;
    const doneAll = doneTodos + doneDeadlines;
    const pct = totalAll > 0 ? Math.round(doneAll / totalAll * 100) : 0;

    const grid = document.createElement('div');
    grid.className = 'stats-grid';

    [
        { label: 'Splněné úkoly', value: doneTodos, sub: `z ${totalTodos} celkem`, color: '#30d158' },
        { label: 'Splněné deadliny', value: doneDeadlines, sub: `z ${totalDeadlines} tento měsíc`, color: '#0a84ff' },
        { label: 'Hotovo celkem', value: pct + '%', sub: `${doneAll} z ${totalAll} splněno`, color: '#ffd60a' }
    ].forEach(({ label, value, sub, color }) => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `<div class="stat-value" style="color:${color}">${value}</div><div class="stat-label">${label}</div><div class="stat-sub">${sub}</div>`;
        grid.appendChild(card);
    });
    panel.appendChild(grid);

    const progSection = document.createElement('div');
    progSection.className = 'stats-section';
    progSection.innerHTML = `
        <h3 class="stats-section-title">Splněno vs. čeká</h3>
        <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <div class="progress-bar-labels">
            <span style="color:#30d158">✓ Splněno: ${doneAll}</span>
            <span style="color:#ff453a">○ Čeká: ${totalAll - doneAll}</span>
        </div>`;
    panel.appendChild(progSection);

    const lbSection = document.createElement('div');
    lbSection.className = 'stats-section';
    const lbTitle = document.createElement('h3');
    lbTitle.className = 'stats-section-title';
    lbTitle.textContent = '⚡ Karma žebříček';
    lbSection.appendChild(lbTitle);

    const lb = document.createElement('div');
    lb.className =
