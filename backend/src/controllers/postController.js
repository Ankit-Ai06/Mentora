const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

const populatePost = (query) =>
  query
    .populate("user", "fullName profilePicture profileImage role headline")
    .populate("comments.user", "fullName profilePicture profileImage role")
    .populate("shares", "fullName");

const notifyPostOwner = async (post, senderId, type, text) => {
  if (post.user.toString() === senderId) return;

  await Notification.create({
    receiver: post.user,
    sender: senderId,
    type,
    text,
  });
};

// CREATE POST
const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: "Post content is required" });
    }

    const post = await Post.create({
      user: req.user.id,
      content: content.trim(),
      image: image || "",
    });

    const populated = await populatePost(Post.findById(post._id));
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Post creation failed" });
  }
};

// GET ALL VISIBLE POSTS
const getPosts = async (req, res) => {
  try {
    const viewer = await User.findById(req.user.id).select("connections");
    const visibleUserIds = [
      req.user.id,
      ...(viewer?.connections || []).map((id) => id.toString()),
    ];

    const publicUsers = await User.find({
      isPrivate: { $ne: true },
    }).select("_id");

    publicUsers.forEach((user) => {
      visibleUserIds.push(user._id.toString());
    });

    const posts = await populatePost(
      Post.find({
        user: {
          $ne: req.user.id,
          $in: [...new Set(visibleUserIds)],
        },
      }).sort({ createdAt: -1 })
    );

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const viewer = await User.findById(req.user.id).select("connections");
    const owner = await User.findById(req.params.id).select("isPrivate");

    if (!owner) {
      return res.status(404).json({ message: "User not found" });
    }

    const isOwn = req.user.id === req.params.id;
    const connected = viewer?.connections?.some(
      (id) => id.toString() === req.params.id
    );

    if (owner.isPrivate && !isOwn && !connected) {
      return res.status(403).json({ message: "This account is private" });
    }

    const posts = await populatePost(
      Post.find({ user: req.params.id }).sort({ createdAt: -1 })
    );

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

// GET MY POSTS
const getMyPosts = async (req, res) => {
  try {
    const posts = await populatePost(
      Post.find({ user: req.user.id }).sort({ createdAt: -1 })
    );

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your posts" });
  }
};

// LIKE / UNLIKE
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const likes = post.likes || [];
    const idx = likes.findIndex((id) => id.toString() === req.user.id);
    const liked = idx === -1;

    if (liked) {
      likes.push(req.user.id);
      await notifyPostOwner(post, req.user.id, "like", "liked your post");
    } else {
      likes.splice(idx, 1);
    }

    post.likes = likes;
    await post.save();

    const populated = await populatePost(Post.findById(post._id));
    res.json({ post: populated, likes: post.likes.length, liked });
  } catch (error) {
    res.status(500).json({ message: "Failed to like post" });
  }
};

const commentPost = async (req, res) => {
  try {
    const cleanText = req.body.text?.trim();
    if (!cleanText) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({
      user: req.user.id,
      text: cleanText,
    });

    await post.save();
    await notifyPostOwner(post, req.user.id, "comment", "commented on your post");

    const populated = await populatePost(Post.findById(post._id));
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Failed to comment on post" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const canDelete =
      comment.user.toString() === req.user.id ||
      post.user.toString() === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.deleteOne();
    await post.save();

    const populated = await populatePost(Post.findById(post._id));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

const sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!post.shares.some((id) => id.toString() === req.user.id)) {
      post.shares.push(req.user.id);
      await notifyPostOwner(post, req.user.id, "share", "shared your post");
    }

    await post.save();

    const populated = await populatePost(Post.findById(post._id));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Failed to share post" });
  }
};

// DELETE POST
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete post" });
  }
};

module.exports = {
  createPost,
  getPosts,
  getMyPosts,
  getUserPosts,
  likePost,
  commentPost,
  deleteComment,
  sharePost,
  deletePost,
};
