import multer from "multer";
import path from "path";

// Configure disk storage
const storage = multer.diskStorage({
  // Folder to save uploaded files
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // ensure this folder exists
  },

  // Filename format
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname)); // keep original extension
  },
});

// File filter (accept only images)
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// ✅ Create and export multer instance with limits for multiple files
export const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 5 // Maximum 5 files at once
  }
});