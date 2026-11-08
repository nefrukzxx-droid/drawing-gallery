alert("DRAWING.JS ЗАГРУЗИЛСЯ");
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
const fillButton = document.getElementById("fill");

const rectangleButton = document.getElementById("rectangle");
const circleButton = document.getElementById("circle");
const triangleButton = document.getElementById("triangle");
const lineButton = document.getElementById("line");

const shapeModeInput = document.getElementById("shape-mode");

const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const clearButton = document.getElementById("clear");

const downloadButton = document.getElementById("download");
const publishButton = document.getElementById("publish");

const saveMessage = document.getElementById("save-message");


let isDrawing = false;
let currentTool = "brush";
let shapeStart = null;
let shapeBase = null;

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
    saveMessage.textContent = "Выбран инструмент: " + tool;

    brushButton.classList.toggle("active", tool === "brush");
    eraserButton.classList.toggle("active", tool === "eraser");
    eyedropperButton.classList.toggle("active", tool === "eyedropper");

    fillButton.classList.toggle("active", tool === "fill");

    rectangleButton.classList.toggle("active", tool === "rectangle");
    circleButton.classList.toggle("active", tool === "circle");
    triangleButton.classList.toggle("active", tool === "triangle");
    lineButton.classList.toggle("active", tool === "line");
}
// ПЕРЕКЛЮЧЕНИЕ ИНСТРУМЕНТОВ

brushButton.addEventListener("click", () => selectTool("brush"));
eraserButton.addEventListener("click", () => selectTool("eraser"));
eyedropperButton.addEventListener("click", () => selectTool("eyedropper"));

fillButton.addEventListener("click", () => selectTool("fill"));

rectangleButton.addEventListener("click", () => selectTool("rectangle"));
circleButton.addEventListener("click", () => selectTool("circle"));
triangleButton.addEventListener("click", () => selectTool("triangle"));
lineButton.addEventListener("click", () => selectTool("line"));

// РИСОВАНИЕ ГЕОМЕТРИЧЕСКИХ ФИГУР

function drawShape(tool, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    ctx.lineWidth = Number(sizeInput.value);
    ctx.strokeStyle = colorInput.value;
    ctx.fillStyle = colorInput.value;

    ctx.beginPath();

    if (tool === "rectangle") {
        ctx.rect(start.x, start.y, dx, dy);
    }

    if (tool === "circle") {
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
    }

    if (tool === "triangle") {
        ctx.moveTo(start.x + dx / 2, start.y);
        ctx.lineTo(start.x + dx, start.y + dy);
        ctx.lineTo(start.x, start.y + dy);
        ctx.closePath();
    }

    if (tool === "line") {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
    }

    if (tool === "line" || shapeModeInput.value === "stroke") {
        ctx.stroke();
    } else {
        ctx.fill();
    }
}
// ЗАЛИВКА

function floodFill(startX, startY) {
    const imageData = ctx.getImageData(
        0, 0, canvas.width, canvas.height
    );

    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    const startIndex = (startY * width + startX) * 4;

    const target = [
        data[startIndex],
        data[startIndex + 1],
        data[startIndex + 2]
    ];

    const hex = colorInput.value;
    const replacement = [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ];

    if (target.every((v, i) => v === replacement[i])) return;

    const tolerance = 24;

    function matches(x, y) {
        if (x < 0 || x >= width || y < 0 || y >= height) {
            return false;
        }

        const i = (y * width + x) * 4;

        return Math.abs(data[i] - target[0]) <= tolerance &&
               Math.abs(data[i + 1] - target[1]) <= tolerance &&
               Math.abs(data[i + 2] - target[2]) <= tolerance;
    }

    const stack = [[startX, startY]];

    while (stack.length) {
        const [x, y] = stack.pop();

        if (!matches(x, y)) continue;

        let left = x;

        while (left > 0 && matches(left - 1, y)) {
            left--;
        }

        let above = false;
        let below = false;

        for (let px = left; px < width && matches(px, y); px++) {
            const i = (y * width + px) * 4;

            data[i] = replacement[0];
            data[i + 1] = replacement[1];
            data[i + 2] = replacement[2];
            data[i + 3] = 255;

            if (y > 0) {
                if (matches(px, y - 1)) {
                    if (!above) stack.push([px, y - 1]);
                    above = true;
                } else {
                    above = false;
                }
            }

            if (y < height - 1) {
                if (matches(px, y + 1)) {
                    if (!below) stack.push([px, y + 1]);
                    below = true;
                } else {
                    below = false;
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
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

    if (currentTool === "fill") {
        saveState();
        floodFill(Math.floor(pos.x), Math.floor(pos.y));
        return;
    }

    if (
        currentTool === "rectangle" ||
        currentTool === "circle" ||
        currentTool === "triangle" ||
        currentTool === "line"
    ) {
        saveState();
        shapeStart = pos;
        shapeBase = ctx.getImageData(
            0, 0, canvas.width, canvas.height
        );

        isDrawing = true;
        canvas.setPointerCapture(event.pointerId);
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

    // Если рисуем фигуру
    if (
        currentTool === "rectangle" ||
        currentTool === "circle" ||
        currentTool === "triangle" ||
        currentTool === "line"
    ) {
        ctx.putImageData(shapeBase, 0, 0);
        drawShape(currentTool, shapeStart, pos);
        return;
    }

    // Обычное рисование
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

function stopDrawing(event) {
    if (!isDrawing) return;

    if (shapeStart && shapeBase) {
        const pos = getPosition(event);

        ctx.putImageData(shapeBase, 0, 0);
        drawShape(currentTool, shapeStart, pos);
    }

    isDrawing = false;
    shapeStart = null;
    shapeBase = null;

    ctx.beginPath();
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", stopDrawing);


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