require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");  // ← PHẢI LÀ SENDGRID

sgMail.setApiKey(process.env.SENDGRID_API_KEY);  // ← LẤY API KEY TỪ ENV

const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
    res.send("Server vẫn đang sống khỏe mạnh!");
});

app.post("/test-email", async (req, res) => {
    const fromEmail = process.env.EMAIL_USER || "trung142p@gmail.com";
    const toEmail = process.env.EMAIL_RECEIVER || "trung142p@gmail.com";

    const msg = {
        to: toEmail,
        from: fromEmail,
        subject: "Test email từ server",
        text: "Nếu bạn nhận được email này, cấu hình SendGrid đã hoạt động."
    };

    try {
        await sgMail.send(msg);
        res.json({ ok: true, message: "Email test đã được gửi qua SendGrid" });
    } catch (err) {
        console.error("Lỗi gửi test email:", err.response?.body || err.message);
        res.status(500).json({ error: err.message });
    }
});

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