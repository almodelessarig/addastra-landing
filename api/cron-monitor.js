// Cron-мониторинг: проверяет работу сайта и amoCRM каждые 12 часов
const TELEGRAM_BOT_TOKEN = '8371321529:AAGk8okwfw5CMvg9brXd27g-bSWsAmwh-J4';
const TELEGRAM_CHAT_ID = '-1003758744538';
const SITE_URL = 'https://addastra-laws.kz';
const AMOCRM_SUBDOMAIN = 'addastra';
const AMOCRM_ACCESS_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjNjNTJhYjVjYzBkMzhhNmI2YTk1ODc5YWY0MzUzYTlmMDI3MDQyMGUyMGU5Mjk4NTRhYzQ2MGE0YjM5MWQzZDc2OGMwYmU5ODgwNzZlMWI2In0.eyJhdWQiOiIyMWUxZDcxMS1jMmZhLTQ0MjQtYTRjNy01MjM0YmEyNDdiZTIiLCJqdGkiOiIzYzUyYWI1Y2MwZDM4YTZiNmE5NTg3OWFmNDM1M2E5ZjAyNzA0MjBlMjBlOTI5ODU0YWM0NjBhNGIzOTFkM2Q3NjhjMGJlOTg4MDc2ZTFiNiIsImlhdCI6MTc3MjcwNzM2OSwibmJmIjoxNzcyNzA3MzY5LCJleHAiOjE5MzA0MzUyMDAsInN1YiI6IjEyOTEwNTc4IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMyNjMwMTk0LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJwdXNoX25vdGlmaWNhdGlvbnMiLCJmaWxlcyIsImNybSIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMzZiZTVhNjgtN2QwZS00MmFhLWE5YWUtMmFkMjY0ZThmZjBiIiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.GI1jRpgW6wwbhpXjwEAzLigm2Yt4_t97aCqPgOReYRYizbx3YisgPefTiEp5faxCuF_Ol-oAY8BSWJMUh4P40ooEiqBfp464SpEpeobOzcTV-B5DxjOGjMyuGVIsmcJaX6AwaqNtp0YZ7k1l3-eOGSkS5LU2ocsLEvinPw8rELAAQk4o1lxt98KN4xSwYCgM81bb8a1kkGvy6fG8w9IV1bdjpHQv6K2IrexlstSw9wQljnv4uAl9NAmRmPTztNBLeCBKdSw3ujtYI7Qia0tfhZgHRKEqsRb9RqqacY3NAA_w8B02_mhy6IAOD-PA0C2coR0H7cT17vEeXf6aO5CZlA';

async function sendAlert(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' })
  });
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const errors = [];

  // 1. Проверка доступности сайта
  try {
    const siteResponse = await fetch(SITE_URL, { redirect: 'follow' });
    if (!siteResponse.ok) {
      errors.push(`Сайт ${SITE_URL} вернул статус ${siteResponse.status}`);
    }
  } catch (e) {
    errors.push(`Сайт ${SITE_URL} не загружается: ${e.message}`);
  }

  // 2. Проверка страницы "Спасибо" (форма заявки)
  try {
    const thankResponse = await fetch(`${SITE_URL}/thank`);
    if (!thankResponse.ok) {
      errors.push(`Страница /thank вернула статус ${thankResponse.status}`);
    }
  } catch (e) {
    errors.push(`Страница /thank не загружается: ${e.message}`);
  }

  // 3. Проверка API отправки заявок
  try {
    const apiResponse = await fetch(`${SITE_URL}/api/send-telegram`, { method: 'OPTIONS' });
    if (!apiResponse.ok) {
      errors.push(`API /api/send-telegram вернул статус ${apiResponse.status}`);
    }
  } catch (e) {
    errors.push(`API /api/send-telegram не отвечает: ${e.message}`);
  }

  // 4. Проверка amoCRM токена
  try {
    const amoResponse = await fetch(`https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/account`, {
      headers: { 'Authorization': `Bearer ${AMOCRM_ACCESS_TOKEN}` }
    });
    if (!amoResponse.ok) {
      errors.push(`amoCRM API вернул статус ${amoResponse.status} — токен мог истечь!`);
    }
  } catch (e) {
    errors.push(`amoCRM API не отвечает: ${e.message}`);
  }

  if (errors.length > 0) {
    const alertText = `🚨 <b>МОНИТОРИНГ ADDASTRA — ПРОБЛЕМЫ!</b>\n\n${errors.map(e => `❌ ${e}`).join('\n')}`;
    await sendAlert(alertText);
    res.status(200).json({ success: false, errors });
  } else {
    res.status(200).json({ success: true, message: 'All checks passed' });
  }
}
