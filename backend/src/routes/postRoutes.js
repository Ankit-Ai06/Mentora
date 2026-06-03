const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
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
router.get("/", protect, getPosts);
router.get("/mine", protect, getMyPosts);
router.get("/user/:id", protect, getUserPosts);
router.put("/like/:id", protect, likePost);
router.post("/comment/:id", protect, commentPost);
router.delete("/:postId/comments/:commentId", protect, deleteComment);
router.post("/share/:id", protect, sharePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
