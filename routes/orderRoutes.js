const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "trung142p@gmail.com",
        pass: process.env.EMAIL_PASS || "itgyatbljobrqath",
    },
});

// 1. Tạo đơn hàng mới (Dành cho khách hàng)
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

        // Gửi Email thông báo cho Admin
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
        transporter.sendMail(mailOptions).catch(e => console.error("Lỗi gửi mail:", e.message));
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Lấy danh sách đơn hàng (Dành cho Admin)
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

// 3. CẬP NHẬT TRẠNG THÁI (Đây là phần Trung đang thiếu)
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // Dữ liệu gửi lên: { status: "..." } hoặc { payment_status: "..." }

        const { data, error } = await supabase
            .from("orders")
            .update(updates)
            .eq("id", id) // Phải khớp với tên cột ID trong bảng orders của bạn
            .select();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (err) {
        console.error("Lỗi cập nhật:", err.message);
        res.status(500).json({ success: false, message: "Lỗi Server: " + err.message });
    }
});

// 4. XÓA ĐƠN HÀNG (Thêm mới)
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