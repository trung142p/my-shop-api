const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. Tạo đơn hàng mới
router.post("/", async (req, res) => {
    try {
        const { order_code, customer_info, items, total_price, payment_method } = req.body;

        if (!customer_info || !customer_info.name) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin khách hàng!" });
        }

        const finalOrderCode = order_code || `ORD-${Date.now()}`;

        // Lưu email và receiveUpdates vào customer_info
        const customerData = {
            name: customer_info.name,
            phone: customer_info.phone,
            email: customer_info.email || "",
            receive_updates: customer_info.receiveUpdates || false,
            province: customer_info.province,
            district: customer_info.district,
            addressDetail: customer_info.addressDetail
        };

        const { error } = await supabase
            .from("orders")
            .insert([{
                order_code: finalOrderCode,
                customer_info: customerData,
                items,
                total_price: Number(total_price),
                payment_method,
                status: "Chờ xác nhận",
                payment_status: "Chưa thanh toán"
            }]);

        if (error) throw error;

        // Gửi email thông báo đơn hàng mới cho Admin
        const adminEmail = process.env.EMAIL_RECEIVER || "trung142p@gmail.com";
        const fromEmail = "onboarding@resend.dev";

        await resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: `🔔 ĐƠN HÀNG MỚI: ${finalOrderCode}`,
            html: `
                <div style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #db2777;">Có đơn hàng mới từ ${customer_info.name}!</h2>
                    <p><strong>Mã đơn:</strong> ${finalOrderCode}</p>
                    <p><strong>SĐT:</strong> ${customer_info.phone}</p>
                    ${customer_info.email ? `<p><strong>Email:</strong> ${customer_info.email}</p>` : ''}
                    <p><strong>Địa chỉ:</strong> ${customer_info.addressDetail}, ${customer_info.district}, ${customer_info.province}</p>
                    <p><strong>Tổng tiền:</strong> <span style="color: red; font-size: 18px;">${Number(total_price).toLocaleString()}₫</span></p>
                    <hr/>
                    <p>Vui lòng kiểm tra Admin Dashboard để xử lý.</p>
                </div>
            `
        }).catch(e => console.error("❌ Admin email error:", e));

        res.json({
            success: true,
            message: "Đặt hàng thành công!",
            order_code: finalOrderCode
        });

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

// 3. Cập nhật trạng thái và gửi email thông báo cho khách
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Lấy thông tin đơn hàng hiện tại
        const { data: currentOrder, error: fetchError } = await supabase
            .from("orders")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        // Cập nhật đơn hàng
        const { data, error } = await supabase
            .from("orders")
            .update(updates)
            .eq("id", id)
            .select();

        if (error) throw error;

        // Gửi email thông báo cho khách hàng nếu có email và đăng ký nhận thông báo
        const customerEmail = currentOrder.customer_info?.email;
        const receiveUpdates = currentOrder.customer_info?.receive_updates;

        if (customerEmail && receiveUpdates && updates.status) {
            const statusMessages = {
                "Chờ xác nhận": "🟡 Đơn hàng của bạn đang được xác nhận",
                "Xác nhận": "✅ Đơn hàng của bạn đã được xác nhận",
                "Đang vận chuyển": "🚚 Đơn hàng của bạn đang được vận chuyển",
                "Thành công": "🎉 Đơn hàng của bạn đã giao thành công! Cảm ơn bạn đã mua hàng.",
                "Hủy": "❌ Đơn hàng của bạn đã bị hủy. Vui lòng liên hệ shop để biết thêm chi tiết."
            };

            const message = statusMessages[updates.status] || `Đơn hàng của bạn đã cập nhật trạng thái: ${updates.status}`;

            const statusIcons = {
                "Chờ xác nhận": "⏳",
                "Xác nhận": "✅",
                "Đang vận chuyển": "🚚",
                "Thành công": "🎉",
                "Hủy": "❌"
            };

            const icon = statusIcons[updates.status] || "📦";

            // Tạo HTML chi tiết đơn hàng
            const itemsHtml = currentOrder.items?.map(item => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                    <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${(item.price * item.quantity).toLocaleString()}₫</td>
                </tr>
            `).join('');

            await resend.emails.send({
                from: "onboarding@resend.dev",
                to: customerEmail,
                subject: `${icon} Cập nhật trạng thái đơn hàng #${currentOrder.order_code}`,
                html: `
                    <div style="font-family: Arial, sans-serif; border: 1px solid #eee; padding: 20px; max-width: 600px;">
                        <h2 style="color: #db2777;">Cập nhật đơn hàng</h2>
                        <p>Xin chào <strong>${currentOrder.customer_info?.name}</strong>,</p>
                        <p>Đơn hàng <strong>#${currentOrder.order_code}</strong> của bạn đã được cập nhật:</p>
                        
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p style="margin: 0; font-size: 16px;"><strong>Trạng thái mới:</strong> ${message}</p>
                        </div>
                        
                        <h3>📋 Chi tiết đơn hàng:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f3f4f6;">
                                    <th style="padding: 8px; text-align: left;">Sản phẩm</th>
                                    <th style="padding: 8px; text-align: center;">Số lượng</th>
                                    <th style="padding: 8px; text-align: right;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                        
                        <div style="margin-top: 15px; text-align: right;">
                            <p><strong>Tổng tiền:</strong> <span style="color: #db2777; font-size: 18px;">${currentOrder.total_price?.toLocaleString()}₫</span></p>
                        </div>
                        
                        <hr style="margin: 20px 0;"/>
                        <p style="color: #666; font-size: 12px;">
                            Bạn nhận được email này vì đã đăng ký nhận thông báo từ shop.<br/>
                            Nếu không muốn nhận thông báo, vui lòng bỏ qua email này.
                        </p>
                        <p style="color: #999; font-size: 12px;">© Thiên đường sung sướng - Shop đồ chơi người lớn cao cấp</p>
                    </div>
                `
            }).catch(e => console.error("❌ Customer email error:", e));
        }

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