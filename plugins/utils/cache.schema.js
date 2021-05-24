const mongoose = require('mongoose')
const schema = new mongoose.Schema({
    imageMd5: { type: String, index: true, required: true, },
    date: { type: Date, default: Date.now },
    type: { type: String, index: true, required: true },
    similarity: { type: Number, default: 0 },
    bot: { type: Number, required: true },
    msg: Array || String
})

exports.ImageCache = mongoose.model('imageCache', schema)