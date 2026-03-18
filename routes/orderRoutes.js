const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.post("/", async (req, res) => {
    try {
        const { order_code, customer_info, items, total_price, payment_method } = req.body;

        // KIỂM TRA 1: Nếu không có dữ liệu gửi lên
        if (!customer_info || !items || items.length === 0) {
            console.error("Lỗi: Dữ liệu gửi lên bị thiếu", req.body);
            return res.status(400).json({ success: false, message: "Thông tin đơn hàng không đầy đủ!" });
        }

        // KIỂM TRA 2: Kiểm tra các trường bắt buộc trong customer_info để tránh lỗi 'undefined'
        if (!customer_info.name || !customer_info.phone) {
            return res.status(400).json({ success: false, message: "Tên và số điện thoại không được để trống!" });
        }

        const { data, error } = await supabase
            .from("orders")
            .insert([
                {
                    order_code: order_code || `ORD-${Date.now()}`,
                    customer_info,
                    items,
                    total_price: Number(total_price),
                    payment_method,
                    status: "Xác nhận",
                    payment_status: "Chưa thanh toán"
                }
            ]);

        if (error) {
            console.error("Lỗi Supabase chi tiết:", error);
            return res.status(500).json({ success: false, message: "Lỗi Database: " + error.message });
        }

        return res.status(201).json({ success: true, message: "Đã nhận đơn hàng!" });
    } catch (err) {
        console.error("Lỗi hệ thống Backend:", err.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống: " + err.message });
    }
});

router.get("/", async (req, res) => {
    const { data, error } = await supabase.from("orders").select("*").order('created_at', { ascending: false });
    res.json(data);
});

module.exports = router;