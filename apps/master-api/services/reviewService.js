const Review = require('../../../libs/database/Review');

const SAMPLE_REVIEWS = [
    {
        userName: "Aarav Sharma",
        userEmail: "aarav@example.com",
        type: "POSITIVE",
        rating: 5,
        title: "Saved over ₹4,500 on my gaming laptop!",
        comment: "The multi-store price aggregation across Flipkart, Amazon, and Tata CLiQ is blazingly fast. Found an amazing deal that wasn't showing on top of search results. Outstanding work on the stealth browser engine!",
        upvotes: 18,
        createdAt: new Date(Date.now() - 86400000 * 2)
    },
    {
        userName: "Priya Patel",
        userEmail: "priya@example.com",
        type: "FAULT",
        rating: 3,
        title: "Ajio store search takes slightly longer during peak hours",
        comment: "Sometimes the Ajio worker node takes around 8-10 seconds to respond when scraping fashion categories. Would be great if we can add selector caching or timeout retries for Ajio specifically.",
        upvotes: 12,
        createdAt: new Date(Date.now() - 86400000 * 4)
    },
    {
        userName: "Rohan Verma",
        userEmail: "rohan@example.com",
        type: "POSITIVE",
        rating: 5,
        title: "The Red & Black dark theme looks super slick!",
        comment: "Loving the new glassmorphic sidebar and restaurant table reservation integration. The UI is extremely clean and responsive on mobile as well.",
        upvotes: 24,
        createdAt: new Date(Date.now() - 86400000 * 1)
    },
    {
        userName: "Ananya Deshmukh",
        userEmail: "ananya@example.com",
        type: "SUGGESTION",
        rating: 4,
        title: "Suggest adding price drop alert notifications",
        comment: "It would be awesome to get an email or browser alert whenever an item saved in my Wishlist drops below a target threshold price!",
        upvotes: 31,
        createdAt: new Date(Date.now() - 86400000 * 5)
    }
];

const seedReviewsIfNeeded = async () => {
    const count = await Review.countDocuments();
    if (count === 0) {
        console.log("🌱 Seeding initial user reviews & feedback...");
        // Use dummy ObjectIds for sample reviews
        const dummyUserId = "6a85cd69c14394e1f30efe49";
        const reviewsToInsert = SAMPLE_REVIEWS.map(r => ({ ...r, userId: dummyUserId }));
        await Review.insertMany(reviewsToInsert);
        console.log("✅ Review database seeded.");
    }
};

const getReviews = async ({ type, rating, query }) => {
    await seedReviewsIfNeeded();

    let filter = {};

    if (type && type !== 'ALL') {
        filter.type = type;
    }

    if (rating) {
        filter.rating = Number(rating);
    }

    if (query && query.trim()) {
        const qRegex = new RegExp(query.trim(), 'i');
        filter.$or = [
            { title: qRegex },
            { comment: qRegex },
            { userName: qRegex }
        ];
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 });

    // Aggregate summary stats
    const totalCount = await Review.countDocuments();
    const faultCount = await Review.countDocuments({ type: 'FAULT' });
    const positiveCount = await Review.countDocuments({ type: 'POSITIVE' });
    const suggestionCount = await Review.countDocuments({ type: 'SUGGESTION' });

    const avgRatingRes = await Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = avgRatingRes.length > 0 ? Number(avgRatingRes[0].avgRating.toFixed(1)) : 4.8;

    return {
        reviews,
        stats: {
            totalCount,
            faultCount,
            positiveCount,
            suggestionCount,
            avgRating
        }
    };
};

const createReview = async ({ userId, userName, userEmail, type, rating, title, comment }) => {
    if (!title || !comment) throw new Error('Title and comment are required.');
    
    const newReview = await Review.create({
        userId,
        userName: userName || 'Anonymous User',
        userEmail: userEmail || '',
        type: type || 'POSITIVE',
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        title,
        comment
    });

    return newReview;
};

const upvoteReview = async (reviewId) => {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error('Review not found');

    review.upvotes += 1;
    await review.save();
    return review;
};

module.exports = {
    getReviews,
    createReview,
    upvoteReview
};
