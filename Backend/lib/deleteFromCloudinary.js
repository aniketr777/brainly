import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});


const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error("Public ID is required for deletion.");
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });

    console.log(`Resource '${publicId}' deleted from Cloudinary.`);
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);

    throw error;
  }
};

export default deleteFromCloudinary;
