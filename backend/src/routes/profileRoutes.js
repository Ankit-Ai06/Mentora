const express=require("express");
const router=express.Router();

const protect=
require("../middleware/authMiddleware");
const upload =
require("../middleware/uploadMiddleware");
const fileToDataUrl =
require("../utils/fileDataUrl");

const {
getProfile,
updateProfile,
getPublicProfile,
viewProfile
}=require("../controllers/profileController");

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

try{
const image=await fileToDataUrl(req.file);
res.json({image});
}catch(error){
res.status(400).json({
message:error.message||"Unable to upload image"
});
}

}
);
router.post(
"/upload-cover",
protect,
upload.single("image"),
async(req,res)=>{

try{
const image=await fileToDataUrl(req.file);
res.json({image});
}catch(error){
res.status(400).json({
message:error.message||"Unable to upload image"
});
}

}
);

module.exports=router;
