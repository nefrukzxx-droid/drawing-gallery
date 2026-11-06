const SUPABASE_URL = "https://yeebjtnibglyejgxqvhm.supabase.co";

const SUPABASE_KEY = "sb_publishable_VY60RiLPCOavVZ0TWIHxBQ_NpQ5Lpwn";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const gallery = document.getElementById("gallery");
const drawingCount = document.getElementById("drawing-count");

async function loadGallery() {
    gallery.innerHTML = '<p class="message">Загружаем рисунки...</p>';

    try {
        const { data: drawings, error } = await supabaseClient
            .from("drawings")
            .select("id, title, created_at, image_url")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        drawingCount.textContent = drawings.length;
        gallery.innerHTML = "";

        if (drawings.length === 0) {
            gallery.innerHTML = `
                <p class="message">
                    Пока здесь пусто. Может, первым будет твой рисунок?
                </p>
            `;
            return;
        }

        for (const drawing of drawings) {
            const card = document.createElement("article");
            card.className = "drawing-card";

            const image = document.createElement("img");
            image.className = "drawing-image";
            image.alt = drawing.title || "Рисунок";
            image.loading = "lazy";

            const title = document.createElement("h2");
            title.textContent = drawing.title || "Без названия";

            const date = document.createElement("p");
            date.className = "drawing-date";
            date.textContent = new Date(
                drawing.created_at
            ).toLocaleDateString("ru-RU");

            const { data, error: imageError } = await supabaseClient
                .storage
                .from("drawings")
                .createSignedUrl(drawing.image_url, 3600);

            if (imageError) {
                console.error("Ошибка изображения:", imageError);
                image.alt = "Не удалось загрузить рисунок";
            } else {
                image.src = data.signedUrl;
            }

            card.append(image, title, date);
            gallery.appendChild(card);
        }

    } catch (error) {
        console.error("Ошибка галереи:", error);

        drawingCount.textContent = "—";
        gallery.innerHTML = `
            <p class="message error-message">
                Не удалось загрузить галерею.
                Проверь настройки Supabase.
            </p>
        `;
    }
}

loadGallery();