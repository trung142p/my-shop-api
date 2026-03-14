const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
    const { customer, items, totalPrice } = req.body;

    // 1. Cấu hình Email gửi đi (Sử dụng Gmail)
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "email_cua_ban@gmail.com", // Email của bạn
            pass: "mat_khau_ung_dung_16_so" // Mật khẩu ứng dụng (tôi sẽ chỉ cách lấy sau)
        }
    });

    // 2. Nội dung Email
    const itemHtml = items.map(item => `
        <li>${item.name} - SL: ${item.quantity} - Giá: ${item.price.toLocaleString()}đ</li>
    `).join("");

    const mailOptions = {
        from: "SexShop Online",
        to: "email_nhan_don@gmail.com", // Email bạn muốn nhận thông báo đơn hàng
        subject: `ĐƠN HÀNG MỚI TỪ ${customer.name}`,
        html: `
            <h2>Thông tin đơn hàng mới</h2>
            <p><strong>Khách hàng:</strong> ${customer.name}</p>
            <p><strong>SĐT:</strong> ${customer.phone}</p>
            <p><strong>Địa chỉ:</strong> ${customer.address}</p>
            <h3>Sản phẩm đã mua:</h3>
            <ul>${itemHtml}</ul>
            <p><strong>Tổng tiền:</strong> ${totalPrice.toLocaleString()} VNĐ</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Order success!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Email failed" });
    }
});

module.exports = router;