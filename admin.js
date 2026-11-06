
const SUPABASE_URL = "https://yeebjtnibglyejgxqvhm.supabase.co";

// Вставь сюда тот же Publishable key, который уже используется в drawing.js
const SUPABASE_KEY = "sb_publishable_VY60RiLPCOavVZ0TWIHxBQ_NpQ5Lpwn";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const content = document.getElementById("admin-content");
const pendingCount = document.getElementById("pending-count");

// Проверяем авторизацию
async function checkAuth() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        throw error;
    }

    if (!data.session) {
        content.innerHTML = `
            <p class="error-message">
                Сначала войди в аккаунт модератора.
                <br><br>
                <a href="drawing.html">Перейти ко входу</a>
            </p>
        `;
        return false;
    }

    return true;
}

// Получаем рисунки на проверку
async function loadDrawings() {
    content.innerHTML = '<p class="loading">Загружаем рисунки...</p>';

    try {
        const authorized = await checkAuth();

        if (!authorized) {
            pendingCount.textContent = "—";
            return;
        }

        const { data: drawings, error } = await supabaseClient
            .from("drawings")
            .select("id, created_at, title, image_url, status")
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        pendingCount.textContent = drawings.length;

        content.innerHTML = "";

        if (drawings.length === 0) {
            content.innerHTML = `
                <p class="empty-message">
                    Пока нет рисунков на проверку.
                </p>
            `;
            return;
        }

        for (const drawing of drawings) {
            await createDrawingCard(drawing);
        }

    } catch (error) {
        console.error("Ошибка загрузки:", error);

        content.innerHTML = `
            <p class="error-message">
                Не удалось загрузить рисунки.
                <br>
                ${escapeHTML(error.message)}
            </p>
        `;
    }
}

// Защита текста от вставки HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

// Создаём карточку рисунка
async function createDrawingCard(drawing) {
    const card = document.createElement("article");
    card.className = "drawing-card";

    const title = document.createElement("h2");
    title.textContent = drawing.title || "Без названия";

    const date = document.createElement("p");
    date.className = "drawing-date";
    date.textContent = new Date(drawing.created_at).toLocaleString("ru-RU");

    const image = document.createElement("img");
    image.className = "drawing-preview";
    image.alt = drawing.title || "Рисунок";

    // Получаем временную ссылку на файл из приватного хранилища
    const { data: imageData, error: imageError } =
        await supabaseClient.storage
            .from("drawings")
            .createSignedUrl(drawing.image_url, 3600);

    if (imageError) {
        console.error("Ошибка получения изображения:", imageError);
        image.alt = "Не удалось загрузить изображение";
    } else {
        image.src = imageData.signedUrl;
    }

    const actions = document.createElement("div");
    actions.className = "drawing-actions";

    const approveButton = document.createElement("button");
    approveButton.className = "approve-button";
    approveButton.textContent = "Одобрить";

    const rejectButton = document.createElement("button");
    rejectButton.className = "reject-button";
    rejectButton.textContent = "Отклонить";

    approveButton.addEventListener("click", () => {
        moderateDrawing(drawing.id, "approved", approveButton, rejectButton);
    });

    rejectButton.addEventListener("click", () => {
        moderateDrawing(drawing.id, "rejected", approveButton, rejectButton);
    });

    actions.append(approveButton, rejectButton);
    card.append(title, date, image, actions);

    content.appendChild(card);
}

// Меняем статус рисунка
async function moderateDrawing(id, newStatus, approveButton, rejectButton) {
    const actionName = newStatus === "approved" ? "одобрить" : "отклонить";

    if (!confirm(`Ты действительно хочешь ${actionName} этот рисунок?`)) {
        return;
    }

    approveButton.disabled = true;
    rejectButton.disabled = true;

    try {
        const { data, error } = await supabaseClient
            .from("drawings")
            .update({ status: newStatus })
            .eq("id", id)
            .eq("status", "pending")
            .select("id");

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error("Рисунок уже обработан или не найден.");
        }

        await loadDrawings();

    } catch (error) {
        console.error("Ошибка модерации:", error);
        alert("Не удалось изменить статус: " + error.message);

        approveButton.disabled = false;
        rejectButton.disabled = false;
    }
}

// Запускаем панель
loadDrawings();
