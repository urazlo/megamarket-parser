import Account from "./account.mjs";
import { configMarkup, menuMarkup } from "./constants/markup.mjs";
import { generateInlineKeyboard, TELEGRAM_BOT_TOKEN } from "./helpers/bot.mjs";
import TelegramBot from "node-telegram-bot-api";
import { translate } from "./constants/dictionary.mjs";
import { minutesToMilliseconds } from "./helpers/core.mjs";

const accounts = [];
const selectedConfigurableField = [];
const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

telegramBot.on('message', ({ chat, text }) => {
    const chatId = chat.id;
    const answer = {
        text: "",
        replyMarkup: null,
    };

    if (!accounts[chatId]) {
        accounts[chatId] = new Account(chatId);
        selectedConfigurableField[chatId] = null;

        return telegramBot.sendMessage(chatId, 'Для начала введите /start', {
            reply_markup: menuMarkup
        });
    }

    if (selectedConfigurableField[chatId]) {
        if (!isNaN(+text)) {
            const valueToSet = text === "timeout" ? minutesToMilliseconds(+text) : +text;
            accounts[chatId].setConfigField(selectedConfigurableField[chatId], valueToSet);

            telegramBot.sendMessage(chatId, `Установлено новое значение для ${translate(selectedConfigurableField[chatId])}: ${text}`);
            selectedConfigurableField[chatId] = null;
            return;
        }

        telegramBot.sendMessage(chatId, `Введите корректное числовое значение для поля ${translate(selectedConfigurableField[chatId])}`);
        return;
    }

    switch (text) {
        case "Настройки": {
            answer.text = `${accounts[chatId].configToString()} \n\nВыберите поле для настройки:`;
            answer.replyMarkup = configMarkup;
            break;
        }
        case "Подписки": {
            answer.text = "Добавьте категории для отслеживания цен...";
            answer.replyMarkup = generateInlineKeyboard(accounts[chatId].state);
            break;
        }
        case "Остановить отслеживание всех цен": {
            answer.text = "Цены больше не отслеживаются, для добавление новых подписок перейдите в соответствующий пункт меню.";
            Object.values(accounts[chatId].state).forEach(category => category.isWatchable = false);
            answer.replyMarkup = menuMarkup;
            break;
        }
        case "/start":
        default: {
            answer.text = "Выберите команду";
            answer.replyMarkup = null;
        }
    }

    telegramBot.sendMessage(chatId, answer.text, {
        reply_markup: answer.replyMarkup
    });
});

telegramBot.on('callback_query', async ({ message, data }) => {
    const chatId = message.chat.id;
    const account = accounts[chatId];
    const messageId = message.message_id;

    try {
        if (data.startsWith("set_")) {
            const field = data.replace("set_", "");
            telegramBot.sendMessage(chatId, `Текущее значение: ${account.getConfigFieldValue(field)}. Введите новое значение для ${translate(field)}...`);
            selectedConfigurableField[chatId] = field;
            return;
        }

        if (data.startsWith("toggle_")) {
            const category = data.replace("toggle_", "");
            account.state[category].isWatchable = !account.state[category].isWatchable;

            try {
                telegramBot.editMessageText(`Категория ${translate(category)} теперь${account.state[category].isWatchable ? "" : " не"} отслеживается!`, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: generateInlineKeyboard(account.state)
                });
            } catch (err) {
                console.log(err);
            }

            if (account.state[category].isWatchable) {
                await account.invokeParsing(category).catch(error => {
                    console.error(`Error invoking parsing for category ${category}:`, error);
                    telegramBot.sendMessage(chatId, `Произошла ошибка при запуске отслеживания для категории ${translate(category)}.`);
                });
            }
        }
    } catch (error) {
        console.error(`Error processing callback query for chatId ${chatId}:`, error);
        telegramBot.sendMessage(chatId, "Произошла ошибка. Пожалуйста, попробуйте еще раз.");
    }
});

