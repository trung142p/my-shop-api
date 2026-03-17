const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. Lưu đơn hàng mới
router.post("/", async (req, res) => {
    try {
        const { order_code, customer_info, items, total_price, payment_method } = req.body;
        const { data, error } = await supabase
            .from("orders")
            .insert([{ order_code, customer_info, items, total_price, payment_method }])
            .select();
        if (error) throw error;
        res.status(200).json({ message: "Đặt hàng thành công!", order: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Lấy danh sách đơn hàng cho Admin
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Cập nhật trạng thái đơn hàng
router.put("/:id", async (req, res) => {
    try {
        const { status, payment_status } = req.body;
        const { data, error } = await supabase
            .from("orders")
            .update({ status, payment_status })
            .eq("id", req.params.id);
        if (error) throw error;
        res.json({ message: "Cập nhật thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;