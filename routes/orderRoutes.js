const express = require("express");
const router = express.Router();

// Giả lập database đơn hàng (Nếu bạn có MongoDB thì thay bằng Model)
let orders = [];

// POST: Đặt hàng (Fix lỗi 500)
router.post("/", async (req, res) => {
    try {
        const order = {
            id: Date.now(),
            ...req.body,
            status: "Chờ xác nhận",
            createdAt: new Date()
        };
        orders.push(order); // Lưu tạm vào mảng
        res.status(201).json({ message: "Đặt hàng thành công", order });
    } catch (error) {
        res.status(500).json({ error: "Lỗi lưu đơn hàng" });
    }
});

// GET: Lấy danh sách đơn hàng (Fix lỗi 404 trang Admin)
router.get("/", (req, res) => {
    res.json(orders.sort((a, b) => b.id - a.id));
});

// PATCH: Cập nhật trạng thái đơn hàng
router.patch("/:id", (req, res) => {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    orders = orders.map(o => o.id == id ? { ...o, status: status || o.status, paymentStatus: paymentStatus || o.paymentStatus } : o);
    res.json({ message: "Cập nhật thành công" });
});

module.exports = router;