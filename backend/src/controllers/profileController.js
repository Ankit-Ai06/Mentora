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
  isConnected: false,
  requestSent: profile.requests?.some((id) => id.toString() === viewerId.toString()),
  requestReceived: false,
  mentorshipAvailable: profile.mentorshipAvailable,
  preferences: profile.preferences,
  isOnline: profile.isOnline,
  lastSeen: profile.lastSeen,
  canViewFullProfile: false,
});

const recordProfileView = async (profile, viewerId) => {
  if (!profile || profile._id.toString() === viewerId.toString()) return;

  const result = await User.updateOne(
    {
      _id: profile._id,
      profileViewers: { $ne: viewerId },
    },
    {
      $addToSet: { profileViewers: viewerId },
      $inc: { profileViews: 1 },
    }
  );

  if (result.modifiedCount > 0) {
    profile.profileViews = (profile.profileViews || 0) + 1;
    profile.profileViewers = [...(profile.profileViewers || []), viewerId];
  }
};

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
  mentorshipAvailable,
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
      mentorshipAvailable,
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
    const isConnected = isConnectedTo(profile, req.user.id);
    const currentUser = await User.findById(req.user.id).select("requests");
    const requestReceived = currentUser?.requests?.some(
      (id) => id.toString() === profile._id.toString()
    );
    const canViewFullProfile =
      isOwn || !profile.isPrivate || isConnected;

    await recordProfileView(profile, req.user.id);

    if (!canViewFullProfile) {
      return res.json({
        ...restrictedProfile(profile, req.user.id),
        requestReceived: !!requestReceived,
      });
    }

    const posts = await Post.find({ user: profile._id })
      .populate("user", "fullName profilePicture profileImage role headline")
      .populate("comments.user", "fullName profilePicture profileImage role")
      .sort({ createdAt: -1 });

    res.json({
      ...profile.toObject(),
      posts,
      canViewFullProfile: true,
      isConnected,
      requestSent: profile.requests?.some((id) => id.toString() === req.user.id),
      requestReceived: !!requestReceived,
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

    await recordProfileView(profile, req.user.id);

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
