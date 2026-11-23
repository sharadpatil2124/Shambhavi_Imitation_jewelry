import multer from 'multer';
import path from 'path';
import fs from 'fs';
import imagekit from '../config/imagekit.js';

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  }
});

export const uploadToImageKit = async (filePath, folder = '/sambhavi-imitation') => {
  const removeTempFile = () => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  };

  if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY) {
    // Local development only: serve from the uploads folder. In production that folder can be wiped
    // by a redeploy, so images saved there would break later.
    if (process.env.NODE_ENV === 'production') {
      removeTempFile();
      throw new Error('Image upload is not configured on the server (ImageKit keys are missing). Please contact the site administrator.');
    }
    console.warn('⚠️  ImageKit keys missing. Falling back to local static URL paths (development only).');
    return `/${filePath.replace(/\\/g, '/')}`;
  }

  try {
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

    const result = await imagekit.files.upload({
      file: fileStream,
      fileName: fileName,
      folder: folder,
      tags: ['sambhavi-imitation']
    });

    removeTempFile();

    return result.url;
  } catch (error) {
    // Report the failure instead of silently saving to temporary disk.
    console.error(`❌ ImageKit Upload Error: ${error.message}`);
    removeTempFile();
    throw new Error('Image upload failed. Please try again in a moment.');
  }
};

export const uploadToCloudinary = uploadToImageKit;
