import { v2 as cloudinary } from "cloudinary";
import config from "../config";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

interface UploadResult {
  public_id: string;
  url: string;
  secure_url: string;
}

// Upload image to Cloudinary
const uploadToCloudinary = async (
  filePath: string,
  folder: string = "gi-bangladesh"
): Promise<UploadResult> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: "image",
      // Optional transformations
      transformation: [
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    // Clean up the local file after upload
    fs.unlinkSync(filePath);

    return {
      public_id: result.public_id,
      url: result.url,
      secure_url: result.secure_url,
    };
  } catch (error) {
    // Clean up the local file if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error("Failed to upload image to Cloudinary");
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Log the error but don't throw, as the main operation shouldn't fail
    console.error("Failed to delete image from Cloudinary:", error);
  }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // Cloudinary URL pattern: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    if (matches && matches[1]) {
      return matches[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Upload multiple images
const uploadMultipleToCloudinary = async (
  filePaths: string[],
  folder: string = "gi-bangladesh"
): Promise<UploadResult[]> => {
  try {
    const uploadPromises = filePaths.map((filePath) =>
      uploadToCloudinary(filePath, folder)
    );
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    // If any upload fails, clean up any remaining local files
    filePaths.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    throw new Error("Failed to upload images to Cloudinary");
  }
};

export {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
  uploadMultipleToCloudinary,
};