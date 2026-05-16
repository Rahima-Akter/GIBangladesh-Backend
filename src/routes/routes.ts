import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route";
import { productRoutes } from "../modules/product/product.route";
import { blogRoutes } from "../modules/blog/blog.route";
import { commentRoutes } from "../modules/comment/comment.route";
import { aiRoutes } from "../modules/aiLog/ai.route";
import { analyticsRoutes } from "../modules/analytics/analytics.route";

const route = Router();

route.use("/auth", authRoutes);
route.use("/products", productRoutes);
route.use("/blogs", blogRoutes);
route.use("/comments", commentRoutes);
route.use("/ai", aiRoutes);
route.use("/analytics", analyticsRoutes);

export const mainRoute = route;