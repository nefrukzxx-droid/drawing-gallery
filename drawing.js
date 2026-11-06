// SUPABASE
const SUPABASE_URL = "https://yeebjtnibglyejgxqvhm.supabase.co";
const SUPABASE_KEY = "sb_publishable_VY60RiLPCOavVZ0TWIHxBQ_NpQ5Lpwn";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ЭЛЕМЕНТЫ АВТОРИЗАЦИИ
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("moderator-email");
const passwordInput = document.getElementById("moderator-password");
const accountPanel = document.getElementById("account-panel");
const accountMessage = document.getElementById("account-message");
const authMessage = document.getElementById("auth-message");
const logoutButton = document.getElementById("logout");


// ЭЛЕМЕНТЫ РИСОВАЛКИ
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorInput = document.getElementById("color");
const sizeInput = document.getElementById("size");
const nameInput = document.getElementById("drawing-name");

const brushButton = document.getElementById("brush");
const eraserButton = document.getElementById("eraser");
const eyedropperButton = document.getElementById("eyedropper");

const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const clearButton = document.getElementById("clear");

const downloadButton = document.getElementById("download");
const publishButton = document.getElementById("publish");

const saveMessage = document.getElementById("save-message");


let isDrawing = false;
let currentTool = "brush";

let undoHistory = [];
let redoHistory = [];

const maxHistory = 20;


// НАЧАЛЬНАЯ НАСТРОЙКА ХОЛСТА

ctx.lineCap = "round";
ctx.lineJoin = "round";

ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, canvas.width, canvas.height);


// АВТОРИЗАЦИЯ

async function updateAuthInterface() {
    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (session) {
        loginForm.hidden = true;
        accountPanel.hidden = false;

        accountMessage.textContent =
            "Вход выполнен: " + session.user.email;
    } else {
        loginForm.hidden = false;
        accountPanel.hidden = true;
    }
}


// ВХОД

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    authMessage.textContent = "Выполняется вход...";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        authMessage.textContent =
            "Ошибка входа: " + error.message;
        return;
    }

    passwordInput.value = "";
    authMessage.textContent = "Вход выполнен!";
    await updateAuthInterface();
});


// ВЫХОД

logoutButton.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        authMessage.textContent =
            "Ошибка выхода: " + error.message;
        return;
    }

    authMessage.textContent = "Ты вышла из аккаунта.";
    await updateAuthInterface();
});


// СЛЕЖЕНИЕ ЗА СЕССИЕЙ

supabaseClient.auth.onAuthStateChange(() => {
    updateAuthInterface();
});

updateAuthInterface();


// КООРДИНАТЫ КУРСОРА

function getPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) *
            (canvas.width / rect.width),

        y: (event.clientY - rect.top) *
            (canvas.height / rect.height)
    };
}


// ИСТОРИЯ ДЕЙСТВИЙ

function updateHistoryButtons() {
    undoButton.disabled = undoHistory.length === 0;
    redoButton.disabled = redoHistory.length === 0;
}


function saveState() {
    undoHistory.push(canvas.toDataURL("image/png"));

    if (undoHistory.length > maxHistory) {
        undoHistory.shift();
    }

    redoHistory = [];

    updateHistoryButtons();
}


function restoreState(imageData) {
    const image = new Image();

    image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
    };

    image.src = imageData;
}


// ОТМЕНА

function undo() {
    if (undoHistory.length === 0) return;

    redoHistory.push(canvas.toDataURL("image/png"));

    const previousState = undoHistory.pop();

    restoreState(previousState);
    updateHistoryButtons();
}


// ПОВТОР

function redo() {
    if (redoHistory.length === 0) return;

    undoHistory.push(canvas.toDataURL("image/png"));

    const nextState = redoHistory.pop();

    restoreState(nextState);
    updateHistoryButtons();
}


// ВЫБОР ИНСТРУМЕНТА

function selectTool(tool) {
    currentTool = tool;

    brushButton.classList.toggle("active", tool === "brush");
    eraserButton.classList.toggle("active", tool === "eraser");
    eyedropperButton.classList.toggle("active", tool === "eyedropper");
}


// НАЧАЛО РИСОВАНИЯ

