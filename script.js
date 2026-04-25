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
