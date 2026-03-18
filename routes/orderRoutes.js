const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Cấu hình transporter linh hoạt hơn với biến môi trường
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        // Ưu tiên dùng biến môi trường, nếu chưa có thì dùng tạm giá trị mặc định của bạn
        user: process.env.EMAIL_USER || "trung142p@gmail.com",
        pass: process.env.EMAIL_PASS || "itgyatbljobrqath",
    },
});

router.post("/", async (req, res) => {
    try {
        const { order_code, customer_info, items, total_price, payment_method } = req.body;

        // KIỂM TRA DỮ LIỆU: Đảm bảo không bị crash server nếu thiếu info
        if (!customer_info || !customer_info.name) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin khách hàng (Họ tên)!"
            });
        }

        const finalOrderCode = order_code || `ORD-${Date.now()}`;

        // 1. Lưu vào Supabase
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

        // 2. Gửi Email thông báo
        // EMAIL_RECEIVER được cấu hình trên Render là email của bạn để test
        const adminEmail = process.env.EMAIL_RECEIVER || "trung142p@gmail.com";

        transporter.sendMail({
            from: `"Hệ thống Shop" <${process.env.EMAIL_USER || "trung142p@gmail.com"}>`,
            to: adminEmail,
            subject: `🔔 ĐƠN HÀNG MỚI: ${finalOrderCode}`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.5;">
                    <h2 style="color: #db2777;">Thông báo đơn hàng mới</h2>
                    <p><strong>Mã đơn hàng:</strong> ${finalOrderCode}</p>
                    <p><strong>Khách hàng:</strong> ${customer_info.name}</p>
                    <p><strong>Số điện thoại:</strong> ${customer_info.phone}</p>
                    <p><strong>Địa chỉ:</strong> ${customer_info.addressDetail}, ${customer_info.district}, ${customer_info.province}</p>
                    <p><strong>Phương thức:</strong> ${payment_method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản trước 50%'}</p>
                    <p><strong>Tổng tiền:</strong> <span style="font-size: 18px; color: #e11d48; font-weight: bold;">${Number(total_price).toLocaleString()}đ</span></p>
                    <hr/>
                    <p style="font-size: 12px; color: #666;">Vui lòng truy cập trang Admin để xem chi tiết và xử lý đơn hàng.</p>
                </div>
            `
        }).then(() => console.log(`Email đã gửi tới: ${adminEmail}`))
            .catch(e => console.error("Lỗi gửi mail:", e.message));

        return res.status(201).json({ success: true, message: "Đặt hàng thành công!" });

    } catch (err) {
        console.error("Lỗi Server:", err.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống: " + err.message });
    }
});

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

module.exports = router;