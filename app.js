require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

// Khởi tạo Resend với API key
const resend = new Resend(process.env.RESEND_API_KEY);

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
    const toEmail = process.env.EMAIL_RECEIVER || "trung142p@gmail.com";
    // Email gửi từ Resend (email mặc định hoặc domain đã xác thực)
    const fromEmail = "onboarding@resend.dev"; // Email mặc định của Resend

    try {
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: toEmail,
            subject: "Test email từ server",
            html: "<p>Nếu bạn nhận được email này, cấu hình Resend đã hoạt động!</p>"
        });

        if (error) {
            console.error("Lỗi Resend:", error);
            return res.status(500).json({ error: error.message });
        }

        console.log("✅ Email sent via Resend:", data);
        res.json({ ok: true, message: "Email test đã được gửi qua Resend", data });
    } catch (err) {
        console.error("Lỗi gửi test email:", err);
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