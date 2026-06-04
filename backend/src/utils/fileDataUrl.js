const fs = require("fs");

const fileToDataUrl = async (file) => {
  if (!file?.path || !file?.mimetype) {
    throw new Error("Uploaded file is missing");
  }

  const buffer = await fs.promises.readFile(file.path);
  await fs.promises.unlink(file.path).catch(() => {});

  return `data:${file.mimetype};base64,${buffer.toString("base64")}`;
};

module.exports = fileToDataUrl;
