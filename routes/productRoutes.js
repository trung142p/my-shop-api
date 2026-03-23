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

        // Chuyển đổi specs từ JSON string sang object khi trả về
        const processedData = data.map(product => {
            if (product.specs && typeof product.specs === 'string') {
                try {
                    product.specs = JSON.parse(product.specs);
                } catch (e) {
                    product.specs = [];
                }
            }
            return product;
        });

        res.json(processedData || []);
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

        // Chuyển đổi specs từ JSON string sang object
        if (data.specs && typeof data.specs === 'string') {
            try {
                data.specs = JSON.parse(data.specs);
            } catch (e) {
                data.specs = [];
            }
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ message: "Không tìm thấy sản phẩm" });
    }
});

// 3. TẠO SẢN PHẨM MỚI (POST)
router.post("/", async (req, res) => {
    try {
        const productData = { ...req.body };

        // Xử lý specs: nếu là mảng thì chuyển thành JSON string để lưu vào database
        if (productData.specs && Array.isArray(productData.specs)) {
            productData.specs = JSON.stringify(productData.specs);
        }

        console.log("Tạo sản phẩm:", productData);

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
        const updates = { ...req.body };

        console.log("Cập nhật sản phẩm ID:", id);
        console.log("Dữ liệu nhận được:", updates);

        // Xử lý specs: nếu là mảng thì chuyển thành JSON string
        if (updates.specs && Array.isArray(updates.specs)) {
            updates.specs = JSON.stringify(updates.specs);
        }

        // Loại bỏ các trường không cần thiết (id, created_at)
        delete updates.id;
        delete updates.created_at;

        const { data, error } = await supabase
            .from("products")
            .update(updates)
            .eq("id", id)
            .select();

        if (error) {
            console.error("Lỗi Supabase:", error);
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        // Chuyển specs từ JSON string sang object trước khi trả về
        if (data[0].specs && typeof data[0].specs === 'string') {
            try {
                data[0].specs = JSON.parse(data[0].specs);
            } catch (e) {
                data[0].specs = [];
            }
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

        console.log("PATCH sản phẩm ID:", id, updates);

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

// ==================== VARIANTS MANAGEMENT ====================

// Lấy tất cả variants của một sản phẩm
router.get("/:productId/variants", async (req, res) => {
    try {
        const { productId } = req.params;
        const { data, error } = await supabase
            .from("variants")
            .select("*")
            .eq("product_id", productId)
            .order("id");

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error("Lỗi lấy variants:", err);
        res.status(500).json({ message: err.message });
    }
});

// Tạo variant mới
router.post("/:productId/variants", async (req, res) => {
    try {
        const { productId } = req.params;
        const variantData = { ...req.body, product_id: parseInt(productId) };

        const { data, error } = await supabase
            .from("variants")
            .insert([variantData])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error("Lỗi tạo variant:", err);
        res.status(500).json({ message: err.message });
    }
});

// Cập nhật variant
router.put("/variants/:variantId", async (req, res) => {
    try {
        const { variantId } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from("variants")
            .update(updates)
            .eq("id", variantId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error("Lỗi cập nhật variant:", err);
        res.status(500).json({ message: err.message });
    }
});

// Xóa variant
router.delete("/variants/:variantId", async (req, res) => {
    try {
        const { variantId } = req.params;
        const { error } = await supabase
            .from("variants")
            .delete()
            .eq("id", variantId);

        if (error) throw error;
        res.json({ success: true, message: "Đã xóa biến thể!" });
    } catch (err) {
        console.error("Lỗi xóa variant:", err);
        res.status(500).json({ message: err.message });
    }
});

// Cập nhật stock của variant (PATCH)
router.patch("/variants/:variantId/stock", async (req, res) => {
    try {
        const { variantId } = req.params;
        const { stock } = req.body;

        const { data, error } = await supabase
            .from("variants")
            .update({ stock })
            .eq("id", variantId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        console.error("Lỗi cập nhật stock variant:", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;