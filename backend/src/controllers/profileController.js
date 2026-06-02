const User = require("../models/User");

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

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
  about,
  headline,
  location,
  skills,
  education,
  experience,
  achievements,
  github,
  linkedin,
} = req.body;

const updatedUser =
  await User.findByIdAndUpdate(
    req.user.id,
    {
      profilePicture,
      coverPicture,
      about,
      headline,
      location,
      skills,
      education,
      experience,
      achievements,
      github,
      linkedin,
    },
    {
      new: true,
      runValidators: true,
    }
  );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
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
  viewProfile,
};