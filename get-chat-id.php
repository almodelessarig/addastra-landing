<?php
// Скрипт для получения Chat ID группы Telegram

$botToken = '8371321529:AAGk8okwfw5CMvg9brXd27g-bSWsAmwh-J4';

// Получаем обновления от бота
$url = "https://api.telegram.org/bot{$botToken}/getUpdates";

$response = file_get_contents($url);
$data = json_decode($response, true);

?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Получение Chat ID</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #E31E24;
            margin-bottom: 20px;
        }
        .instruction {
            background: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
        .chat-info {
            background: #d4edda;
            padding: 15px;
            border-left: 4px solid #28a745;
            margin: 20px 0;
            border-radius: 5px;
        }
        .chat-id {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
            font-family: monospace;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            display: inline-block;
            margin: 10px 0;
        }
        pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            max-height: 400px;
        }
        .error {
            background: #f8d7da;
            padding: 15px;
            border-left: 4px solid #dc3545;
            margin: 20px 0;
            border-radius: 5px;
        }
        .success {
            background: #d4edda;
            padding: 15px;
            border-left: 4px solid #28a745;
            margin: 20px 0;
            border-radius: 5px;
        }
        button {
            background: #E31E24;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #B91218;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Получение Chat ID группы Telegram</h1>

        <div class="instruction">
            <strong>Инструкция:</strong>
            <ol>
                <li>Убедитесь, что ваш бот добавлен в группу</li>
                <li>Отправьте любое сообщение в группу (например: "Тест")</li>
                <li>Обновите эту страницу</li>
            </ol>
        </div>

        <?php if ($data && isset($data['ok']) && $data['ok'] && !empty($data['result'])): ?>
            <div class="success">
                <strong>✅ Сообщения найдены!</strong>
            </div>

            <?php
            $chatIds = [];
            foreach ($data['result'] as $update) {
                if (isset($update['message']['chat'])) {
                    $chat = $update['message']['chat'];
                    $chatId = $chat['id'];
                    $chatTitle = $chat['title'] ?? $chat['first_name'] ?? 'Неизвестно';
                    $chatType = $chat['type'];

                    if (!in_array($chatId, $chatIds)) {
                        $chatIds[] = $chatId;
                        ?>
                        <div class="chat-info">
                            <h3>Найден чат: <?php echo htmlspecialchars($chatTitle); ?></h3>
                            <p><strong>Тип:</strong> <?php echo htmlspecialchars($chatType); ?></p>
                            <p><strong>Chat ID:</strong></p>
                            <div class="chat-id" onclick="copyToClipboard('<?php echo $chatId; ?>')">
                                <?php echo $chatId; ?>
                            </div>
                            <p style="font-size: 12px; color: #666;">Нажмите на Chat ID, чтобы скопировать</p>

                            <?php if ($chatType === 'group' || $chatType === 'supergroup'): ?>
                                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px;">
                                    <strong>👉 Используйте этот Chat ID в файле send-telegram.php:</strong>
                                    <pre>define('TELEGRAM_CHAT_ID', '<?php echo $chatId; ?>');</pre>
                                </div>
                            <?php endif; ?>
                        </div>
                        <?php
                    }
                }
            }
            ?>

            <h3>Полный ответ от API:</h3>
            <pre><?php echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE); ?></pre>

        <?php else: ?>
            <div class="error">
                <strong>❌ Сообщения не найдены</strong>
                <p>Возможные причины:</p>
                <ul>
                    <li>Бот не добавлен в группу</li>
                    <li>В группу еще не отправлялись сообщения после добавления бота</li>
                    <li>Бот не является администратором группы</li>
                </ul>
                <p><strong>Что делать:</strong></p>
                <ol>
                    <li>Убедитесь, что бот добавлен в группу как администратор</li>
                    <li>Отправьте сообщение в группу</li>
                    <li><button onclick="location.reload()">Обновить страницу</button></li>
                </ol>
            </div>

            <h3>Ответ от API:</h3>
            <pre><?php echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE); ?></pre>
        <?php endif; ?>

        <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <h3>Следующий шаг:</h3>
            <p>После получения Chat ID, откройте файл <code>send-telegram.php</code> и замените:</p>
            <pre>define('TELEGRAM_CHAT_ID', 'YOUR_CHAT_ID_HERE');</pre>
            <p>на полученный Chat ID.</p>
        </div>
    </div>

    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(function() {
                alert('Chat ID скопирован: ' + text);
            }, function(err) {
                console.error('Ошибка копирования: ', err);
            });
        }
    </script>
</body>
</html>
