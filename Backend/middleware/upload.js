
import multer from "multer";

const storage = multer.memoryStorage();

const limits = {
  fileSize: 5 * 1024 * 1024, // 5 MB
};
const upload = multer({ storage, limits });
export default upload;