const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const boardRoutes = require("./routes/board");
const authMiddleware = require("./middleware/auth");

const app = express();

const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  
  app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(process.env.mongoURL);

app.get("/", (req, res) => {
  const randomNumber = Math.random();
  res.status(200).json({ random: randomNumber });
});

app.use("/api/auth", authRoutes);
app.use("/api/board", authMiddleware, boardRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
