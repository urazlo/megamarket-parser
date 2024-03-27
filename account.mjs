import puppeteer from "puppeteer";
import { notify } from "./helpers/bot.mjs";
import { parsePage } from "./helpers/parser.mjs";
import { translate } from "./constants/dictionary.mjs";
import { minutesToMilliseconds } from "./helpers/core.mjs";

export default class Account {
    constructor(chatId) {
        this.chatId = chatId;
    }

    chatId = null;
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36";

    config = {
        minPrice: 1,
        maxPrice: 9999999,
        maxPriceWithDiscount: 9999999,
        minimumPercentage: 50,
        personalPercentage: 5,
        timeout: 60,
    };

    state = {
        "smartfony-apple": { isWatchable: false, text: 'Смартфоны Apple', id: "smartfony-apple" },
        "roboty-pylesosy": { isWatchable: false, text: 'Роботы пылесосы', id: "roboty-pylesosy" },
        "velosipedy": { isWatchable: false, text: 'Велосипеды', id: "velosipedy" },
        "videokarty": { isWatchable: false, text: 'Видеокарты', id: "videokarty" }
    };

    async invokeParsing(category) {
        if (!this.state[category] || !this.state[category].isWatchable) {
            console.log(`Category ${category} is not watchable.`);
            return;
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: [ '--disable-notifications' ]
        });
        const page = await browser.newPage();
        await page.setUserAgent(this.userAgent);

        for (let i = 1; i <= 9999 && this.state[category].isWatchable; i++) {
            try {
                const items = await parsePage({
                    page,
                    pageNumber: i,
                    category,
                    personalPercentage: this.config.personalPercentage
                });

                if (items.length === 0) break;

                items.forEach(item => {
                    if (item.discount >= this.config.minimumPercentage &&
                        item.price <= this.config.maxPrice &&
                        item.price >= this.config.minPrice &&
                        item.discountedPrice <= this.config.maxPriceWithDiscount) {
                        notify(this.chatId, `Найден ${item.title} со скидкой ${item.discount}% по примерной цене ${item.discountedPrice} ${item.url}`);
                    }
                });

            } catch (error) {
                console.error(`Error processing category ${category} on page ${i}: ${error}`);
                break;
            }
        }

        notify(this.chatId, `Поиск по категории ${translate(category)} завершен! Повторный поиск начнется через ${this.config.timeout} минут.`);
        await browser.close();

        if (this.state[category].isWatchable) {
            setTimeout(() => {
                this.invokeParsing(category).catch(console.error);
            }, minutesToMilliseconds(this.config.timeout));
        }
    }

    setConfigField = (field, value) => {
        this.config[field] = value;
    }

    getConfigFieldValue = (field) => this.config[field];

    configToString = () => Object.entries(this.config).map(([ key, value ]) => `${translate(key)}: ${value}`).join('\n');
}
