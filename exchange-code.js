// Скрипт для обмена авторизационного кода amoCRM на токены и сохранения в Redis
// Использование: node exchange-code.js <AUTH_CODE>

import { createClient } from 'redis';

const AUTH_CODE = process.argv[2];

if (!AUTH_CODE) {
  console.error('Использование: node exchange-code.js <AUTH_CODE>');
  console.error('Получите код авторизации в amoCRM → Настройки → Интеграции');
  process.exit(1);
}

const AMOCRM_SUBDOMAIN = 'addastra';
const INTEGRATION_ID = '21e1d711-c2fa-4424-a4c7-5234ba247be2';
const SECRET_KEY = 'x3J3eYyILwsk48Le7lerS5T8pu4AwYSuqcqXc1K9D2TIwZ8RGrKSI5DdMaVCDx3R';
const REDIRECT_URI = 'https://addastra-law.kz';
const REDIS_URL = 'redis://default:SvQHMlmAVtwM42Xln9GGir7XNTa1u17B@redis-11518.c10.us-east-1-4.ec2.cloud.redislabs.com:11518';

try {
  // Обмен кода на токены
  console.log('Обмениваем код на токены...');
  const response = await fetch(`https://${AMOCRM_SUBDOMAIN}.amocrm.ru/oauth2/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: INTEGRATION_ID,
      client_secret: SECRET_KEY,
      grant_type: 'authorization_code',
      code: AUTH_CODE,
      redirect_uri: REDIRECT_URI
    })
  });

  const data = await response.json();

  if (!data.access_token) {
    console.error('Ошибка получения токенов:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('Токены получены!');
  console.log('access_token:', data.access_token.substring(0, 50) + '...');
  console.log('refresh_token:', data.refresh_token.substring(0, 50) + '...');

  // Сохранение в Redis
  console.log('\nСохраняем в Redis...');
  const redis = createClient({ url: REDIS_URL });
  await redis.connect();

  await redis.set('amocrm_access_token', data.access_token);
  await redis.set('amocrm_refresh_token', data.refresh_token);
  await redis.set('amocrm_token_updated_at', new Date().toISOString());

  console.log('Токены сохранены в Redis!');
  console.log('Дата:', new Date().toISOString());

  await redis.quit();
} catch (error) {
  console.error('Ошибка:', error.message);
  process.exit(1);
}
