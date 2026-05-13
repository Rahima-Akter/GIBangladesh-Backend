import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route";
import { productRoutes } from "../modules/product/product.route";

const route = Router();

route.use("/auth", authRoutes);
route.use("/product", productRoutes);
// route.use("/blog", require("./blog.route"));
// route.use("/comment", require("./comment.route"));

export const mainRoute = route;