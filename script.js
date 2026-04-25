* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
    background: #1a1a1a;
    min-height: 100vh;
    padding: 15px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    color: #fff;
}

.app {
    background: #242424;
    width: 100%;
    max-width: 500px;
    padding: 24px;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    margin-top: 20px;
    border: 1px solid #333;
}

.header {
    margin-bottom: 20px;
}

h1 {
    color: #fff;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 10px;
}

.month-nav-area {
    display: flex;
    align-items: center;
    gap: 12px;
}

.month-btn {
    background: #333;
    color: #fff;
    border: none;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.month-btn:active {
    background: #f5c518;
    color: #1a1a1a;
}

#currentDate {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    background: #1a1a1a;
    padding: 4px;
    border-radius: 12px;
}

.tab {
    flex: 1;
    padding: 10px;
    background: transparent;
    color: #888;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.tab.active {
    background: #f5c518;
    color: #1a1a1a;
}

.input-area {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

#todoInput {
    flex: 1;
    min-width: 150px;
    padding: 14px 16px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 12px;
    font-size: 16px;
    outline: none;
    color: #fff;
}

#todoInput::placeholder {
    color: #666;
}

#todoInput:focus {
    border-color: #f5c518;
}

#todoDate {
    padding: 14px 12px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 12px;
    font-size: 14px;
    outline: none;
    color: #fff;
    color-scheme: dark;
}

#addBtn {
    width: 50px;
    height: 50px;
    background: #f5c518;
    color: #1a1a1a;
    border: none;
    border-radius: 12px;
    font-size: 24px;
    cursor: pointer;
    font-weight: bold;
    flex-shrink: 0;
}

#addBtn:active {
    background: #d4a80f;
    transform: scale(0.95);
}

#todoList, #deadlineList {
    list-style: none;
    padding: 0;
    margin: 0 0 24px 0;
    min-height:
