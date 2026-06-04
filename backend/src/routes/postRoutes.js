const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
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

const uploadedMediaUrl = (req) =>
  `/uploads/${req.file.filename}`;

router.post("/", protect, createPost);
router.post("/upload-media", protect, upload.single("media"), (req, res) => {
  const type = req.file.mimetype.startsWith("video/") ? "video" : "image";
  res.json({
    url: uploadedMediaUrl(req),
    type,
  });
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
