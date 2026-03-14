const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {

    const { password } = req.body;

    if (password === process.env.ADMIN_PASSWORD) {

        return res.json({
            token: process.env.ADMIN_TOKEN
        });

    }

    res.status(401).json({
        message: "Sai mật khẩu"
    });

});

module.exports = router;