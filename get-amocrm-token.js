// Скрипт для получения access_token и refresh_token от amoCRM
// Запустите этот скрипт один раз: node get-amocrm-token.js

const INTEGRATION_ID = '21e1d711-c2fa-4424-a4c7-5234ba247be2';
const SECRET_KEY = 'x3J3eYyILwsk48Le7lerS5T8pu4AwYSuqcqXc1K9D2TIwZ8RGrKSI5DdMaVCDx3R';
const AUTH_CODE = 'def5020090a6b15c6e9f5157baa78e06bb2296412215fd1cfc97d345c94a7e2e4749a73d627d11f5d941d38899aa5af0f0c6696d8d52c3b1716f05656bd1d82d16ccea417d9364c125fe8b3ab90f1f8a916657f89f576668b08240392ec11e605616862fe910e5314b869c7901b0a06198788933bd4bf11c914fc0eeed8d8b5bc480f9b19864532a6163e3fc52be88019601d5a8249ae8351a10f7d1651f7cf8579a18df3cdf97b29767e2feed68eb1df0a7ebcc123c9c1de2a6be8b868b8184fff57f8d79f757045ce500c8d13d4dcbe503fb6a93434939d9e9ea730c2ff4acdebac3dd50d5637b15386033e05904d66b1e3eeb897da5d921d8088159a0f738f49a9b237409eded97cc841c8a283dafaf0416109187bcc700b73ea892ee54b832ac1bf427c62dd419d450eb70c5170c01636f89da70d7925a3fbcadac82457edd6e3f8c84bb55f36500f55b163494d1c6ece90b12f5f2f273fba19bf4c6fb147d54e958f4f76ce545d622dcceea9b99b8a872829ef6fc4143c1a8a78b716d17110ff3111132409791a36f8a3f14fa7940f5854f7d43fcd6d99eccc5d67c7f2578c901b49e28d76a84e0a276f71690fe9b931987411ee01ac21802e9f512c84a230b5e14c971d54ad394f21a76308c52867d671c4ca134e9949d94ac35d4538cf8de9a9d74ac8a5a';
const REDIRECT_URI = 'https://addastra-laws.kz';

const SUBDOMAIN = 'addastra';

async function getTokens() {
  try {
    const response = await fetch(`https://${SUBDOMAIN}.amocrm.ru/oauth2/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: INTEGRATION_ID,
        client_secret: SECRET_KEY,
        grant_type: 'authorization_code',
        code: AUTH_CODE,
        redirect_uri: REDIRECT_URI
      })
    });

    const data = await response.json();

    if (data.access_token) {
      console.log('\n✅ Успешно получены токены!\n');
      console.log('ACCESS_TOKEN:', data.access_token);
      console.log('\nREFRESH_TOKEN:', data.refresh_token);
      console.log('\nВремя жизни токена (секунды):', data.expires_in);
      console.log('\n⚠️ СОХРАНИТЕ ЭТИ ТОКЕНЫ! Они понадобятся для настройки интеграции.');
    } else {
      console.error('❌ Ошибка получения токенов:', data);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

getTokens();
