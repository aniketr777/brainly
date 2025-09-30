import multer from "multer";


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "temp_audio_uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
