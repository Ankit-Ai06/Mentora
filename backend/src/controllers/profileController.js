const User = require("../models/User");
const Post = require("../models/Post");

const isConnectedTo = (profile, viewerId) =>
  profile.connections?.some((id) => id.toString() === viewerId.toString());

const restrictedProfile = (profile, viewerId) => ({
  _id: profile._id,
  fullName: profile.fullName,
  role: profile.role,
  headline: profile.headline,
  location: profile.location,
  profilePicture: profile.profilePicture,
  profileImage: profile.profileImage,
  coverPicture: profile.coverPicture,
  coverImage: profile.coverImage,
  isPrivate: profile.isPrivate,
  profileViews: profile.profileViews,
  connections: profile.connections,
  requestSent: profile.requests?.some((id) => id.toString() === viewerId.toString()),
  canViewFullProfile: false,
});

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const {
  profilePicture,
  coverPicture,
  profileImage,
  coverImage,
  about,
  headline,
  location,
  skills,
  education,
  experience,
  achievements,
  github,
  linkedin,
  socialLinks,
  isPrivate,
  preferences,
} = req.body;

const updatedUser =
  await User.findByIdAndUpdate(
    req.user.id,
    {
      profilePicture,
      coverPicture,
      profileImage,
      coverImage,
      about,
      headline,
      location,
      skills,
      education,
      experience,
      achievements,
      github,
      linkedin,
      socialLinks,
      isPrivate,
      preferences,
    },
    {
      new: true,
      runValidators: true,
      omitUndefined: true,
    }
  ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const profile = await User.findById(req.params.id)
      .select("-password");

    if (!profile) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isOwn = profile._id.toString() === req.user.id;
    const canViewFullProfile =
      isOwn || !profile.isPrivate || isConnectedTo(profile, req.user.id);

    if (!isOwn) {
      profile.profileViews = (profile.profileViews || 0) + 1;
      await profile.save();
    }

    if (!canViewFullProfile) {
      return res.json(restrictedProfile(profile, req.user.id));
    }

    const posts = await Post.find({ user: profile._id })
      .populate("user", "fullName profilePicture profileImage role headline")
      .sort({ createdAt: -1 });

    res.json({
      ...profile.toObject(),
      posts,
      canViewFullProfile: true,
      requestSent: profile.requests?.some((id) => id.toString() === req.user.id),
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

// PROFILE VIEW
const viewProfile = async (req, res) => {
  try {
    const profile =
      await User.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    profile.profileViews =
      (profile.profileViews || 0) + 1;

    await profile.save();

    res.json({
      success: true,
      profileViews:
        profile.profileViews,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update views",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile,
  viewProfile,
};
