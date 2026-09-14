require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const routineRoutes = require("./routes/routine.routes");
const workoutRoutes = require("./routes/workouts.routes");
const exerciseRoutes = require("./routes/exercises.routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/routine", routineRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/exercises", exerciseRoutes);

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada." }));
app.use(errorHandler);

module.exports = app;
