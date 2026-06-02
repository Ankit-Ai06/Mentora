const express=require("express");
const router=express.Router();

const protect=
require("../middleware/authMiddleware");
const upload =
require("../middleware/uploadMiddleware");

const {
getProfile,
updateProfile,
viewProfile
}=require("../controllers/profileController");

router.get("/",protect,getProfile);

router.put("/",protect,updateProfile);

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
`http://localhost:5000/uploads/${req.file.filename}`
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
`${process.env.BACKEND_URL}/uploads/${req.file.filename}`
});

}
);

module.exports=router;