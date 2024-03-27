import { translate } from "./dictionary.mjs";

export const menuMarkup = {
    keyboard: [
        [ { text: 'Подписки' } ],
        [ { text: 'Настройки' } ],
        [ { text: 'Остановить отслеживание всех цен' } ],
    ],
    resize_keyboard: true
};

export const configMarkup = {
    inline_keyboard: [
        [ { text: translate("minPrice"), callback_data: "set_minPrice" } ],
        [ { text: translate("maxPrice"), callback_data: "set_maxPrice" } ],
        [ { text: translate("maxPriceWithDiscount"), callback_data: "set_maxPriceWithDiscount" } ],
        [ { text: translate("minimumPercentage"), callback_data: "set_minimumPercentage" } ],
        [ { text: translate("personalPercentage"), callback_data: "set_personalPercentage" } ],
        [ { text: translate("timeout"), callback_data: "set_timeout" } ]
    ]
};
