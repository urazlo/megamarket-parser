export const minutesToMilliseconds = (minutes) => minutes * 60 * 1000;

export const isPriceALowerByNPercent = (priceA, priceB, percent = 30) => {
    const THRESHOLD_PERCENTAGE = 1 - percent / 100;
    const thresholdPrice = priceB * THRESHOLD_PERCENTAGE;

    return priceA <= thresholdPrice;
}
