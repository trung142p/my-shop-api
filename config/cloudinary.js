const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: "dxma579lf",
    api_key: "162493944154219",
    api_secret: "yluFNY3xWntrS1mIfjd-O-KT2hc"
});

module.exports = cloudinary;