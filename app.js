require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer"); // Thêm import này

// Import đủ 3 Routes
const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
    res.send("Server vẫn đang sống khỏe mạnh!");
});

// Endpoint test email (thêm mới)
app.post("/test-email", async (req, res) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    try {
        await transporter.sendMail({
            from: `"Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_RECEIVER,
            subject: "Test email từ server",
            text: "Nếu bạn nhận được email này, cấu hình email đã hoạt động."
        });
        res.json({ ok: true, message: "Email test đã được gửi" });
    } catch (err) {
        console.error("Lỗi gửi test email:", err);
        res.status(500).json({ error: err.message });
    }
});

// Đăng ký đủ 3 Routes
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);

app.use((req, res) => {
    res.status(404).send("Đường dẫn này không tồn tại trên Server!");
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});