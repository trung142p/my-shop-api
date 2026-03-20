const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Cấu hình SMTP với port 587
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || "trung142p@gmail.com",
        pass: process.env.EMAIL_PASS || "itgyatbljobrqath",
    },
    tls: {
        rejectUnauthorized: false
    }
});

// 1. Tạo đơn hàng mới
router.post("/", async (req, res) => {
    try {
        const { order_code, customer_info, items, total_price, payment_method } = req.body;

        if (!customer_info || !customer_info.name) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin khách hàng!" });
        }

        const finalOrderCode = order_code || `ORD-${Date.now()}`;

        const { error } = await supabase
            .from("orders")
            .insert([{
                order_code: finalOrderCode,
                customer_info,
                items,
                total_price: Number(total_price),
                payment_method,
                status: "Chờ xác nhận",
                payment_status: "Chưa thanh toán"
            }]);

        if (error) throw error;

        // Gửi email thông báo
        const adminEmail = process.env.EMAIL_RECEIVER || "trung142p@gmail.com";
        const mailOptions = {
            from: `"Hệ thống Shop" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `🔔 ĐƠN HÀNG MỚI: ${finalOrderCode}`,
            html: `
        <div style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #db2777;">Có đơn hàng mới từ ${customer_info.name}!</h2>
            <p><strong>Mã đơn:</strong> ${finalOrderCode}</p>
            <p><strong>SĐT:</strong> ${customer_info.phone}</p>
            <p><strong>Địa chỉ:</strong> ${customer_info.addressDetail}, ${customer_info.district}, ${customer_info.province}</p>
            <p><strong>Tổng tiền:</strong> <span style="color: red; font-size: 18px;">${Number(total_price).toLocaleString()}₫</span></p>
            <hr/>
            <p>Vui lòng kiểm tra Admin Dashboard để xử lý.</p>
        </div>
    `
        };

        // Gửi email và log
        transporter.sendMail(mailOptions)
            .then(info => console.log("✅ Email sent:", info.response))
            .catch(e => console.error("❌ Email error:", e.message));

        // Trả về thành công
        res.json({ success: true, message: "Đặt hàng thành công!" });

    } catch (err) {
        console.error("Lỗi tạo đơn:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Lấy danh sách đơn hàng
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Cập nhật trạng thái
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from("orders")
            .update(updates)
            .eq("id", id)
            .select();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        console.error("Lỗi cập nhật:", err.message);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});

// 4. Xóa đơn hàng
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from("orders").delete().eq("id", id);
        if (error) throw error;
        res.json({ success: true, message: "Đã xóa đơn hàng!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;