const DICTIONARY = {
    "smartfony-apple": "Смартфоны Apple",
    "roboty-pylesosy": "Роботы пылесосы",
    "velosipedy": "Велосипеды",
    "videokarty": "Видеокарты",
    "minimumPercentage": "Минимальный процент скидки",
    "personalPercentage": "Персональный процент скидки",
    "minPrice": "Минимальная цена",
    "maxPrice": "Максимальная цена",
    "maxPriceWithDiscount": "Максимальная цена со скидкой",
    "timeout": "Время обновления (мин)",
};

export const translate = (word) => DICTIONARY[word] || "";
