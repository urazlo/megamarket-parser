import puppeteer from "puppeteer";
import { notify } from "./helpers/bot.mjs";
import { parsePage } from "./helpers/parser.mjs";
import { getCommand, minutesToMilliseconds, setNumeralEnding } from "./helpers/core.mjs";

import { config } from "dotenv";
import { getOrders } from "./helpers/orders.mjs";

config();

const MINUTES_TO_NOTIFY = Number(process.env.MINUTES_TO_NOTIFY);
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36";

const invokeParsing = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--disable-notifications',
            '--start-maximized',
            '--window-size=1920,1080',
        ],
    });
    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setViewport({
        width: 1920,
        height: 200,
    });

    try {
        const watchableServers = await parsePage(page);
        const { orders } = await getOrders();

        const orderLookup = orders.reduce((lookup, order) => {
            lookup[order.si] = true;
            return lookup;
        }, {});

        Object.keys(orderLookup).forEach(orderId => {
            const foundServer = watchableServers.find(server => server.id === orderId);

            if (!foundServer) {
                notify(`Риг ${orderId} не запущен\n${getCommand(orderId)}`);
                return;
            }

            const { name, minutes } = foundServer;

            if (minutes >= MINUTES_TO_NOTIFY) {
                notify(`Риг ${name} отвалился ${minutes} ${setNumeralEnding(minutes, ["минуту", "минуты", "минут"])} назад\n${getCommand(name)}`);
            }
        });
    } catch (error) {
        console.error(error);
    }

    await browser.close();

    setTimeout(async () => {
        await invokeParsing().catch(console.error);
    }, minutesToMilliseconds(10));
}

await invokeParsing().catch(console.error);
