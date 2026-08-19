const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const WishlistItemSchema = new mongoose.Schema({
    title: String,
    price: Number,
    originalPrice: Number,
    discount: Number,
    rating: Number,
    image: String,
    store: String,
    url: String,
    savedAt: { type: Date, default: Date.now }
});

const CartItemSchema = new mongoose.Schema({
    title: String,
    price: Number,
    originalPrice: Number,
    discount: Number,
    rating: Number,
    image: String,
    store: String,
    url: String,
    quantity: { type: Number, default: 1 },
    addedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    wishlist: [WishlistItemSchema],
    cart: [CartItemSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to hash password before storing in DB
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Instance method to compare entered password with stored hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
