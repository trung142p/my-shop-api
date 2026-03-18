const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Cấu hình gửi mail với thông tin bạn cung cấp
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "trung142p@gmail.com",    // Email gửi của bạn
        pass: "itgyatbljobrqath",      // Mã mật khẩu ứng dụng (đã bỏ dấu cách)
    },
});

router.post("/", async (req, res) => {
    try {
        const { order_code, customer_info, items, total_price, payment_method } = req.body;

        // 1. Kiểm tra dữ liệu đầu vào cơ bản
        if (!customer_info || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Dữ liệu đơn hàng không hợp lệ!" });
        }

        // 2. Lưu vào Supabase bảng 'orders'
        const { data, error } = await supabase
            .from("orders")
            .insert([
                {
                    order_code: order_code || `ORD-${Date.now()}`,
                    customer_info,
                    items,
                    total_price: Number(total_price),
                    payment_method,
                    status: "Chờ xác nhận",
                    payment_status: "Chưa thanh toán"
                }
            ]);

        if (error) throw error;

        // 3. Gửi Email thông báo cho ông Phúc
        try {
            await transporter.sendMail({
                from: `"Hệ thống SexShop" <trung142p@gmail.com>`,
                to: "vohoangphuc112280@gmail.com",
                subject: `🔔 ĐƠN HÀNG MỚI: ${order_code}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #f0f0f0; padding: 20px;">
                        <h2 style="color: #db2777; border-bottom: 2px solid #db2777; pb-2;">Đơn hàng mới từ Website</h2>
                        <p><strong>Khách hàng:</strong> ${customer_info.name}</p>
                        <p><strong>Số điện thoại:</strong> <a href="tel:${customer_info.phone}">${customer_info.phone}</a></p>
                        <p><strong>Địa chỉ:</strong> ${customer_info.addressDetail}, ${customer_info.district}, ${customer_info.province}</p>
                        <hr style="border: 0; border-top: 1px solid #eee;"/>
                        <h3>Chi tiết sản phẩm:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            ${items.map(i => `
                                <tr>
                                    <td style="padding: 5px 0;">${i.name} (x${i.quantity})</td>
                                    <td style="text-align: right;">${(i.price * i.quantity).toLocaleString()}đ</td>
                                </tr>
                            `).join('')}
                        </table>
                        <hr style="border: 0; border-top: 1px solid #eee;"/>
                        <p><strong>Hình thức:</strong> ${payment_method === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản 50%'}</p>
                        <p style="font-size: 20px; color: #e11d48;"><strong>TỔNG CỘNG: ${Number(total_price).toLocaleString()}đ</strong></p>
                        <p style="font-size: 12px; color: #999; margin-top: 20px;">Hệ thống tự động gửi từ Website của Trung.</p>
                    </div>
                `,
            });
            console.log("Email thông báo đã được gửi tới ông Phúc.");
        } catch (mailErr) {
            console.error("Lỗi gửi mail:", mailErr.message);
            // Không trả về lỗi ở đây để khách vẫn thấy đặt hàng thành công dù mail lỗi
        }

        return res.status(201).json({ success: true, message: "Đặt hàng thành công!" });

    } catch (err) {
        console.error("Lỗi Server:", err.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống: " + err.message });
    }
});

router.get("/", async (req, res) => {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

module.exports = router;