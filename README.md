# Linker — сервис сокращения ссылок

Веб-приложение для сокращения ссылок, разработанное в рамках учебного проекта. Позволяет создавать короткие ссылки, задавать кастомное название, устанавливать срок действия и отслеживать статистику переходов.

## 👥 Команда разработчиков

- **Тимлид:** Артём Мещанинов — [github.com/meschaninov](https://github.com/meschaninov)
- **Backend-разработчик:** Артём Лугуев — [github.com/DeusvulT-I](https://github.com/DeusvulT-I)
- **Frontend-разработчик:** Виктория Гуркина — [github.com/vikagurkina](https://github.com/vikagurkina)
- **QA-тестировщик:** Артём Кулик — [github.com/Anderut](https://github.com/Anderut)
- **Документатор:** Матвей Панов — [github.com/kinzokii](https://github.com/kinzokii)

## 🎯 Цель проекта

Получить практические навыки командной разработки с использованием современного стека технологий: Vue 3, Express, PostgreSQL, Docker, Nginx.

## ✨ Функциональность

- Сокращение любого URL
- Кастомное название ссылки
- Выбор срока действия ссылки: 1, 3, 7, 14 дней или без ограничений
- Счётчик переходов: общий и уникальных по IP
- Хранение своих ссылок без регистрации
- Защита удаления чужих ссылок
- Тёмная и светлая тема
- Страница 404

## 🛠️ Технологии

| Часть | Стек |
|-------|------|
| Frontend | Vue 3, Vite, CSS |
| Backend | Node.js, Express |
| База данных | PostgreSQL 17 |
| Прокси | Nginx |
| Инфраструктура | Docker, docker-compose |

## 📁 Структура проекта

```
linker/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express сервер, миграции
│   │   ├── db.js             # PostgreSQL pool
│   │   └── routes/
│   │       ├── links.js      # POST /api/links, DELETE, GET stats
│   │       └── redirect.js   # GET /r/:slug → редирект
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.vue           # Главная страница
│   │   ├── api.js            # Запросы к API
│   │   ├── style.css         # Глобальные стили и CSS-переменные
│   │   └── components/
│   │       ├── CreateLink.vue  # Форма создания ссылки
│   │       ├── LinkCard.vue    # Карточка ссылки
│   │       └── NotFound.vue    # Страница 404
│   └── Dockerfile
├── nginx/
│   └── nginx.conf            # Проксирование /api и /r на бэкенд
├── init.sql                  # Схема БД
├── docker-compose.yml        # Production
├── docker-compose.dev.yml    # Локальная разработка
├── TESTING.md                # Отчёт тестирования
└── README.md
```

## 🚀 Запуск

```bash
cp .env.example .env
# Указать BASE_URL и DATABASE_URL в .env

docker-compose up -d --build
```

## 🗄️ База данных

```sql
-- Ссылки
CREATE TABLE links (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(50) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  expires_at   TIMESTAMPTZ,
  owner_token  VARCHAR(64),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Переходы
CREATE TABLE visits (
  id         SERIAL PRIMARY KEY,
  link_id    INTEGER REFERENCES links(id) ON DELETE CASCADE,
  ip         VARCHAR(50) NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);
```

> [!TIP]
> Таблицы создаются автоматически при первом запуске через `init.sql`. Миграции (новые колонки) применяются автоматически при старте бэкенда.

## 📡 API

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/links` | Создать короткую ссылку |
| `GET` | `/api/links/:slug/stats` | Статистика переходов |
| `DELETE` | `/api/links/:slug` | Удалить ссылку (требует `X-Owner-Token`) |
| `GET` | `/r/:slug` | Редирект на оригинальный URL |

> [!CAUTION]
> Эндпоинт `DELETE /api/links/:slug` требует заголовок `X-Owner-Token`. Без токена или с чужим токеном вернёт `403 Forbidden`.

## 🧪 Тестирование

Подробный отчёт в файле [TESTING.md](TESTING.md).
