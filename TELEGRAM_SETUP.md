# Инструкция по настройке Telegram Mini App

## Краткое руководство

### 1. Разместите файлы на хостинге

Рекомендуемые варианты:
- **GitHub Pages** (бесплатно)
- **Netlify** (бесплатно)
- **Vercel** (бесплатно)
- **Any веб-хостинг** (поддерживающий статические файлы)

### 2. Получите URL приложения

Например: `https://yourusername.github.io/ConversationCards-Web/`

**Важно:** URL должен быть HTTPS!

### 3. Создайте бота через @BotFather

1. Откройте [@BotFather](https://t.me/botfather)
2. Отправьте `/newbot`
3. Укажите имя бота
4. Укажите username бота (должен заканчиваться на `bot`)
5. Сохраните токен (понадобится позже)

### 4. Создайте Mini App

1. В [@BotFather](https://t.me/botfather) выберите `/newapp`
2. Выберите вашего бота
3. Укажите:
   - **Title**: АГОРА — Разговорные карты
   - **Short name**: АГОРА
   - **Description**: Разговорные карты для углубления диалога
   - **Photo**: Загрузите скриншот или иконку (512x512)
   - **Gif**: Опционально
   - **URL**: `https://yourusername.github.io/ConversationCards-Web/`
   - **Secondary URL**: Можно оставить пустым

### 5. Готово!

Теперь пользователи могут:
- Найти вашего бота в Telegram
- Запустить Mini App из меню бота
- Играть прямо в Telegram!

## Альтернативный способ (через Bot API)

Если хотите добавить кнопку меню для быстрого доступа:

```javascript
// Используйте Bot API
const BOT_TOKEN = 'ваш-токен-бота';
const MENU_BUTTON = {
    menu_button: {
        type: 'web_app',
        text: 'Открыть АГОРУ',
        web_app: {
            url: 'https://yourusername.github.io/ConversationCards-Web/'
        }
    }
};

// Отправьте запрос:
// POST https://api.telegram.org/bot{BOT_TOKEN}/setChatMenuButton
```

## Проверка работы

1. Откройте вашего бота в Telegram
2. Нажмите кнопку меню (или команду `/start`)
3. Должно открыться ваше приложение!

## Решение проблем

**Приложение не открывается:**
- Проверьте, что URL начинается с `https://`
- Убедитесь, что все файлы доступны
- Проверьте консоль браузера на ошибки

**Не работает тема:**
- Убедитесь, что подключен Telegram WebApp API: `<script src="https://telegram.org/js/telegram-web-app.js"></script>`

**Не сохраняются данные:**
- Проверьте, что localStorage доступен
- Проверьте права доступа в браузере

## Полезные ссылки

- [Telegram Mini Apps документация](https://core.telegram.org/bots/webapps)
- [Bot API](https://core.telegram.org/bots/api)
- [GitHub Pages](https://pages.github.com/)


