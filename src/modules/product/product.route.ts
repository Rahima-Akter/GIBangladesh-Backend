import { Router } from "express";
import { productController } from "./product.controller";
import validateRequest from "../../middlewares/validateRequest";
import {
  auth,
  optionalAuth,
  restrictTo,
} from "../../middlewares/auth.middleware";
import { uploadSingle } from "../../middlewares/upload.middleware";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from "./product.validation";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// PUBLIC ROUTES (No auth required)
router.get(
  "/",
  optionalAuth,
  validateRequest(productQuerySchema),
  productController.getAllProducts,
);

router.get("/categories", productController.getProductCategories);

router.get("/:productId", optionalAuth, productController.getProductById);

// AUTHENTICATED USER ROUTES (Any logged-in user)
router.post("/:productId/like", auth, productController.likeProduct);
router.post("/:productId/dislike", auth, productController.disLikeProduct);
router.post("/:productId/flag", auth, productController.flagProduct);

// ADMIN & SUPER_ADMIN ONLY ROUTES
router.post(
  "/",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  uploadSingle, // Handle file upload
  validateRequest(createProductSchema),
  productController.createProduct,
);

router.patch(
  "/:productId",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  uploadSingle, // Handle file upload (optional)
  validateRequest(updateProductSchema),
  productController.updateProduct,
);

router.delete(
  "/:productId",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  productController.deleteProduct,
);

export const productRoutes = router;
