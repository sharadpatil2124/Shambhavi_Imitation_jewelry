import multer from 'multer';
import path from 'path';
import fs from 'fs';
import imagekit from '../config/imagekit.js';

// Ensure uploads folder exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

// File validation filter (Images only)
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|avif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (jpg, jpeg, png, webp, avif) are allowed'));
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max file size limit: 5MB
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Resilient ImageKit Upload Service
export const uploadToImageKit = async (filePath, folder = '/sambhavi-imitation') => {
  try {
    // If ImageKit keys are not configured, simulate local server upload paths
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY) {
      console.warn('⚠️  ImageKit keys missing. Falling back to local static URL paths.');
      const absolutePath = filePath.replace(/\\/g, '/');
      return `/${absolutePath}`; // Fallback local URL
    }

    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

    const result = await imagekit.files.upload({
      file: fileStream,
      fileName: fileName,
      folder: folder,
      tags: ['sambhavi-imitation']
    });

    // Delete temp file from local system
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.url;
  } catch (error) {
    console.error(`❌ ImageKit Upload Error: ${error.message}`);
    // Safe fallback to avoid breaking requests
    const absolutePath = filePath.replace(/\\/g, '/');
    return `/${absolutePath}`;
  }
};

// Keep backward-compatible alias
export const uploadToCloudinary = uploadToImageKit;
