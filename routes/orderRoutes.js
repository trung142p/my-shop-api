const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// Khởi tạo Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Cấu hình gửi mail (Thông tin bạn cung cấp)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "trung142p@gmail.com",
        pass: "itgyatbljobrqath", // Mật khẩu ứng dụng 16 ký tự
    },
});

// ROUTE CHÍNH: Xử lý đặt hàng
// Lưu ý: Chỉ dùng "/" vì app.js đã nối tiền tố /api/orders
router.post("/", async (req, res) => {
    try {
        const { order_code, customer_info, items, total_price, payment_method } = req.body;

        // 1. Kiểm tra dữ liệu
        if (!customer_info || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ!" });
        }

        // 2. Lưu vào Supabase bảng 'orders'
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

        if (error) {
            console.error("Lỗi Supabase:", error.message);
            return res.status(500).json({ success: false, message: "Lỗi lưu database" });
        }

        // 3. Gửi Mail thông báo (Gửi ngầm để khách không phải chờ)
        transporter.sendMail({
            from: `"Hệ thống" <trung142p@gmail.com>`,
            to: "vohoangphuc112280@gmail.com",
            subject: `🔔 ĐƠN HÀNG MỚI: ${order_code}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #db2777;">Thông báo đơn hàng mới</h2>
                    <p><strong>Khách hàng:</strong> ${customer_info.name}</p>
                    <p><strong>Số điện thoại:</strong> ${customer_info.phone}</p>
                    <p><strong>Địa chỉ:</strong> ${customer_info.addressDetail}, ${customer_info.district}, ${customer_info.province}</p>
                    <hr/>
                    <h3>Chi tiết sản phẩm:</h3>
                    <ul>
                        ${items.map(i => `<li>${i.name} (x${i.quantity}) - ${i.price.toLocaleString()}đ</li>`).join('')}
                    </ul>
                    <p><strong>Tổng cộng: ${Number(total_price).toLocaleString()}đ</strong></p>
                </div>
            `
        }).catch(err => console.error("Lỗi gửi mail:", err.message));

        return res.status(201).json({ success: true, message: "Đặt hàng thành công!" });

    } catch (err) {
        console.error("Lỗi hệ thống:", err.message);
        return res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// ROUTE: Lấy danh sách đơn hàng cho Admin
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;