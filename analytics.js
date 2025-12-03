// Система аналитики для Telegram Mini App

class Analytics {
    constructor() {
        this.isTelegram = typeof window.Telegram !== 'undefined' && window.Telegram.WebApp;
        this.userId = null;
        this.initTime = Date.now();
        this.sessionId = this.generateSessionId();
        
        // Получаем данные пользователя из Telegram
        if (this.isTelegram) {
            const tg = window.Telegram.WebApp;
            this.userId = tg.initDataUnsafe?.user?.id || tg.initDataUnsafe?.user?.username || 'anonymous';
        }
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Инициализация Яндекс.Метрики
    // Примечание: счетчик уже инициализирован в HTML, здесь только добавляем параметры
    initYandexMetrika(counterId) {
        if (!counterId) {
            console.warn('Yandex Metrika counter ID not provided');
            return;
        }
        
        this.ymCounterId = counterId;
        
        // Счетчик уже инициализирован в HTML, добавляем параметры пользователя
        // Ждем, пока ym будет доступен
        const addParams = () => {
            if (window.ym && typeof window.ym === 'function') {
                try {
                    // Добавляем параметры к уже инициализированному счетчику
                    window.ym(counterId, "params", {
                        telegram_user_id: this.userId,
                        session_id: this.sessionId,
                        app_type: 'telegram_mini_app'
                    });
                } catch (e) {
                    console.warn('Yandex Metrika params error:', e);
                }
            } else {
                // Если ym еще не загружен, ждем
                setTimeout(addParams, 100);
            }
        };
        
        // Пытаемся добавить параметры после загрузки страницы
        if (document.readyState === 'complete') {
            addParams();
        } else {
            window.addEventListener('load', addParams);
        }
    }
    
    // Инициализация Google Analytics
    initGoogleAnalytics(measurementId) {
        if (!measurementId) {
            console.warn('Google Analytics measurement ID not provided');
            return;
        }
        
        // Загружаем gtag.js
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);
        
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', measurementId, {
            custom_map: {
                'telegram_user_id': this.userId,
                'session_id': this.sessionId,
                'app_type': 'telegram_mini_app'
            }
        });
        
        this.gaMeasurementId = measurementId;
    }
    
    // Отправка события
    trackEvent(category, action, label = null, value = null) {
        const eventData = {
            category,
            action,
            label,
            value,
            timestamp: Date.now(),
            session_id: this.sessionId,
            user_id: this.userId
        };
        
        // Яндекс.Метрика
        if (this.ymCounterId && window.ym) {
            window.ym(this.ymCounterId, "reachGoal", `event_${category}_${action}`, {
                label: label,
                value: value
            });
        }
        
        // Google Analytics
        if (this.gaMeasurementId && window.gtag) {
            window.gtag('event', action, {
                event_category: category,
                event_label: label,
                value: value,
                telegram_user_id: this.userId,
                session_id: this.sessionId
            });
        }
        
        // Локальное логирование (для отладки)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Analytics Event:', eventData);
        }
    }
    
    // Отслеживание просмотра экрана
    trackScreenView(screenName) {
        this.trackEvent('navigation', 'screen_view', screenName);
        
        // Яндекс.Метрика - виртуальный просмотр страницы
        if (this.ymCounterId && window.ym) {
            window.ym(this.ymCounterId, "hit", window.location.href, {
                title: screenName,
                referer: document.referrer
            });
        }
        
        // Google Analytics - просмотр страницы
        if (this.gaMeasurementId && window.gtag) {
            window.gtag('config', this.gaMeasurementId, {
                page_path: `/${screenName}`,
                page_title: screenName
            });
        }
    }
    
    // Отслеживание открытия колоды
    trackDeckOpen(deckName) {
        this.trackEvent('deck', 'open', deckName);
    }
    
    // Отслеживание переворота карты
    trackCardFlip(deckName) {
        this.trackEvent('card', 'flip', deckName);
    }
    
    // Отслеживание переключения карты
    trackCardChange(deckName, direction) {
        this.trackEvent('card', 'change', `${deckName}_${direction}`);
    }
    
    // Отслеживание случайной карты
    trackRandomCard(deckName) {
        this.trackEvent('card', 'random', deckName);
    }
    
    // Отслеживание времени сессии
    trackSessionEnd() {
        const sessionDuration = Math.floor((Date.now() - this.initTime) / 1000);
        this.trackEvent('session', 'end', null, sessionDuration);
    }
}

// Создаем глобальный экземпляр
let analytics = null;

// Инициализация аналитики
function initAnalytics(config = {}) {
    analytics = new Analytics();
    
    // Инициализируем Яндекс.Метрику, если указан ID
    if (config.yandexMetrikaId) {
        analytics.initYandexMetrika(config.yandexMetrikaId);
    }
    
    // Инициализируем Google Analytics, если указан ID
    if (config.googleAnalyticsId) {
        analytics.initGoogleAnalytics(config.googleAnalyticsId);
    }
    
    // Отслеживаем закрытие приложения
    window.addEventListener('beforeunload', () => {
        if (analytics) {
            analytics.trackSessionEnd();
        }
    });
    
    // Отслеживаем видимость страницы (для паузы/возобновления сессии)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && analytics) {
            analytics.trackEvent('session', 'pause');
        } else if (analytics) {
            analytics.trackEvent('session', 'resume');
        }
    });
    
    return analytics;
}

