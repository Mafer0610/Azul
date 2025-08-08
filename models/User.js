const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true, 
        enum: ['admin', 'user'],
        default: 'user'
    }
}, {
    timestamps: true 
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;