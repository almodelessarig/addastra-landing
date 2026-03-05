// Vercel Serverless Function для отправки заявок в Telegram и amoCRM
export default async function handler(req, res) {
  // Настройки Telegram бота
  const TELEGRAM_BOT_TOKEN = '8371321529:AAGk8okwfw5CMvg9brXd27g-bSWsAmwh-J4';
  const TELEGRAM_CHAT_ID = '-1003758744538';

  // Настройки amoCRM
  const AMOCRM_SUBDOMAIN = 'addastra';
  const AMOCRM_ACCESS_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjNjNTJhYjVjYzBkMzhhNmI2YTk1ODc5YWY0MzUzYTlmMDI3MDQyMGUyMGU5Mjk4NTRhYzQ2MGE0YjM5MWQzZDc2OGMwYmU5ODgwNzZlMWI2In0.eyJhdWQiOiIyMWUxZDcxMS1jMmZhLTQ0MjQtYTRjNy01MjM0YmEyNDdiZTIiLCJqdGkiOiIzYzUyYWI1Y2MwZDM4YTZiNmE5NTg3OWFmNDM1M2E5ZjAyNzA0MjBlMjBlOTI5ODU0YWM0NjBhNGIzOTFkM2Q3NjhjMGJlOTg4MDc2ZTFiNiIsImlhdCI6MTc3MjcwNzM2OSwibmJmIjoxNzcyNzA3MzY5LCJleHAiOjE5MzA0MzUyMDAsInN1YiI6IjEyOTEwNTc4IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyNjMwMTk0LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJwdXNoX25vdGlmaWNhdGlvbnMiLCJmaWxlcyIsImNybSIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMzZiZTVhNjgtN2QwZS00MmFhLWE5YWUtMmFkMjY0ZThmZjBiIiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.GI1jRpgW6wwbhpXjwEAzLigm2Yt4_t97aCqPgOReYRYizbx3YisgPefTiEp5faxCuF_Ol-oAY8BSWJMUh4P40ooEiqBfp464SpEpeobOzcTV-B5DxjOGjMyuGVIsmcJaX6AwaqNtp0YZ7k1l3-eOGSkS5LU2ocsLEvinPw8rELAAQk4o1lxt98KN4xSwYCgM81bb8a1kkGvy6fG8w9IV1bdjpHQv6K2IrexlstSw9wQljnv4uAl9NAmRmPTztNBLeCBKdSw3ujtYI7Qia0tfhZgHRKEqsRb9RqqacY3NAA_w8B02_mhy6IAOD-PA0C2coR0H7cT17vEeXf6aO5CZlA';

  // Воронка и этап для новых заявок
  const AMOCRM_PIPELINE_ID = 10013954; // "Воронка"
  const AMOCRM_STATUS_ID = 79455042;   // "Неразобранное"

  // ID пользовательского поля "Тип учреждения"
  const INSTITUTION_TYPE_FIELD_ID = 1262727;

  // Маппинг типов учреждений на ID в amoCRM
  const INSTITUTION_TYPES = {
    'Частная школа': 1440713,
    'Образовательный центр': 1440715,
    'Детский сад': 1440717,
    'Другое': 1440719
  };

  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Метод не разрешен' });
    return;
  }

  try {
    const data = req.body;

    if (!data.name || !data.phone) {
      res.status(400).json({ success: false, message: 'Заполните все обязательные поля' });
      return;
    }

    const name = String(data.name || '').trim();
    const phone = String(data.phone || '').trim();
    const type = String(data.type || 'Не указано').trim();

    const utm_source = String(data.utm_source || 'Прямой заход').trim();
    const utm_medium = String(data.utm_medium || '-').trim();
    const utm_campaign = String(data.utm_campaign || '-').trim();
    const utm_term = String(data.utm_term || '-').trim();
    const utm_content = String(data.utm_content || '-').trim();

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

    // Отправка в Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error('Telegram API error:', telegramData);
      res.status(500).json({ success: false, message: 'Ошибка отправки заявки в Telegram' });
      return;
    }

    // Отправка в amoCRM
    try {
      const contactData = {
        name: name,
        custom_fields_values: [
          { field_code: 'PHONE', values: [{ value: phone, enum_code: 'WORK' }] }
        ]
      };

      const leadCustomFields = [
        { field_code: 'UTM_SOURCE', values: [{ value: utm_source }] },
        { field_code: 'UTM_MEDIUM', values: [{ value: utm_medium }] },
        { field_code: 'UTM_CAMPAIGN', values: [{ value: utm_campaign }] },
        { field_code: 'UTM_TERM', values: [{ value: utm_term }] },
        { field_code: 'UTM_CONTENT', values: [{ value: utm_content }] },
        { field_code: 'REFERRER', values: [{ value: referrer }] }
      ];

      const institutionTypeId = INSTITUTION_TYPES[type];
      if (institutionTypeId) {
        leadCustomFields.push({
          field_id: INSTITUTION_TYPE_FIELD_ID,
          values: [{ enum_id: institutionTypeId }]
        });
      }

      const amoData = [
        {
          name: `Заявка: ${type}`,
          pipeline_id: AMOCRM_PIPELINE_ID,
          status_id: AMOCRM_STATUS_ID,
          custom_fields_values: leadCustomFields,
          _embedded: {
            contacts: [contactData]
          }
        }
      ];

      const amoResponse = await fetch(`https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/complex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AMOCRM_ACCESS_TOKEN}`
        },
        body: JSON.stringify(amoData)
      });

      const amoResult = await amoResponse.json();

      if (amoResponse.ok && amoResult[0]?.id) {
        const leadId = amoResult[0].id;
        const utmNote = `UTM Source: ${utm_source}\nUTM Medium: ${utm_medium}\nUTM Campaign: ${utm_campaign}\nUTM Term: ${utm_term}\nUTM Content: ${utm_content}\nСтраница: ${page_url}\nИсточник перехода: ${referrer}`;

        await fetch(`https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/${leadId}/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AMOCRM_ACCESS_TOKEN}`
          },
          body: JSON.stringify([{ note_type: 'common', params: { text: utmNote } }])
        });

        res.status(200).json({ success: true, message: 'Заявка успешно отправлена в Telegram и amoCRM!' });
      } else {
        console.error('amoCRM API error:', amoResult);
        // Алерт об ошибке amoCRM
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: `⚠️ <b>amoCRM НЕ РАБОТАЕТ!</b>\n\nЗаявка от ${name} (${phone}) отправлена в Telegram, но НЕ попала в amoCRM.\n\n<code>${JSON.stringify(amoResult).substring(0, 500)}</code>`,
            parse_mode: 'HTML'
          })
        });
        res.status(200).json({ success: true, message: 'Заявка отправлена в Telegram, но возникла ошибка при отправке в amoCRM' });
      }
    } catch (amoError) {
      console.error('amoCRM error:', amoError);
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `⚠️ <b>amoCRM НЕ РАБОТАЕТ!</b>\n\nОшибка: <code>${amoError.message}</code>`,
          parse_mode: 'HTML'
        })
      });
      res.status(200).json({ success: true, message: 'Заявка отправлена в Telegram, но возникла ошибка при отправке в amoCRM' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
}
