import { config } from "dotenv";
config();

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export const generateInlineKeyboard = (subscriptions) => ({
    inline_keyboard: Object.values(subscriptions).map(item => [
        {
            text: (item.isWatchable ? '✅ ' : '◻️ ') + item.text,
            callback_data: "toggle_" + item.id
        }
    ])
});

export const notify = async (chatId, msg) => fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(msg)}`);
