
const parsePrice = (priceString) => {
    if (typeof priceString === 'number') return priceString;
    if (!priceString) return 0;

    // Extract numbers like 499, 1,299 etc.
    const cleanStr = String(priceString).replace(/,/g, '');
    const match = cleanStr.match(/\d+(\.\d+)?/);

    if (!match) return 0;

    return Math.round(parseFloat(match[0]));
};

const parseRating = (ratingVal) => {
    if (!ratingVal) return null;
    if (typeof ratingVal === 'number') return ratingVal;
    const match = String(ratingVal).match(/\d+(\.\d+)?/);
    if (!match) return null;
    const val = parseFloat(match[0]);
    return val <= 5 ? val : null;
};

const cleanImageUrl = (url, baseUrl) => {
    if (!url) return '';
    let clean = url.trim();
    if (clean.startsWith('//')) {
        clean = 'https:' + clean;
    } else if (clean.startsWith('/') && baseUrl) {
        try {
            const base = new URL(baseUrl);
            clean = `${base.protocol}//${base.host}${clean}`;
        } catch {
            // Keep relative if base url parsing fails
        }
    }
    return clean;
};

const calculateDiscount = (price, originalPrice) => {
    if (!price || !originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
};

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

module.exports = { parsePrice, parseRating, cleanImageUrl, calculateDiscount, isValidUrl };