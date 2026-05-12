import { Router } from "express";

const route = Router();

route.use("/auth", require("./auth.route"));
route.use("/product", require("./product.route"));
route.use("/blog", require("./blog.route"));
route.use("/comment", require("./comment.route"));

export const mainRoute = route;