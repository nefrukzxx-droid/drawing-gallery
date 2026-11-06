const SUPABASE_URL = "https://yeebjtnibglyejgxqvhm.supabase.co";
const SUPABASE_KEY = "sb_publishable_VY60RiLPCOavVZ0TWIHxBQ_NpQ5Lpwn";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// Элементы страницы
const form = document.getElementById("authForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitButton");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

let mode = "login";

// Переключение между входом и регистрацией
function setMode(newMode) {
    mode = newMode;

    loginTab.classList.toggle("active", mode === "login");
    registerTab.classList.toggle("active", mode === "register");

    submitButton.textContent =
        mode === "login" ? "Войти" : "Создать аккаунт";

    message.textContent = "";
}

loginTab.addEventListener("click", () => setMode("login"));
registerTab.addEventListener("click", () => setMode("register"));

// Отправка формы
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "Подожди...";
    submitButton.disabled = true;

    try {
        let result;

        if (mode === "register") {
            result = await supabaseClient.auth.signUp({
                email: email.value.trim(),
                password: password.value,
                options: {
                    emailRedirectTo:
                        "https://nefrukzxx-droid.github.io/drawing-gallery/auth.html"
                }
            });
        } else {
            result = await supabaseClient.auth.signInWithPassword({
                email: email.value.trim(),
                password: password.value
            });
        }

        if (result.error) {
            throw result.error;
        }

        if (mode === "register" && !result.data.session) {
            message.textContent =
                "Аккаунт создан! Проверь почту и подтверди регистрацию.";
        } else {
            message.textContent = "Вход выполнен! Перенаправляем...";
            window.location.href = "drawing.html";
        }

    } catch (error) {
        console.error("Ошибка авторизации:", error);
        message.textContent = "Ошибка: " + error.message;
    } finally {
        submitButton.disabled = false;
    }
});