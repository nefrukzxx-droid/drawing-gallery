const SUPABASE_URL = "https://yeebjtnibglyejgxqvhm.supabase.co";
const SUPABASE_KEY = "sb_publishable_VY60RiLPCOavVZ0TWIHxBQ_NpQ5Lpwn";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const form = document.getElementById("authForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitButton");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

let mode = "login";

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

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "Подожди...";
    submitButton.disabled = true;

    try {
        let result;

        if (mode === "register") {
            result = await supabase.auth.signUp({
                email: email.value.trim(),
                password: password.value
            });
        } else {
            result = await supabase.auth.signInWithPassword({
                email: email.value.trim(),
                password: password.value
            });
        }

        if (result.error) {
            throw result.error;
        }

        if (mode === "register" && !result.data.session) {
            message.textContent =
                "Аккаунт создан! Проверь почту для подтверждения регистрации.";
        } else {
            message.textContent = "Вход выполнен! Перенаправляем...";
            window.location.href = "drawing.html";
        }

    } catch (error) {
        message.textContent = "Ошибка: " + error.message;
    } finally {
        submitButton.disabled = false;
    }
});