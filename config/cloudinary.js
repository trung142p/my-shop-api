const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: "ddivnd5nh",
    api_key: "173314725861216",
    api_secret: "ty0fM7sqymYkJOVj-u51IDcm9rQ"
});

module.exports = cloudinary;