const Post = require("../models/Post");

// ─── CREATE POST ──────────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Post content is required" });

    const post = await Post.create({
      user: req.user.id,
      content: content.trim(),
      image: image || "",
    });

    const populated = await post.populate("user", "fullName profilePicture profileImage role");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Post creation failed" });
  }
};

// ─── GET ALL POSTS (explore feed — OTHER users) ───────────────────
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: { $ne: req.user.id } })
      .populate("user", "fullName profilePicture profileImage role headline")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

// ─── GET MY POSTS (profile page) ──────────────────────────────────
const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .populate("user", "fullName profilePicture profileImage role headline")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your posts" });
  }
};

// ─── LIKE / UNLIKE ────────────────────────────────────────────────
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const likes = post.likes || [];
    const idx = likes.findIndex((id) => id.toString() === req.user.id);

    if (idx === -1) likes.push(req.user.id);
    else likes.splice(idx, 1);

    post.likes = likes;
    await post.save();
    res.json({ likes: post.likes.length, liked: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: "Failed to like post" });
  }
};

// ─── DELETE POST ──────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });
    await post.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete post" });
  }
};

module.exports = { createPost, getPosts, getMyPosts, likePost, deletePost };