canvas.addEventListener("pointerdown", (event) => {
    const pos = getPosition(event);

    if (currentTool === "eyedropper") {
        const pixel = ctx.getImageData(
            Math.floor(pos.x),
            Math.floor(pos.y),
            1,
            1
        ).data;

        const hex = "#" + [...pixel.slice(0, 3)]
            .map(value => value.toString(16).padStart(2, "0"))
            .join("");

        colorInput.value = hex;

        selectTool("brush");
        return;
    }

    saveState();

    isDrawing = true;

    canvas.setPointerCapture(event.pointerId);

    ctx.lineWidth = Number(sizeInput.value);

    if (currentTool === "eraser") {
        ctx.strokeStyle = "#ffffff";
        ctx.fillStyle = "#ffffff";
    } else {
        ctx.strokeStyle = colorInput.value;
        ctx.fillStyle = colorInput.value;
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
});


// ПРОДОЛЖЕНИЕ РИСОВАНИЯ

canvas.addEventListener("pointermove", (event) => {
    if (!isDrawing) return;

    const pos = getPosition(event);

    ctx.lineWidth = Number(sizeInput.value);

    if (currentTool === "eraser") {
        ctx.strokeStyle = "#ffffff";
    } else {
        ctx.strokeStyle = colorInput.value;
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
});


// ОСТАНОВКА РИСОВАНИЯ

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", stopDrawing);


// ИНСТРУМЕНТЫ

brushButton.addEventListener("click", () => {
    selectTool("brush");
});

eraserButton.addEventListener("click", () => {
    selectTool("eraser");
});

eyedropperButton.addEventListener("click", () => {
    selectTool("eyedropper");
});


// ОТМЕНА И ПОВТОР

undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);


// ГОРЯЧИЕ КЛАВИШИ

document.addEventListener("keydown", (event) => {
    const modifier = event.ctrlKey || event.metaKey;

    if (!modifier) return;

    if (event.key.toLowerCase() === "z") {
        event.preventDefault();

        if (event.shiftKey) {
            redo();
        } else {
            undo();
        }
    }

    if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
    }
});


// ОЧИСТКА ХОЛСТА

clearButton.addEventListener("click", () => {
    saveState();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});


// НАЗВАНИЕ ФАЙЛА

function makeFileName(name) {
    return name
        .trim()
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") || "my-drawing";
}


// СКАЧИВАНИЕ PNG

downloadButton.addEventListener("click", () => {
    const drawingName = nameInput.value.trim();

    if (!drawingName) {
        saveMessage.textContent =
            "Сначала придумай название рисунка!";

        nameInput.focus();
        return;
    }

    canvas.toBlob((blob) => {
        if (!blob) {
            saveMessage.textContent =
                "Не удалось скачать рисунок.";
            return;
        }

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = makeFileName(drawingName) + ".png";

        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        saveMessage.textContent =
            `«${drawingName}» скачан!`;

    }, "image/png");
});


// ЗАГРУЗКА В ГАЛЕРЕЮ

publishButton.addEventListener("click", async () => {
    const drawingName = nameInput.value.trim();

    if (!drawingName) {
        saveMessage.textContent =
            "Сначала придумай название рисунка!";

        nameInput.focus();
        return;
    }

    const {
        data: { session },
        error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
        saveMessage.textContent =
            "Сначала войди в аккаунт модератора.";
        return;
    }

    publishButton.disabled = true;
    saveMessage.textContent = "Загружаем рисунок...";

    try {
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error("Не удалось создать PNG."));
                }
            }, "image/png");
        });
// ПРОВЕРЯЕМ, ЧТО ПОЛЬЗОВАТЕЛЬ ВОШЁЛ

const { data: userData, error: userError } =
    await supabaseClient.auth.getUser();
    console.log("USER ID:", userData.user?.id);
console.log("OWNER ID:", userData.user?.id);
console.log("STATUS:", "pending");

if (userError || !userData.user) {
    throw new Error("Сначала войдите в аккаунт.");
}

// Уникальное имя файла
const fileName =
    crypto.randomUUID() + ".png";

const filePath =
    userData.user.id + "/" + fileName;

        // ЗАГРУЖАЕМ ИЗОБРАЖЕНИЕ

        const { error: uploadError } =
            await supabaseClient.storage
                .from("drawings")
                .upload(filePath, blob, {
                    contentType: "image/png",
                    upsert: false
                });

        if (uploadError) {
            throw uploadError;
        }

        // СОХРАНЯЕМ ИНФОРМАЦИЮ В ТАБЛИЦЕ

        const { error: databaseError } =
            await supabaseClient
                .from("drawings")
                .insert({
                    title: drawingName,
                    image_url: filePath,
                    status: "pending",
                    owner_id: userData.user.id
                });

        if (databaseError) {
    console.error("ОШИБКА БАЗЫ:", databaseError);
    console.log("ID пользователя:", userData.user.id);
    console.log("Данные для отправки:", {
        title: drawingName,
        image_url: filePath,
        status: "pending",
        owner_id: userData.user.id
    });

    throw databaseError;
}

        saveMessage.textContent =
            "Рисунок загружен! Он ожидает одобрения модератора.";

    } catch (error) {
        console.error("Ошибка загрузки:", error);

        saveMessage.textContent =
            "Не удалось загрузить рисунок: " + error.message;

    } finally {
        publishButton.disabled = false;
    }
});