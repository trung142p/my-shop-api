const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. LẤY TẤT CẢ SẢN PHẨM (Dành cho Trang chủ)
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase.from("products").select("*");
        if (error) throw error;

        console.log(`Đã gửi về ${data.length} sản phẩm`);
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. LẤY CHI TIẾT 1 SẢN PHẨM (Dành cho trang ProductDetail)
router.get("/:id", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("id", req.params.id) // Tìm sản phẩm có id tương ứng
            .single(); // Lấy 1 đối tượng duy nhất, không phải mảng

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: "Không tìm thấy sản phẩm" });
    }
});

module.exports = router;