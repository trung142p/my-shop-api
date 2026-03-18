const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "trung142p@gmail.com",
        pass: "itgyatbljobrqath",
    },
});

router.post("/", async (req, res) => {
    try {
        const { order_code, customer_info, items, total_price, payment_method } = req.body;

        // KIỂM TRA DỮ LIỆU: Đây là đoạn fix lỗi 'name' undefined
        if (!customer_info || !customer_info.name) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin khách hàng (Họ tên)!"
            });
        }

        // 1. Lưu vào Supabase
        const { data, error } = await supabase
            .from("orders")
            .insert([{
                order_code: order_code || `ORD-${Date.now()}`,
                customer_info,
                items,
                total_price: Number(total_price),
                payment_method,
                status: "Chờ xác nhận",
                payment_status: "Chưa thanh toán"
            }]);

        if (error) throw error;

        // 2. Gửi Email (Dùng optional chaining ?. để an toàn tuyệt đối)
        transporter.sendMail({
            from: `"Hệ thống" <trung142p@gmail.com>`,
            to: "vohoangphuc112280@gmail.com",
            subject: `🔔 ĐƠN HÀNG MỚI: ${order_code}`,
            html: `<h3>Đơn hàng từ: ${customer_info?.name || 'Khách hàng'}</h3>
                   <p>SĐT: ${customer_info?.phone || 'N/A'}</p>
                   <p>Tổng tiền: ${Number(total_price).toLocaleString()}đ</p>`
        }).catch(e => console.error("Lỗi gửi mail:", e.message));

        return res.status(201).json({ success: true, message: "Đặt hàng thành công!" });

    } catch (err) {
        console.error("Lỗi Server:", err.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống: " + err.message });
    }
});

router.get("/", async (req, res) => {
    const { data, error } = await supabase.from("orders").select("*").order('created_at', { ascending: false });
    res.json(data || []);
});

module.exports = router;