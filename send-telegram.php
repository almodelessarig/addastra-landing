<?php
// Настройки Telegram бота
define('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE'); // Замените на токен вашего бота
define('TELEGRAM_CHAT_ID', 'YOUR_CHAT_ID_HERE');     // Замените на ID чата/группы

// Установка заголовков для CORS (если сайт на другом домене)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Проверка метода запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не разрешен']);
    exit;
}

// Получение данных из POST запроса
$data = json_decode(file_get_contents('php://input'), true);

// Валидация обязательных полей
if (empty($data['name']) || empty($data['phone'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Заполните все обязательные поля']);
    exit;
}

// Извлечение данных
$name = htmlspecialchars(trim($data['name']));
$phone = htmlspecialchars(trim($data['phone']));
$type = htmlspecialchars(trim($data['type'] ?? 'Не указано'));

// UTM метки
$utm_source = htmlspecialchars(trim($data['utm_source'] ?? 'Прямой заход'));
$utm_medium = htmlspecialchars(trim($data['utm_medium'] ?? '-'));
$utm_campaign = htmlspecialchars(trim($data['utm_campaign'] ?? '-'));
$utm_term = htmlspecialchars(trim($data['utm_term'] ?? '-'));
$utm_content = htmlspecialchars(trim($data['utm_content'] ?? '-'));

// Дополнительные данные
$page_url = htmlspecialchars(trim($data['page_url'] ?? '-'));
$referrer = htmlspecialchars(trim($data['referrer'] ?? '-'));
$timestamp = date('d.m.Y H:i:s');

// Формирование сообщения для Telegram
$message = "🔔 <b>Новая заявка с сайта ADDASTRA</b>\n\n";
$message .= "👤 <b>Имя:</b> {$name}\n";
$message .= "📱 <b>Телефон:</b> {$phone}\n";
$message .= "🏫 <b>Тип учреждения:</b> {$type}\n";
$message .= "🕐 <b>Время:</b> {$timestamp}\n\n";

$message .= "📊 <b>UTM-метки:</b>\n";
$message .= "├ Source: {$utm_source}\n";
$message .= "├ Medium: {$utm_medium}\n";
$message .= "├ Campaign: {$utm_campaign}\n";
$message .= "├ Term: {$utm_term}\n";
$message .= "└ Content: {$utm_content}\n\n";

$message .= "🌐 <b>Дополнительно:</b>\n";
$message .= "├ Страница: {$page_url}\n";
$message .= "└ Источник перехода: {$referrer}\n";

// Отправка сообщения в Telegram
$telegramApiUrl = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/sendMessage";

$postData = [
    'chat_id' => TELEGRAM_CHAT_ID,
    'text' => $message,
    'parse_mode' => 'HTML'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $telegramApiUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Проверка результата отправки
if ($httpCode === 200) {
    echo json_encode([
        'success' => true,
        'message' => 'Заявка успешно отправлена!'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка отправки заявки. Попробуйте позже.'
    ]);
}
?>
