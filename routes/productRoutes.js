const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. LẤY TẤT CẢ SẢN PHẨM
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

// 2. LẤY CHI TIẾT 1 SẢN PHẨM
router.get("/:id", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("id", req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: "Không tìm thấy sản phẩm" });
    }
});

// 3. TẠO SẢN PHẨM MỚI (POST)
router.post("/", async (req, res) => {
    try {
        const productData = req.body;

        // Xử lý specs nếu là object thì chuyển thành JSON string
        if (productData.specs && typeof productData.specs === 'object') {
            productData.specs = JSON.stringify(productData.specs);
        }

        const { data, error } = await supabase
            .from("products")
            .insert([productData])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error("Lỗi tạo sản phẩm:", err);
        res.status(500).json({ message: err.message });
    }
});

// 4. CẬP NHẬT SẢN PHẨM (PUT)
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Xử lý specs nếu là object thì chuyển thành JSON string
        if (updates.specs && typeof updates.specs === 'object') {
            updates.specs = JSON.stringify(updates.specs);
        }

        const { data, error } = await supabase
            .from("products")
            .update(updates)
            .eq("id", id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        res.json(data[0]);
    } catch (err) {
        console.error("Lỗi cập nhật sản phẩm:", err);
        res.status(500).json({ message: err.message });
    }
});

// 5. XÓA SẢN PHẨM (DELETE)
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        if (error) throw error;

        res.json({ success: true, message: "Đã xóa sản phẩm!" });
    } catch (err) {
        console.error("Lỗi xóa sản phẩm:", err);
        res.status(500).json({ message: err.message });
    }
});

// 6. CẬP NHẬT MỘT PHẦN SẢN PHẨM (PATCH) - dùng cho cập nhật stock/sold
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from("products")
            .update(updates)
            .eq("id", id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        res.json(data[0]);
    } catch (err) {
        console.error("Lỗi cập nhật một phần sản phẩm:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;