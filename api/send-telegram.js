// Vercel Serverless Function для отправки заявок в Telegram и amoCRM
export default async function handler(req, res) {
  // Настройки Telegram бота
  const TELEGRAM_BOT_TOKEN = '8371321529:AAGk8okwfw5CMvg9brXd27g-bSWsAmwh-J4';
  const TELEGRAM_CHAT_ID = '-5114440637';

  // Настройки amoCRM
  const AMOCRM_SUBDOMAIN = 'addastra';
  const AMOCRM_INTEGRATION_ID = '21e1d711-c2fa-4424-a4c7-5234ba247be2';
  const AMOCRM_SECRET_KEY = 'x3J3eYyILwsk48Le7lerS5T8pu4AwYSuqcqXc1K9D2TIwZ8RGrKSI5DdMaVCDx3R';
  const AMOCRM_REDIRECT_URI = 'https://addastra-law.kz';

  // Текущие токены (обновляются автоматически)
  let AMOCRM_ACCESS_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImE2YjE2YWRiNzg3OGE3MWUyNzAwYTJlYzdkNzUwM2NiOGMxMDNmMjA4MWI5OTNiMTA3N2MzODI1OGYwYmFhM2RkM2Y3MTVmMmJhMWJlYmVjIn0.eyJhdWQiOiIyMWUxZDcxMS1jMmZhLTQ0MjQtYTRjNy01MjM0YmEyNDdiZTIiLCJqdGkiOiJhNmIxNmFkYjc4NzhhNzFlMjcwMGEyZWM3ZDc1MDNjYjhjMTAzZjIwODFiOTkzYjEwNzdjMzgyNThmMGJhYTNkZDNmNzE1ZjJiYTFiZWJlYyIsImlhdCI6MTc2Nzc4NDU5MSwibmJmIjoxNzY3Nzg0NTkxLCJleHAiOjE3Njc4NzA5OTEsInN1YiI6IjEyOTEwNTc4IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyNjMwMTk0LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJwdXNoX25vdGlmaWNhdGlvbnMiLCJmaWxlcyIsImNybSIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiM2Q5NmU2ZmItM2I0OC00NDM1LWE4OGYtMTlmNjQ2OTJhNTVlIiwidXNlcl9mbGFncyI6MCwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.jjIBOC-TVWXexo926e9gw6zrMZwaQmpGYgAH5UQTfFxERLg40RYhpEoA14D8MPVgYjbafI6F1ZIE9HIaJtNkefHk36sT3e5yjWtb6kluPp97WWPhoDgWHbwrs-gnxj4K1zGKqfE8nkKW1PnSmyHh2oUO7hUO8Sk6cj4JkVwTT0HhpyaE5A3hORRkvJCHzmKJUZkpMnz9vgsi2EewW7HooAhDj-d-oQ811TroNQACh2e5T-VSM5D9t5N6qEjyO6XjGogdio_Qp9HnHTDv7UBpMqCh5QQFt1I1Jmx2On_nHfNpAWZi4NkfYLcp5Yp0kcqOMnVOy17PHxVko0YZU1EBug';
  let AMOCRM_REFRESH_TOKEN = 'def502007fbe857b02ff70d67f90207d67f02d133c5a31bd18d0dbda385b09a872317776735988587dd0965216f00debf7fdb7c20d9ef4d32152c838b0bb4d60a3198daf2b071dccb2ff8b7e75b15ab2a5e679c436431b7282840c95e9651a8674c4034725c89eb7e8f63fb0dc4ee5cf5a2991f3c2f0816e95c5352498e68cd0a45b27a92c883ab3c31be452093fbaefcdd79a3439bbad594fc47c876b6c3b26fe209c076da6d9b7b270cbed1b2f92467bf0d50342c1bfb83549657c9f6cb5b3bd82213388eb6eb65c33ad7328d41375171526f2d2ba1c9d4577641545bd1cde728e59644431012b77e7801e591af311db805ea03222c00d38565c8c6e2b882c3af4f66da9da0482d36d4bb3fbd949a240730880e53ae0893a91dd790ed413a7511c05795aaff1e136f4fbbe41b789aed3585ddcc4fc33923ec313b55b85e0a0ff8e5a5aa3b312eb68aaf5620b719675141602d80cb674c1eb80298bbe8fc50faeb5a4306203c732b7f75d73700cf7da091178be4de1a33defa29b4ce40d65aaa393d903bf804ece36fed3d9f88be3eab1401397d1a20c814fbaf68b1738f11abd71861620c0a3ff5dd975048b8d7d44f9cfd608c6f295d0d9b9506133cd288798fa7e5c560c49773c92b6b2a66c19daff333ddd4f5572e366fee024b26ff6d7cf9e3754434c4464eaae1cba9af0';

  // Воронка и этап для новых заявок
  const AMOCRM_PIPELINE_ID = 10013954; // "Воронка"
  const AMOCRM_STATUS_ID = 79455042;   // "Неразобранное"

  // Функция обновления amoCRM токена
  async function refreshAmoCRMToken() {
    try {
      const tokenUrl = `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/oauth2/access_token`;

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: AMOCRM_INTEGRATION_ID,
          client_secret: AMOCRM_SECRET_KEY,
          grant_type: 'refresh_token',
          refresh_token: AMOCRM_REFRESH_TOKEN,
          redirect_uri: AMOCRM_REDIRECT_URI
        })
      });

      const data = await response.json();

      if (data.access_token) {
        AMOCRM_ACCESS_TOKEN = data.access_token;
        AMOCRM_REFRESH_TOKEN = data.refresh_token;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
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

      // Формирование данных для сделки
      const leadData = {
        name: `Заявка: ${type}`,
        pipeline_id: AMOCRM_PIPELINE_ID,
        status_id: AMOCRM_STATUS_ID,
        custom_fields_values: []
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

      // Отправка в amoCRM
      const amoUrl = `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/complex`;

      const amoResponse = await fetch(amoUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AMOCRM_ACCESS_TOKEN}`
        },
        body: JSON.stringify(amoData)
      });

      let amoResult = await amoResponse.json();

      // Если токен истёк (401), обновляем его и пробуем снова
      if (amoResponse.status === 401) {
        console.log('amoCRM token expired, refreshing...');
        const refreshed = await refreshAmoCRMToken();

        if (refreshed) {
          // Повторная попытка с новым токеном
          const retryResponse = await fetch(amoUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AMOCRM_ACCESS_TOKEN}`
            },
            body: JSON.stringify(amoData)
          });

          amoResult = await retryResponse.json();

          if (!retryResponse.ok) {
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
            'Authorization': `Bearer ${AMOCRM_ACCESS_TOKEN}`
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
  }
}
