const getFiltersString = () => {
    const filtersObject = {
        // "90E25EADE2C71A465CAB6579E5CEFE3A": [ "1" ],
        "4CB2C27EAAFC4EB39378C4B7487E6C9E": [ "1" ]
    };
    const jsonString = JSON.stringify(filtersObject);

    return `#?filters=${encodeURIComponent(jsonString)}`;
};

export const parsePage = async ({ page, pageNumber, category = "", personalPercentage = 0 }) => {
    const url = `https://megamarket.ru/catalog/${category}/page-${pageNumber}/${getFiltersString()}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 100000 });

    return page.evaluate(personalPercentage => {
        return Array.from(document.querySelectorAll('.item-block')).map(item => {
            const bonusElement = item.querySelector('.item-bonus');
            if (!bonusElement) return null;

            const title = item.querySelector('.ddl_product_link')?.textContent?.trim() || 'No title';
            const priceText = item.querySelector('.item-price span')?.textContent?.replace(/\s/g, '') || '0';
            const discountText = bonusElement.querySelector('.bonus-percent')?.textContent?.replace(/\D/g, '') || '0';

            const price = parseInt(priceText, 10);
            const discount = parseInt(discountText, 10) + personalPercentage;
            const bonus = Math.trunc(price / 100 * discount);
            const discountedPrice = price - bonus;

            return {
                title,
                price,
                discountedPrice,
                bonus,
                discount,
                url: "https://megamarket.ru" + item.querySelector('.ddl_product_link')?.getAttribute('href')?.trim(),
            };
        }).filter(Boolean);
    }, personalPercentage);
}
