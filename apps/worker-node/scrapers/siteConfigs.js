module.exports = {
    amazon: {
        name: 'Amazon',
        category: 'general',
        searchUrl: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
        container: ['.s-result-item[data-component-type="s-search-result"]', 'div[data-cy="title-recipe"]'],
        title: ['h2 a span', 'h2 a', '.a-text-normal'],
        price: ['.a-price-whole', '.a-price .a-offscreen', 'span.a-color-price'],
        originalPrice: ['.a-text-price .a-offscreen', 'span.a-text-price'],
        rating: ['.a-icon-alt', 'i.a-icon-star-small', 'span.a-icon-alt'],
        image: ['img.s-image', '.s-image-fixed-height img']
    },

    flipkart: {
        name: 'Flipkart',
        category: 'general',
        searchUrl: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
        container: ['div[data-id]', '._1AtVbE', '._75WgKe', 'div._2kHMtA', 'div._1xHG2l'],
        title: ['a.IRpw9B', 'div._4rR01T', 'a.s1Q9rs', 'a.WnuTty', 'div.Kz92Wv', 'a[title]'],
        price: ['div._30jeq3', 'div.Nx9bqj', 'div._25bWKC'],
        originalPrice: ['div._3I9_wc', 'div.yRaYxfa'],
        rating: ['div._3LWZlK', 'div.XP7Bvi'],
        image: ['img._396cs4', 'img._2r_T15', 'img.DCYAf4']
    },

    myntra: {
        name: 'Myntra',
        category: 'fashion',
        searchUrl: (q) => `https://www.myntra.com/${encodeURIComponent(q)}`,
        container: ['.product-base', 'li.product-base', 'div.results-base > section'],
        title: ['.product-product', '.product-brand', 'h3.product-brand', 'h4.product-product'],
        price: ['.product-discountedPrice', '[class*="price"]', '.product-price span'],
        originalPrice: ['.product-strike', '.product-originalPrice'],
        rating: ['.product-ratingsContainer span', '.product-ratingsCount'],
        image: ['picture img', 'img.img-responsive', 'img.product-thumb']
    },

    ajio: {
        name: 'Ajio',
        category: 'fashion',
        searchUrl: (q) => `https://www.ajio.com/search/?text=${encodeURIComponent(q)}`,
        container: ['.item', 'div.rilrtl-products-list__item', 'div.preview'],
        title: ['.nameCls', '.brand', 'div.nameCls'],
        price: ['.price', 'span.price', 'strong.price'],
        originalPrice: ['span.orginal-price', '.orginal-price'],
        rating: ['.rating-sec', '.rating'],
        image: ['img.rilrtl-lazy-img', 'img.img-alignment']
    },

    croma: {
        name: 'Croma',
        category: 'electronics',
        searchUrl: (q) => `https://www.croma.com/searchB?q=${encodeURIComponent(q)}%3Arelevance&text=${encodeURIComponent(q)}`,
        container: ['li.product-item', 'div.product-item', 'div.plp-card'],
        title: ['h3.product-title', 'a.product-title', '.plp-prod-title'],
        price: ['span.amount', 'span.plp-srp-new-price', 'span.new-price'],
        originalPrice: ['span.old-price', 'span.plp-srp-old-price'],
        rating: ['span.rating-text', 'div.rating'],
        image: ['img.product-img', 'div.product-img img', 'img.plp-card-img']
    },

    reliancedigital: {
        name: 'Reliance Digital',
        category: 'electronics',
        searchUrl: (q) => `https://www.reliancedigital.in/search?q=${encodeURIComponent(q)}`,
        container: ['div.sp__product', 'li.grid', 'div.pdp-link'],
        title: ['p.sp__name', 'div.sp__name', 'a.sp__name'],
        price: ['span.text-black', 'span.sp__price', 'span.g-price'],
        originalPrice: ['span.mrp', 'span.sp__mrp'],
        rating: ['span.rating', 'div.rating'],
        image: ['img.img-responsive', 'div.sp__image img']
    },

    tatacliq: {
        name: 'Tata CLiQ',
        category: 'general',
        searchUrl: (q) => `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(q)}`,
        container: ['div.ProductModule__base', 'div.ProductDescription__base', 'div.ProductCard__base'],
        title: ['div.ProductDescription__title', 'h2.ProductDescription__title', 'div.ProductDescription__brand'],
        price: ['div.ProductDescription__price', 'span.ProductDescription__price'],
        originalPrice: ['div.ProductDescription__discount', 'span.ProductDescription__mrp'],
        rating: ['div.ProductDescription__rating'],
        image: ['img.ProductModule__image', 'img.ProductModule__lazyImage']
    },

    nykaa: {
        name: 'Nykaa',
        category: 'beauty',
        searchUrl: (q) => `https://www.nykaa.com/search/result/?q=${encodeURIComponent(q)}`,
        container: ['div.productWrapper', 'div.product-list-box', 'div.css-1rdw0y6'],
        title: ['div.css-xrz21k', 'div.css-15494d', 'h2.product-title'],
        price: ['span.css-11175sf', 'span.css-1k3w8v1', 'span.price-title'],
        originalPrice: ['span.css-bhngty', 'span.css-175wfxm'],
        rating: ['span.css-128kj85', 'div.rating-count'],
        image: ['img.css-11v55fz', 'img.product-list-box-img']
    },

    snapdeal: {
        name: 'Snapdeal',
        category: 'general',
        searchUrl: (q) => `https://www.snapdeal.com/search?keyword=${encodeURIComponent(q)}`,
        container: ['div.product-tuple-listing', 'div.product-tuple-image'],
        title: ['p.product-title', 'a.dp-widget-link p'],
        price: ['span.product-price', 'span.lfloat'],
        originalPrice: ['span.product-desc-price', 'span.strike'],
        rating: ['div.rating-stars', 'p.product-rating'],
        image: ['img.product-image', 'picture.picture-sample img']
    },

    meesho: {
        name: 'Meesho',
        category: 'general',
        searchUrl: (q) => `https://www.meesho.com/search?q=${encodeURIComponent(q)}`,
        container: ['div.ProductList__GridCol-sc-9860b6-0', 'div[class*="ProductCard"]', 'a[href*="/p/"]'],
        title: ['p[class*="Text__StyledText"]', 'p.product-title'],
        price: ['h5[class*="Text__StyledText"]', 'h4.price'],
        originalPrice: ['p[class*="strike"]'],
        rating: ['span[class*="Badge"]', 'div.rating'],
        image: ['img[src*="meesho"]', 'img']
    },

    nike: {
        name: 'Nike',
        category: 'sports',
        searchUrl: (q) => `https://www.nike.com/in/w?q=${encodeURIComponent(q)}`,
        container: ['div[data-testid="product-card"]', 'div.product-card'],
        title: ['.product-card__title', 'div.product-card__subtitle'],
        price: ['.product-price__wrapper', 'div.product-price', '.price-override'],
        originalPrice: ['.product-price--strikethrough'],
        rating: ['.review-count'],
        image: ['img.product-card__hero-image', 'img']
    },

    puma: {
        name: 'Puma',
        category: 'sports',
        searchUrl: (q) => `https://in.puma.com/in/en/search?q=${encodeURIComponent(q)}`,
        container: ['[data-test-id="product-list-item"]', 'li.product-grid-item'],
        title: ['[data-test-id="product-list-item-title"]', 'h3.product-item-title'],
        price: ['.price-value', 'span.price', 'div.custom-price'],
        originalPrice: ['span.price-strike'],
        rating: ['.rating'],
        image: ['img.product-image', 'img[data-test-id="product-list-item-image"]']
    },

    decathlon: {
        name: 'Decathlon',
        category: 'sports',
        searchUrl: (q) => `https://www.decathlon.in/search?query=${encodeURIComponent(q)}`,
        container: ['div.product-card-container', 'div.de-Card', 'div.product-tuple'],
        title: ['p.product-title', 'h2.product-title', 'a.product-card-title'],
        price: ['span.price', 'div.price-value', 'span.de-CardPrice'],
        originalPrice: ['span.strike-price', 'span.mrp-price'],
        rating: ['div.rating-value', 'span.rating'],
        image: ['img.product-card-image', 'img.de-CardImage']
    },

    shopsy: {
        name: 'Shopsy',
        category: 'general',
        searchUrl: (q) => `https://www.shopsy.in/search?q=${encodeURIComponent(q)}`,
        container: ['div[data-id]', 'div._1AtVbE'],
        title: ['a.w_Nig7', 'a.IRpw9B', 'div._4rR01T'],
        price: ['div.Nx9bqj', 'div._30jeq3'],
        originalPrice: ['div.yRaYxfa', 'div._3I9_wc'],
        rating: ['div._3LWZlK'],
        image: ['img._396cs4', 'img']
    },

    vijaysales: {
        name: 'Vijay Sales',
        category: 'electronics',
        searchUrl: (q) => `https://www.vijaysales.com/search/${encodeURIComponent(q)}`,
        container: ['div.vj-product-card', 'div.dynamicProductCard', 'div.pdt-card'],
        title: ['div.vj-pdt-name', 'a.vj-pdt-name', 'h2.vj-pdt-name'],
        price: ['span.vj-pdt-price', 'div.vj-pdt-price', 'span.price'],
        originalPrice: ['span.vj-pdt-mrp', 'span.mrp'],
        rating: ['div.vj-rating-box'],
        image: ['img.vj-pdt-img', 'img']
    }
};