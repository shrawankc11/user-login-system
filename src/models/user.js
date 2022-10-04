const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: String,
    passwordHash: String,
    notes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
    }],
    refreshToken : String
})

userSchema.set('toJSON', {
    transform: (doc, obj) => {
        obj.id = obj._id.toString()
        delete obj._id
        delete obj.__v
    }
})

module.exports = mongoose.model('User', userSchema)

