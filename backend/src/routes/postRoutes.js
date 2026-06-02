const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { createPost, getPosts, getMyPosts, likePost, deletePost } = require("../controllers/postController");

router.post("/", protect, createPost);
router.get("/", protect, getPosts);          // explore — other users' posts
router.get("/mine", protect, getMyPosts);    // profile — my posts
router.put("/like/:id", protect, likePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
