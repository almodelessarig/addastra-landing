// Vercel Serverless Function для отправки заявок в Telegram и amoCRM
import { createClient } from 'redis';

export default async function handler(req, res) {
  // Настройки Telegram бота
  const TELEGRAM_BOT_TOKEN = '8371321529:AAGk8okwfw5CMvg9brXd27g-bSWsAmwh-J4';
  const TELEGRAM_CHAT_ID = '-1003758744538';

  // Настройки amoCRM
  const AMOCRM_SUBDOMAIN = 'addastra';
  const AMOCRM_INTEGRATION_ID = '21e1d711-c2fa-4424-a4c7-5234ba247be2';
  const AMOCRM_SECRET_KEY = 'x3J3eYyILwsk48Le7lerS5T8pu4AwYSuqcqXc1K9D2TIwZ8RGrKSI5DdMaVCDx3R';
  const AMOCRM_REDIRECT_URI = 'https://addastra-laws.kz';

  // Воронка и этап для новых заявок
  const AMOCRM_PIPELINE_ID = 10013954; // "Воронка"
  const AMOCRM_STATUS_ID = 79455042;   // "Неразобранное"

  // ID пользовательского поля "Тип учреждения"
  const INSTITUTION_TYPE_FIELD_ID = 1262727;

  // Маппинг типов учреждений на ID в amoCRM
  // Значения должны соответствовать опциям в форме на сайте (index.html)
  const INSTITUTION_TYPES = {
    'Частная школа': 1440713,
    'Образовательный центр': 1440715,
    'Детский сад': 1440717,
    'Другое': 1440719
  };

  // Redis клиент
  let redis = null;

  async function getRedisClient() {
    if (!redis) {
      redis = createClient({ url: process.env.REDIS_URL });
      redis.on('error', err => console.error('Redis error:', err));
      await redis.connect();
    }
    return redis;
  }

  // Получение токенов из Redis
  async function getTokens() {
    try {
      const client = await getRedisClient();
      const accessToken = await client.get('amocrm_access_token');
      const refreshToken = await client.get('amocrm_refresh_token');
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Error getting tokens from Redis:', error);
      return { accessToken: null, refreshToken: null };
    }
  }

  // Сохранение токенов в Redis
  async function saveTokens(accessToken, refreshToken) {
    try {
      const client = await getRedisClient();
      await client.set('amocrm_access_token', accessToken);
      await client.set('amocrm_refresh_token', refreshToken);
      return true;
    } catch (error) {
      console.error('Error saving tokens to Redis:', error);
      return false;
    }
  }

  // Функция обновления amoCRM токена
  async function refreshAmoCRMToken(currentRefreshToken) {
    try {
      const tokenUrl = `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/oauth2/access_token`;

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: AMOCRM_INTEGRATION_ID,
          client_secret: AMOCRM_SECRET_KEY,
          grant_type: 'refresh_token',
          refresh_token: currentRefreshToken,
          redirect_uri: AMOCRM_REDIRECT_URI
        })
      });

      const data = await response.json();

      if (data.access_token) {
        // Сохраняем новые токены в Redis
        await saveTokens(data.access_token, data.refresh_token);
        return {
          success: true,
          accessToken: data.access_token,
          refreshToken: data.refresh_token
        };
      }

      console.error('Token refresh failed:', data);
      return { success: false };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false };
    }
  }

  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обработка preflight запроса
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Проверка метода запроса
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Метод не разрешен' });
    return;
  }

  try {
    // Получение данных из запроса
    const data = req.body;

    // Валидация обязательных полей
    if (!data.name || !data.phone) {
      res.status(400).json({ success: false, message: 'Заполните все обязательные поля' });
      return;
    }

    // Извлечение данных
    const name = String(data.name || '').trim();
    const phone = String(data.phone || '').trim();
    const type = String(data.type || 'Не указано').trim();

    // UTM метки
    const utm_source = String(data.utm_source || 'Прямой заход').trim();
    const utm_medium = String(data.utm_medium || '-').trim();
    const utm_campaign = String(data.utm_campaign || '-').trim();
    const utm_term = String(data.utm_term || '-').trim();
    const utm_content = String(data.utm_content || '-').trim();

    // Дополнительные данные
    const page_url = String(data.page_url || '-').trim();
    const referrer = String(data.referrer || '-').trim();
    const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' });

    // Формирование сообщения для Telegram
    let message = "🔔 <b>Новая заявка с сайта ADDASTRA</b>\n\n";
    message += `👤 <b>Имя:</b> ${name}\n`;
    message += `📱 <b>Телефон:</b> ${phone}\n`;
    message += `🏫 <b>Тип учреждения:</b> ${type}\n`;
    message += `🕐 <b>Время:</b> ${timestamp}\n\n`;

    message += "📊 <b>UTM-метки:</b>\n";
    message += `├ Source: ${utm_source}\n`;
    message += `├ Medium: ${utm_medium}\n`;
    message += `├ Campaign: ${utm_campaign}\n`;
    message += `├ Term: ${utm_term}\n`;
    message += `└ Content: ${utm_content}\n\n`;

    message += "🌐 <b>Дополнительно:</b>\n";
    message += `├ Страница: ${page_url}\n`;
    message += `└ Источник перехода: ${referrer}\n`;

    // Отправка сообщения в Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const telegramResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error('Telegram API error:', telegramData);
      res.status(500).json({
        success: false,
        message: 'Ошибка отправки заявки в Telegram'
      });
      return;
    }

    // Отправка данных в amoCRM
    try {
      // Получаем токены из Redis
      let { accessToken, refreshToken } = await getTokens();

      if (!accessToken || !refreshToken) {
        console.error('No tokens found in Redis');
        res.status(200).json({
          success: true,
          message: 'Заявка отправлена в Telegram, но токены amoCRM не настроены'
        });
        return;
      }

      // Формирование данных для контакта
      const contactData = {
        name: name,
        custom_fields_values: [
          {
            field_code: 'PHONE',
            values: [
              {
                value: phone,
                enum_code: 'WORK'
              }
            ]
          }
        ]
      };

      // Формирование данных для сделки с UTM-метками и типом учреждения
      const leadCustomFields = [
        // UTM метки
        { field_code: 'UTM_SOURCE', values: [{ value: utm_source }] },
        { field_code: 'UTM_MEDIUM', values: [{ value: utm_medium }] },
        { field_code: 'UTM_CAMPAIGN', values: [{ value: utm_campaign }] },
        { field_code: 'UTM_TERM', values: [{ value: utm_term }] },
        { field_code: 'UTM_CONTENT', values: [{ value: utm_content }] },
        { field_code: 'REFERRER', values: [{ value: referrer }] }
      ];

      // Добавляем тип учреждения, если он соответствует одному из известных
      const institutionTypeId = INSTITUTION_TYPES[type];
      if (institutionTypeId) {
        leadCustomFields.push({
          field_id: INSTITUTION_TYPE_FIELD_ID,
          values: [{ enum_id: institutionTypeId }]
        });
      }

      const leadData = {
        name: `Заявка: ${type}`,
        pipeline_id: AMOCRM_PIPELINE_ID,
        status_id: AMOCRM_STATUS_ID,
        custom_fields_values: leadCustomFields
      };

      // Добавляем UTM-метки как примечание к сделке
      const utmNote = `UTM Source: ${utm_source}\nUTM Medium: ${utm_medium}\nUTM Campaign: ${utm_campaign}\nUTM Term: ${utm_term}\nUTM Content: ${utm_content}\nСтраница: ${page_url}\nИсточник перехода: ${referrer}`;

      // Создание комплексной сущности (сделка + контакт)
      const amoData = [
        {
          ...leadData,
          _embedded: {
            contacts: [contactData]
          }
        }
      ];

      // Функция отправки в amoCRM
      async function sendToAmoCRM(token) {
        const amoUrl = `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/complex`;
        return await fetch(amoUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(amoData)
        });
      }

      // Первая попытка отправки
      let amoResponse = await sendToAmoCRM(accessToken);
      let amoResult = await amoResponse.json();

      // Если токен истёк (401), обновляем его и пробуем снова
      if (amoResponse.status === 401) {
        console.log('amoCRM token expired, refreshing...');
        const refreshResult = await refreshAmoCRMToken(refreshToken);

        if (refreshResult.success) {
          // Повторная попытка с новым токеном
          accessToken = refreshResult.accessToken;
          amoResponse = await sendToAmoCRM(accessToken);
          amoResult = await amoResponse.json();

          if (!amoResponse.ok) {
            console.error('amoCRM API error after token refresh:', amoResult);
            res.status(200).json({
              success: true,
              message: 'Заявка отправлена в Telegram, но возникла ошибка при отправке в amoCRM'
            });
            return;
          }
        } else {
          console.error('Failed to refresh amoCRM token');
          res.status(200).json({
            success: true,
            message: 'Заявка отправлена в Telegram, но возникла ошибка при обновлении токена amoCRM'
          });
          return;
        }
      }

      if (amoResponse.ok && amoResult[0]?.id) {
        // Добавляем примечание с UTM-метками к созданной сделке
        const leadId = amoResult[0].id;
        const noteUrl = `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/${leadId}/notes`;

        await fetch(noteUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify([
            {
              note_type: 'common',
              params: {
                text: utmNote
              }
            }
          ])
        });

        res.status(200).json({
          success: true,
          message: 'Заявка успешно отправлена в Telegram и amoCRM!'
        });
      } else {
        console.error('amoCRM API error:', amoResult);
        // Telegram отправлен успешно, но amoCRM не сработал
        res.status(200).json({
          success: true,
          message: 'Заявка отправлена в Telegram, но возникла ошибка при отправке в amoCRM'
        });
      }
    } catch (amoError) {
      console.error('amoCRM error:', amoError);
      // Telegram отправлен успешно, но amoCRM не сработал
      res.status(200).json({
        success: true,
        message: 'Заявка отправлена в Telegram, но возникла ошибка при отправке в amoCRM'
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  } finally {
    // Закрываем Redis соединение
    if (redis) {
      await redis.quit().catch(() => {});
    }
  }
}
