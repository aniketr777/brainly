import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";



cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadPdf = async (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const fileName = originalName.split(".").slice(0, -1).join(".");
    const public_id = `documents/${fileName}-${Date.now()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: public_id,
      },
      (error, result) => {
        if (error) {
          console.error(" Cloudinary stream upload error:", error);
          return reject(error);
        }
        if (result) {
          console.log(" PDF uploaded successfully via stream to Cloudinary");
          resolve(result);
        } else {
          // This case handles unexpected situations where there's no error but also no result
          reject(
            new Error("Cloudinary upload failed without returning a result.")
          );
        }
      }
    );

    // Create a readable stream from the buffer and pipe it to Cloudinary
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

export default uploadPdf;
