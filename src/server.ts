import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import staffRoutes from "./routes/staffRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import { setupSwagger } from "./config/swagger";
import healthRoutes from "./routes/healthRoutes";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Swagger Setup
setupSwagger(app);

app.use("/auth", authRoutes);
app.use("/staff", staffRoutes);
app.use("/service", serviceRoutes);
app.use("/session", sessionRoutes);
app.use("/analytics/", analyticsRoutes);
app.use("/", healthRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))