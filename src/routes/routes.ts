import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route";
import { productRoutes } from "../modules/product/product.route";
import { blogRoutes } from "../modules/blog/blog.route";

const route = Router();

route.use("/auth", authRoutes);
route.use("/products", productRoutes);
route.use("/blogs", blogRoutes);
// route.use("/comment", require("./comment.route"));

export const mainRoute = route;