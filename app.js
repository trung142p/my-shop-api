require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import đủ 3 Routes
const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
    res.send("Server vẫn đang sống khỏe mạnh!");
});

// Đăng ký đủ 3 Routes
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);

app.use((req, res) => {
    res.status(404).send("Đường dẫn này không tồn tại trên Server!");
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});