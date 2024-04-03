export const parsePage = async (page) => {
    const url = `https://warthog.acc-pool.pw/miners/a783a4270545f24768cfe423e3278189f3d8e8f0d23a1a27/`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    return page.evaluate(() =>
        Array.from(document.getElementsByTagName('tr'))
            .map(item => {
                const name = item.querySelector('.workerName')?.textContent;
                const time = item.querySelector('.text-center')?.textContent;
                const minutes = time && time.includes("minute") ? Number(time.replace(/\D/g, '')) : 0;
                const isInteger = (str) => {
                    const num = Number(str);
                    return String(num) === str && Number.isInteger(num);
                };

                const id = name
                    ? isInteger(name)
                        ? name
                        : name.match(/[Ss]_(\d+)/)[1]
                    : "";

                return {
                    name,
                    minutes,
                    id,
                };
            })
            .filter(item => !!item.name));
}
