const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    // Sửa lại để nhận diện được cả 'image' (trên Cloud) và 'coverImage'
    image: String,
    coverImage: String,

    description: String,

    // Thêm specs vì trên Cloud của bạn đang có trường này dạng Array
    specs: [String],

    images: [String],

    stock: {
        type: Number,
        default: 0
    },
    sold: {
        type: Number,
        default: 0
    },
    colors: [String],
    variants: [String],
    category: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Product", ProductSchema);