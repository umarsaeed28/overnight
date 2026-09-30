import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import authRoutes from "./routes/auth";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/orders";
import productRoutes from "./routes/products";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" },
  }),
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", authRoutes);

const port = Number(process.env.PORT ?? 4001);
app.listen(port, () => console.log(`ShopDemo API listening on ${port}`));

export default app;
