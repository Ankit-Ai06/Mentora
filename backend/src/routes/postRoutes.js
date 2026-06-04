const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const fileToDataUrl = require("../utils/fileDataUrl");
const {
  createPost,
  getPosts,
  getMyPosts,
  getUserPosts,
  likePost,
  commentPost,
  deleteComment,
  sharePost,
  deletePost,
} = require("../controllers/postController");

router.post("/", protect, createPost);
router.post("/upload-media", protect, upload.single("media"), async (req, res) => {
  try {
    const type = req.file.mimetype.startsWith("video/") ? "video" : "image";
    const url = await fileToDataUrl(req.file);

    res.json({
      url,
      type,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Unable to upload media",
    });
  }
});
router.get("/", protect, getPosts);
router.get("/mine", protect, getMyPosts);
router.get("/user/:id", protect, getUserPosts);
router.put("/like/:id", protect, likePost);
router.post("/comment/:id", protect, commentPost);
router.delete("/:postId/comments/:commentId", protect, deleteComment);
router.post("/share/:id", protect, sharePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
