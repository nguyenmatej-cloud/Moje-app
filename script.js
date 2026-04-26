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

getRedirectResult(auth).catch((err) => {
    if (err.code && err.code !== 'auth/no-auth-event') {
        console.warn('getRedirectResult:', err.code);
    }
});

function isMobileOrSafari() {
    const ua = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    return isSafari || isMobile;
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
            renderTodos();
        } else {
            bar.style.display = 'flex';
            document.getElementById('searchInput').focus();
        }
    });

    document.getElementById('searchClose').addEventListener('click', () => {
        document.getElementById('searchBar').style.display = 'none';
        document.getElementById('searchInput').value = '';
        searchQuery = '';
        renderTodos();
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

    document.getElementById('mainContent').style.display = isStats ? 'none' : '';
    document.getElementById('statsPanel').style.display = isStats ? '' : 'none';
    document.getElementById('inputArea').style.display = isStats ? 'none' : '';
    document.getElementById('todoList').style.display = isTodos ? '' : 'none';
    document.getElementById('deadlineList').style.display = isDeadlines ? '' : 'none';
    document.getElementById('todoDate').style.display = isDeadlines ? '' : 'none';

    if (isStats) renderStats();
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
    lb.className = 'leaderboard';
    const sorted = Object.entries(allUsers).sort((a, b) => (b[1].karma || 0) - (a[1].karma || 0));
    sorted.forEach(([uid, user], i) => {
        const row = document.createElement('div');
        row.className = 'lb-row' + (uid === currentUser.uid ? ' lb-row-me' : '');
        const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        row.innerHTML = `<span class="lb-rank">${rankEmoji}</span><img class="lb-avatar" src="${user.photo || ''}" alt=""><span class="lb-name">${user.nickname || user.name?.split(' ')[0] || '?'}</span><span class="lb-karma">${user.karma || 0} ⚡</span>`;
        lb.appendChild(row);
    });
    lbSection.appendChild(lb);
    panel.appendChild(lbSection);
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function checkDeadlineNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    const tomorrowD = new Date(todayD);
    tomorrowD.setDate(tomorrowD.getDate() + 1);
    const todayStr = todayD.toISOString().split('T')[0];
    const tomorrowStr = tomorrowD.toISOString().split('T')[0];

    const notified = JSON.parse(localStorage.getItem('notifiedDeadlines') || '{}');

    Object.entries(allTodos).forEach(([key, todo]) => {
        if (!todo.deadline || todo.done) return;
        if (todo.deadline === todayStr) {
            const k = key + '_today_' + todayStr;
            if (!notified[k]) {
                new Notification('⏰ Deadline dnes!', { body: todo.text });
                notified[k] = true;
            }
        } else if (todo.deadline === tomorrowStr) {
            const k = key + '_tmrw_' + todayStr;
            if (!notified[k]) {
                new Notification('📅 Deadline zítra', { body: todo.text });
                notified[k] = true;
            }
        }
    });

    localStorage.setItem('notifiedDeadlines', JSON.stringify(notified));
}

function showAdminPanel() {
    document.getElementById('adminPanelOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'adminPanelOverlay';
    overlay.className = 'admin-overlay';
    overlay.innerHTML = `
        <div class="admin-panel">
            <div class="admin-header">
                <h2>⚙️ Správa členů</h2>
                <button class="admin-close" id="adminClose">✕</button>
            </div>
            <div class="admin-body" id="adminBody"></div>
        </div>`;
    document.body.appendChild(overlay);
    document.getElementById('adminClose').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    renderAdminBody();
}

function renderAdminBody() {
    const body = document.getElementById('adminBody');
    if (!body) return;
    body.innerHTML = '';

    // ── Members section ──
    const membersSection = document.createElement('div');
    membersSection.className = 'admin-section';
    const membersTitle = document.createElement('h3');
    membersTitle.className = 'admin-section-title';
    membersTitle.textContent = '👥 Členové';
    membersSection.appendChild(membersTitle);

    Object.entries(allUsers).forEach(([uid, user]) => {
        const row = document.createElement('div');
        row.className = 'admin-member-row';
        const deleteBtnHtml = uid !== currentUser.uid
            ? `<button class="admin-action-btn admin-danger" data-action="delete" data-uid="${uid}">🗑️ Smazat</button>`
            : '';
        row.innerHTML = `
            <img class="admin-member-photo" src="${user.photo || ''}" alt="">
            <div class="admin-member-info">
                <div class="admin-member-name">${user.nickname || user.name?.split(' ')[0] || '?'}</div>
                <div class="admin-member-email">${user.email || ''}</div>
                <div class="admin-member-karma">${user.karma || 0} ⚡</div>
            </div>
            <div class="admin-member-actions">
                <button class="admin-action-btn" data-action="rename" data-uid="${uid}">✏️ Přezdívka</button>
                <div class="admin-karma-controls">
                    <input type="number" class="admin-karma-input" id="karma-input-${uid}" placeholder="±body">
                    <input type="text" class="admin-karma-reason" id="karma-reason-${uid}" placeholder="Důvod...">
                    <button class="admin-action-btn admin-karma-add" data-action="karma" data-uid="${uid}">⚡ Upravit</button>
                </div>
                ${deleteBtnHtml}
            </div>`;
        membersSection.appendChild(row);
    });
    body.appendChild(membersSection);

    // ── History section ──
    const histSection = document.createElement('div');
    histSection.className = 'admin-section';
    const histTitle = document.createElement('h3');
    histTitle.className = 'admin-section-title';
    histTitle.textContent = '📋 Historie změn bodů';
    histSection.appendChild(histTitle);
    const histList = document.createElement('div');
    histList.className = 'admin-history';
    histList.id = 'adminHistoryList';
    histSection.appendChild(histList);
    body.appendChild(histSection);

    get(ref(db, 'karmaHistory')).then(snap => {
        const list = document.getElementById('adminHistoryList');
        if (!list) return;
        const data = snap.val();
        if (!data) { list.innerHTML = '<div class="admin-history-empty">Žádná historie</div>'; return; }
        const entries = Object.values(data).sort((a, b) => b.at - a.at).slice(0, 50);
        entries.forEach(entry => {
            const d = new Date(entry.at);
            const dateStr = `${d.getDate()}.${d.getMonth() + 1}. ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
            const deltaStr = entry.delta > 0 ? `+${entry.delta}` : `${entry.delta}`;
            const deltaColor = entry.delta > 0 ? '#30d158' : '#ff453a';
            const targetName = allUsers[entry.uid]?.nickname || allUsers[entry.uid]?.name?.split(' ')[0] || '?';
            const item = document.createElement('div');
            item.className = 'admin-history-item';
            item.innerHTML = `
                <span class="ah-date">${dateStr}</span>
                <span class="ah-target">${targetName}</span>
                <span class="ah-delta" style="color:${deltaColor}">${deltaStr} ⚡</span>
                <span class="ah-reason">${entry.reason || '—'}</span>
                <span class="ah-by">od ${entry.byName || '?'}</span>`;
            list.appendChild(item);
        });
    });

    // ── Action handlers ──
    body.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const action = btn.dataset.action;
            const uid = btn.dataset.uid;
            const user = allUsers[uid];

            if (action === 'rename') {
                const current = user?.nickname || '';
                const newName = prompt(`Nová přezdívka pro ${current}:`, current);
                if (newName && newName.trim() && newName.trim() !== current) {
                    await update(ref(db, 'users/' + uid), { nickname: newName.trim() });
                }
            }

            if (action === 'karma') {
                const input = document.getElementById('karma-input-' + uid);
                const reasonInput = document.getElementById('karma-reason-' + uid);
                const delta = parseInt(input?.value);
                if (isNaN(delta) || delta === 0) { input?.focus(); return; }
                const reason = reasonInput?.value.trim() || 'Ruční úprava adminem';
                await deltaKarma(uid, delta);
                await push(ref(db, 'karmaHistory'), {
                    uid, delta, reason,
                    by: currentUser.uid,
                    byName: currentNickname,
                    at: Date.now()
                });
                if (input) input.value = '';
                if (reasonInput) reasonInput.value = '';
            }

            if (action === 'delete') {
                const name = user?.nickname || user?.name?.split(' ')[0] || uid;
                if (!confirm(`Opravdu smazat člena ${name}? Tato akce nelze vrátit.`)) return;
                await remove(ref(db, 'users/' + uid));
            }
        });
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

    document.querySelector('.sidebar').appendChild(picker);
}

function renderDayBanner() {
    const existing = document.getElementById('dayBanner');
    const show = activeTab === 'deadlines' && selectedDay !== null;

    if (!show) { existing?.remove(); return; }

    const dayNamesCz = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
    const date = new Date(selectedYear, selectedMonth, selectedDay);
    const label = `${dayNamesCz[date.getDay()].charAt(0).toUpperCase() + dayNamesCz[date.getDay()].slice(1)}, ${selectedDay}. ${selectedMonth + 1}. ${selectedYear}`;

    let banner = existing;
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'dayBanner';
        banner.className = 'day-banner';
        document.getElementById('filterBar').after(banner);
    }

    banner.innerHTML = `<span class="day-banner-label">📅 ${label}</span><button class="day-banner-close" id="dayBannerClose">✕ Zobrazit vše</button>`;

    document.getElementById('dayBannerClose').addEventListener('click', () => {
        selectedDay = null; selectedMonth = null; selectedYear = null;
        renderCalendar();
        renderTodos();
    });
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const currentDateEl = document.getElementById('currentDate');
    calendar.innerHTML = '';
    document.getElementById('yearPicker')?.remove();

    currentDateEl.innerHTML = `<span class="month-btn-label">${months[currentMonth]}</span> <span class="year-btn" id="yearBtn">${currentYear}</span>`;
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
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const tasksByDay = {};
    Object.entries(allTodos).forEach(([key, todo]) => {
        if (!todo.deadline || !matchesFilter(todo)) return;
        const d = new Date(todo.deadline + 'T00:00:00');
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;
        const day = d.getDate();
        if (!tasksByDay[day]) tasksByDay[day] = [];
        tasksByDay[day].push({ key, ...todo });
    });

    for (let i = 0; i < offset; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-cell empty';
        calendar.appendChild(empty);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i);
        const cell = document.createElement('div');
        cell.className = 'cal-cell';

        if (date.toDateString() === today.toDateString()) cell.classList.add('today');
        if (i === selectedDay && currentMonth === selectedMonth && currentYear === selectedYear) cell.classList.add('active');

        const numEl = document.createElement('div');
        numEl.className = 'cal-day-num';
        numEl.textContent = i;
        cell.appendChild(numEl);

        const tasks = tasksByDay[i] || [];
        tasks.slice(0, 3).forEach(todo => {
            const chip = document.createElement('div');
            chip.className = 'cal-task-chip' + (todo.done ? ' done' : '');
            const color = priorityLabels[todo.priority]?.color || '#0a84ff';
            chip.style.background = color + '28';
            chip.style.borderLeft = `2px solid ${color}`;
            chip.textContent = todo.text;
            cell.appendChild(chip);
        });

        if (tasks.length > 3) {
            const more = document.createElement('div');
            more.className = 'cal-more';
            more.textContent = `+${tasks.length - 3}`;
            cell.appendChild(more);
        }

        cell.addEventListener('click', () => {
            selectedDay = i;
            selectedMonth = currentMonth;
            selectedYear = currentYear;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-tab="deadlines"]').classList.add('active');
            activeTab = 'deadlines';
            document.getElementById('todoList').style.display = 'none';
            document.getElementById('deadlineList').style.display = 'block';
            document.getElementById('todoDate').style.display = 'block';
            renderCalendar();
            renderTodos();
        });

        calendar.appendChild(cell);
    }
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

function renderSearch() {
    const results = document.getElementById('searchResults');
    const mainContent = document.getElementById('mainContent');

    if (!searchQuery) {
        results.style.display = 'none';
        mainContent.style.display = '';
        return;
    }

    mainContent.style.display = 'none';
    results.style.display = 'block';
    results.innerHTML = '';

    const q = searchQuery.toLowerCase();
    let found = false;

    Object.keys(allTodos).forEach(key => {
        const todo = allTodos[key];
        if (!todo.text.toLowerCase().includes(q)) return;
        results.appendChild(todo.deadline ? createDeadlineItem(key, todo) : createTodoItem(key, todo));
        found = true;
    });

    if (!found) {
        const empty = document.createElement('li');
        empty.className = 'empty-message';
        empty.textContent = `Žádné výsledky pro „${searchQuery}"`;
        results.appendChild(empty);
    }
}

function renderTodos() {
    if (searchQuery) { renderSearch(); return; }

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
            if (!matchesFilter(todo)) return;
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
            if (!matchesFilter(todo)) return;
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

    renderDayBanner();
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
    checkbox.addEventListener('change', async () => {
        const nowDone = checkbox.checked;
        update(ref(db, 'todos/' + key), { done: nowDone });
        const uid = todo.assignedTo?.uid || todo.createdBy?.uid;
        await deltaKarma(uid, nowDone ? 5 : -5);
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
    checkbox.addEventListener('change', async () => {
        const nowDone = checkbox.checked;
        const uid = todo.assignedTo?.uid || todo.createdBy?.uid;
        if (nowDone) {
            const todayD = new Date();
            todayD.setHours(0, 0, 0, 0);
            const deadline = new Date(todo.deadline + 'T00:00:00');
            const karma = todayD < deadline ? 15 : 10;
            update(ref(db, 'todos/' + key), { done: true, karmaGiven: karma });
            await deltaKarma(uid, karma);
        } else {
            const karmaGiven = todo.karmaGiven || 10;
            update(ref(db, 'todos/' + key), { done: false, karmaGiven: null });
            await deltaKarma(uid, -karmaGiven);
        }
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
