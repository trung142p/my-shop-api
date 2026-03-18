const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// Khởi tạo Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Cấu hình Mailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "trung142p@gmail.com",
        pass: process.env.EMAIL_PASS || "itgyatbljobrqath", // Nên để trong file .env
    },
});

// 1. Tạo đơn hàng (Dành cho khách)
router.post("/", async (req, res) => {
    try {
        const { order_code, customer_info, items, total_price, payment_method } = req.body;
        const finalOrderCode = order_code || `ORD-${Date.now()}`;

        const { data, error } = await supabase
            .from("orders")
            .insert([{
                order_code: finalOrderCode,
                customer_info,
                items,
                total_price: Number(total_price),
                payment_method,
                status: "Chờ xác nhận",
                payment_status: "Chưa thanh toán"
            }])
            .select();

        if (error) throw error;

        // Gửi mail thông báo Admin
        const mailOptions = {
            from: `"Hệ thống Shop" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_RECEIVER || "trung142p@gmail.com",
            subject: `🔔 ĐƠN HÀNG MỚI: ${finalOrderCode}`,
            html: `<h2>Đơn hàng từ ${customer_info.name}</h2><p>Tổng: ${Number(total_price).toLocaleString()}₫</p>`
        };
        transporter.sendMail(mailOptions).catch(e => console.error("Lỗi mail:", e.message));

        res.status(201).json({ success: true, data: data[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Lấy danh sách đơn hàng
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase.from("orders").select("*").order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. Cập nhật trạng thái
router.patch("/:id", async (req, res) => {
    try {
        const { data, error } = await supabase.from("orders").update(req.body).eq("id", req.params.id).select();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// 4. Xóa đơn hàng
router.delete("/:id", async (req, res) => {
    try {
        const { error } = await supabase.from("orders").delete().eq("id", req.params.id);
        if (error) throw error;
        res.json({ success: true, message: "Đã xóa!" });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;