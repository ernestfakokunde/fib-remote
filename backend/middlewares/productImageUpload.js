import multer from "multer";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 0 },
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error("Unsupported image type. Upload a JPEG, PNG, or WebP image."));
    }
    callback(null, true);
  },
}).single("image");

const hasValidImageSignature = (file) => {
  const bytes = file.buffer;
  if (file.mimetype === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.mimetype === "image/png") {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (file.mimetype === "image/webp") {
    return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
};

export const uploadProductImage = (req, res, next) => {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller."
        : error.code === "LIMIT_UNEXPECTED_FILE"
          ? "Upload one image using the 'image' field."
          : "Image upload was rejected.";
      return res.status(400).json({ success: false, message });
    }
    if (error) {
      return res.status(400).json({ success: false, message: error.message || "Invalid image upload." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "An image is required." });
    }
    if (!hasValidImageSignature(req.file)) {
      return res.status(400).json({ success: false, message: "The file contents do not match a supported JPEG, PNG, or WebP image." });
    }
    next();
  });
};
