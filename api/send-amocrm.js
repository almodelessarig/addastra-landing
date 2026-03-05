// Vercel Serverless Function для отправки заявок в amoCRM
export default async function handler(req, res) {
  // Настройки amoCRM
  const AMOCRM_SUBDOMAIN = 'addastra';
  const AMOCRM_USER_LOGIN = 'УКАЖИТЕ_ВАШ_EMAIL'; // Email от аккаунта amoCRM
  const AMOCRM_USER_HASH = 'УКАЖИТЕ_API_КЛЮЧ'; // API ключ из настроек пользователя

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

    // Формирование данных для создания контакта
    const contactData = {
      name: data.name,
      custom_fields_values: [
        {
          field_code: 'PHONE',
          values: [
            {
              value: data.phone,
              enum_code: 'WORK'
            }
          ]
        }
      ]
    };

    // Добавляем UTM-метки в контакт
    const utmFields = [];
    if (data.utm_source) {
      utmFields.push({
        field_name: 'UTM Source',
        values: [{ value: data.utm_source }]
      });
    }
    if (data.utm_medium) {
      utmFields.push({
        field_name: 'UTM Medium',
        values: [{ value: data.utm_medium }]
      });
    }
    if (data.utm_campaign) {
      utmFields.push({
        field_name: 'UTM Campaign',
        values: [{ value: data.utm_campaign }]
      });
    }

    if (utmFields.length > 0) {
      contactData.custom_fields_values.push(...utmFields);
    }

    // Формирование данных для создания сделки
    const leadData = {
      name: `Заявка: ${data.type || 'Консультация'}`,
      custom_fields_values: [
        {
          field_name: 'Тип учреждения',
          values: [{ value: data.type || 'Не указано' }]
        },
        {
          field_name: 'Страница',
          values: [{ value: data.page_url || '-' }]
        },
        {
          field_name: 'Источник перехода',
          values: [{ value: data.referrer || 'Прямой заход' }]
        }
      ]
    };

    // Создание сложной сущности (контакт + сделка)
    const amoData = [
      {
        ...leadData,
        _embedded: {
          contacts: [contactData]
        }
      }
    ];

    // Отправка в amoCRM через API
    const amoUrl = `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/complex`;

    const amoResponse = await fetch(amoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AMOCRM_USER_HASH}` // В новой версии используется Bearer токен
      },
      body: JSON.stringify(amoData)
    });

    const amoResult = await amoResponse.json();

    if (amoResponse.ok) {
      res.status(200).json({
        success: true,
        message: 'Заявка успешно отправлена в amoCRM!',
        data: amoResult
      });
    } else {
      console.error('amoCRM API error:', amoResult);
      res.status(500).json({
        success: false,
        message: 'Ошибка отправки в amoCRM',
        error: amoResult
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
}
