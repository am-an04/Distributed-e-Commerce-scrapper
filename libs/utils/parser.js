
const parsePrice = (priceString) => {
    if (!priceString) return 0;

    // Extract numbers like 499, 1,299 etc.
    const match = priceString.match(/[\d,]+/);

    if (!match) return 0;

    return parseInt(match[0].replace(/,/g, ''));
};

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

module.exports = { parsePrice, isValidUrl };