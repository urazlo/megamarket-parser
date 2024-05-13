import puppeteer from "puppeteer";
import { notify } from "./helpers/bot.mjs";
import { translate } from "./constants/dictionary.mjs";
import { isPriceALowerByNPercent, minutesToMilliseconds } from "./helpers/core.mjs";
import { getFiltersString } from "./helpers/parser.mjs";

export default class Account {
    isLastPageReached = false;
    browser = null;
    parsedIds = [];

    constructor(chatId) {
        this.chatId = chatId;
        this.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36";
        this.config = {
            minPrice: 1,
            maxPrice: 9999999,
            maxPriceWithDiscount: 9999999,
            minimumPercentage: 40,
            personalPercentage: 0,
            timeout: 60,
        };
        this.state = {
            "smartfony-apple": { isWatchable: false, text: 'Смартфоны Apple', id: "smartfony-apple" },
            "roboty-pylesosy": { isWatchable: false, text: 'Роботы пылесосы', id: "roboty-pylesosy" },
            "velosipedy": { isWatchable: false, text: 'Велосипеды', id: "velosipedy" },
            "videokarty": { isWatchable: false, text: 'Видеокарты', id: "videokarty" },
            "planshety-apple": { isWatchable: false, text: 'Планшеты Apple', id: "planshety-apple" },
            "otparivateli": { isWatchable: false, text: 'Отпариватели', id: "otparivateli" },
        };
    }

    async invokeParsing(category) {
        if (!this.isCategoryWatchable(category)) {
            console.log(`Category ${category} is not watchable.`);
            return;
        }

        this.browser = await this.startBrowser();
        const catalogPage = await this.preparePage();
        await this.parseCatalog(category, catalogPage);
        await this.browser.close();
        this.rescheduleParsing(category);
    }

    async startBrowser() {
        return await puppeteer.launch({
            headless: true,
            args: [ '--disable-notifications' ]
        });
    }

    async preparePage() {
        const page = await this.browser.newPage();
        await page.setUserAgent(this.userAgent);
        await page.setRequestInterception(true);
        page.on('request', interceptedRequest => interceptedRequest.continue());
        return page;
    }

    async parseCatalog(category, page) {
        const catalogResponseHandler = async response => {
            const isCatalogRequest = response.url().includes("catalogService/catalog/search");
            if (isCatalogRequest) {
                await this.handleCatalogResponse(response);
            }
        };

        page.on('response', catalogResponseHandler);

        for (let pageNumber = 1; pageNumber <= 9999 && this.state[category].isWatchable && !this.isLastPageReached; pageNumber++) {
            try {
                const categoryUrl = this.getCategoryUrl(category, pageNumber);
                console.log(`PARSING PAGE CATEGORY ${category} NUMBER ${pageNumber}`);
                await page.goto(categoryUrl, { waitUntil: 'load', timeout: 100000 });
            } catch (error) {
                console.error(`Error processing category ${category} on page ${pageNumber}: ${error}`);
                break;
            }
        }

        page.off('response', catalogResponseHandler);
        notify(this.chatId, `Поиск по категории ${translate(category)} завершен! Повторный поиск начнется через ${this.config.timeout} минут.`);
    }

    async handleCatalogResponse(response) {
        try {
            const data = await response.json();
            const foundProducts = data.items || [];

            if (!foundProducts.length) {
                console.log("No products found");
                this.isLastPageReached = true;
                this.parsedIds = [];
                return;
            }

            for (let i = 0; i < foundProducts.length; i++) {
                const product = foundProducts[i];

                if (this.parsedIds.includes(product.goods.title)) {
                    return;
                }

                this.parsedIds.push(product.goods.goodsId);

                if (this.isAnomalyProduct(product)) {
                    console.log('ANOMALY PRODUCT FOUND', product.goods.webUrl);
                    const productPage = await this.preparePage();

                    productPage.once('response', async response => {
                        const isPdpResponse = response.url().includes(product.goods.webUrl);
                        if (isPdpResponse) {
                            await this.handlePdpResponse(response, product);
                        }
                    });

                    await productPage.goto(`${product.goods.webUrl}#?details_block=prices`, {
                        waitUntil: 'load',
                        timeout: 100000
                    });

                    await productPage.close();
                }
            }
        } catch (err) {
            console.log('Error in handleCatalogResponse', err);
        }
    }

    async handlePdpResponse(response, product) {
        try {
            const text = await response.text();
            const pattern = /"offersData":.*mainInfo"/;
            const match = text.match(pattern);

            if (match && match[0]) {
                const jsonString = '{' + match[0].replace(/,"mainInfo"/, "}");

                const jsonObject = JSON.parse(jsonString);
                let totalPrice = 0;

                const offers = jsonObject.offersData.offers.map(offer => {
                    const bestPrice = +offer.finalPrice - (offer.spasiboIsAvailable ? +offer.bonusInfoGroups[0].totalAmount : 0);
                    totalPrice += bestPrice;

                    return ({
                        ...offer,
                        bestPrice,
                    });
                });

                const bestOffer = offers.sort((a, b) => a.bestPrice - b.bestPrice)[0];
                const averagePrice = totalPrice / offers.length;

                console.log('----------')
                console.log('bestPrice', bestOffer.bestPrice)
                console.log('averagePrice', averagePrice)
                console.log('----------')

                if (!isPriceALowerByNPercent(bestOffer.bestPrice, averagePrice)) return;

                console.log('FOUND BEST OFFER')
                const percentToShow = bestOffer.spasiboIsAvailable ? product.bonusPercent : Math.abs(product.favoriteOffer.oldPriceChangePercentage);
                notify(this.chatId, `Найден ${product.goods.title} со скидкой ${percentToShow}% по примерной цене ${Math.floor(bestOffer.bestPrice)} ${product.goods.webUrl}\nСредняя цена - ${Math.floor(averagePrice)} руб.`);
            } else {
                console.log('No matching script content found.');
            }
        } catch (err) {
            console.log('Error in handlePdpResponse', err);
        }
    }

    getCategoryUrl(category, pageNumber) {
        return `https://megamarket.ru/catalog/${category}/page-${pageNumber}/${getFiltersString(category)}`;
    }

    isCategoryWatchable(category) {
        return this.state[category] && this.state[category].isWatchable;
    }

    rescheduleParsing(category) {
        if (this.state[category].isWatchable) {
            setTimeout(() => {
                this.invokeParsing(category).catch(console.error);
            }, minutesToMilliseconds(this.config.timeout));
        }
    }

    setConfigField(field, value) {
        this.config[field] = value;
    }

    getConfigFieldValue(field) {
        return this.config[field];
    }

    configToString() {
        return Object.entries(this.config).map(([ key, value ]) => `${translate(key)}: ${value}`).join('\n');
    }

    isAnomalyProduct(product) {
        const finalBonusPercent = product.bonusPercent + this.config.personalPercentage;
        const finalPrice = product.price - (product.price / 100 * finalBonusPercent);
        const isInPriceRange = finalPrice <= this.config.maxPrice &&
            finalPrice >= this.config.minPrice &&
            finalPrice <= this.config.maxPriceWithDiscount;
        const hasAnomalyDiscount = finalBonusPercent >= this.config.minimumPercentage || Math.abs(product.favoriteOffer.oldPriceChangePercentage) >= 40;

        return product.isAvailable && isInPriceRange && hasAnomalyDiscount;
    }
}
