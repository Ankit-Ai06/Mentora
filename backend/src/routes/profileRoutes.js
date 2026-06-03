const express=require("express");
const router=express.Router();

const protect=
require("../middleware/authMiddleware");
const upload =
require("../middleware/uploadMiddleware");

const {
getProfile,
updateProfile,
getPublicProfile,
viewProfile
}=require("../controllers/profileController");

const uploadedImageUrl = (req) =>
`${process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`}/uploads/${req.file.filename}`;

router.get("/",protect,getProfile);

router.put("/",protect,updateProfile);

router.get("/:id",protect,getPublicProfile);

router.post(
"/view/:id",
protect,
viewProfile
);
router.post(
"/upload-profile",
protect,
upload.single("image"),
async(req,res)=>{

res.json({
image:
uploadedImageUrl(req)
});

}
);
router.post(
"/upload-cover",
protect,
upload.single("image"),
async(req,res)=>{

res.json({
image:
uploadedImageUrl(req)
});

}
);

module.exports=router;
