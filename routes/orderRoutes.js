const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.post("/", async (req, res) => {
    try {
        // Nhận dữ liệu từ Frontend (Dùng đúng tên biến: customer_info)
        const { order_code, customer_info, items, total_price, payment_method } = req.body;

        // 1. KIỂM TRA DỮ LIỆU
        if (!customer_info || !items) {
            return res.status(400).json({ error: "Thiếu thông tin đơn hàng!" });
        }

        // 2. LƯU VÀO SUPABASE (Bảng orders bạn đã tạo)
        const { data, error: dbError } = await supabase
            .from("orders")
            .insert([
                {
                    order_code: order_code,
                    customer_info: customer_info, // JSONB
                    items: items,                 // JSONB
                    total_price: total_price,
                    payment_method: payment_method,
                    status: "Chờ xác nhận"
                }
            ]);

        if (dbError) throw dbError;

        // 3. GỬI EMAIL THÔNG BÁO (Nếu bạn đã cấu hình mail)
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const itemHtml = items.map(item => `<li>${item.name} - SL: ${item.quantity}</li>`).join("");

            await transporter.sendMail({
                from: '"My Shop" <noreply@myshop.com>',
                to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
                subject: `ĐƠN HÀNG MỚI: ${order_code}`,
                html: `<h3>Khách hàng: ${customer_info.name}</h3>
                       <p>SĐT: ${customer_info.phone}</p>
                       <p>Địa chỉ: ${customer_info.addressDetail}, ${customer_info.district}, ${customer_info.province}</p>
                       <ul>${itemHtml}</ul>
                       <p>Tổng tiền: ${total_price.toLocaleString()}đ</p>`
            });
        } catch (mailErr) {
            console.log("Lưu đơn thành công nhưng gửi mail lỗi (Có thể do chưa cài Pass ứng dụng)");
        }

        res.status(201).json({ success: true, message: "Đặt hàng thành công!" });

    } catch (err) {
        console.error("Lỗi Server:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Thêm Route GET để Admin Dashboard lấy được dữ liệu
router.get("/", async (req, res) => {
    const { data, error } = await supabase.from("orders").select("*").order('created_at', { ascending: false });
    if (error) return res.status(500).json(error);
    res.json(data);
});

module.exports = router;