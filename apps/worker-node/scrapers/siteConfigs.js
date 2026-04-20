
module.exports = {
    amazon: {
        container: '.s-result-item[data-component-type="s-search-result"]',
        title: 'h2',
        price: '.a-price-whole',
        rating: '.a-icon-alt'
    },

    flipkart: {
    container: 'div[data-id]',
    title: 'a.IRpw9B, div._4rR01T, a.s1Q9rs',
    price: 'div._30jeq3',
    rating: 'div._3LWZlK'
},

    myntra: {
        container: '.product-base',
        title: '.product-product',
        price: '[class*="price"],.product-price',
        rating: '.product-ratingsContainer'
    },

    nike: {
        container: 'div[data-testid="product-card"]',
        title: '.product-card__title',
        price: '.product-price__wrapper',
        rating: '.review-count'
    },

    puma: {
        container: '[data-test-id="product-list-item"]',
        title: '[data-test-id="product-list-item-title"]',
        price: '.price-value'
    },

    shopsy: {
        container: 'div[data-id]',
        title: 'a.w_Nig7',
        price: 'div.Nx9bqj'
    }
};