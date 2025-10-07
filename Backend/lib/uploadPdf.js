import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";



cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Function to upload PDF to Cloudinary
const uploadPdf = async (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const fileName = originalName.split(".").slice(0, -1).join(".");
    const public_id = `documents/${fileName}-${Date.now()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto", // keeps PDFs as raw files
        public_id,
      },
      (error, result) => {
        if (error) {
          console.error("Upload error:", error);
          return reject(error);
        }
        console.log("✅ Upload success:", {
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
        resolve(result);
      }
    );

    // Pipe the file buffer into Cloudinary
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

// Function to generate a thumbnail URL from PDF
const getPdfThumbnailUrl = (publicId) => {
  const url = cloudinary.url(`${publicId}.jpg`, {
    secure: true,
    transformation: [
      { width: 300, height: 150, crop: "fill" },
      { quality: "auto" },
    ],
  });
  console.log("🔗 Generated thumbnail URL:", url);
  return url;
};

export default {uploadPdf , getPdfThumbnailUrl} ;


