const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

class CloudinaryService {
  async uploadImage(buffer, originalname) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "realestate",
          public_id: `property_${Date.now()}_${originalname.split(".")[0]}`,
          transformation: [
            { width: 1200, height: 800, crop: "fill" },
            { quality: "auto" }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id
            });
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  async deleteImage(public_id) {
    try {
      const result = await cloudinary.uploader.destroy(public_id);
      return result;
    } catch (error) {
      throw new Error("Failed to delete image from Cloudinary");
    }
  }

  async uploadMultipleImages(files) {
    try {
      const uploadPromises = files.map(file => 
        this.uploadImage(file.buffer, file.originalname)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new Error("Failed to upload multiple images");
    }
  }
}

module.exports = new CloudinaryService();