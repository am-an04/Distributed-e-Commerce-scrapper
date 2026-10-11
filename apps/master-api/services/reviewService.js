const Review = require('../../../libs/database/Review');

const getReviews = async ({ type, rating, query }) => {
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
    const avgRating = avgRatingRes.length > 0 ? Number(avgRatingRes[0].avgRating.toFixed(1)) : 0;

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
