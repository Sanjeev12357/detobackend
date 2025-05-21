const express = require("express");
const profileRouter = express.Router();
const bcrypt = require("bcrypt");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;

    res.send(user);
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid Edit Request");
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();

    res.json({
      message: `${loggedInUser.firstName}, your profile updated successfuly`,
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

profileRouter.patch("/profile/editPassword",userAuth,async(req,res)=>{
    try{
        const {oldPassword,newPassword}=req.body;
        const loggedInUser=req.user;
        const isPasswordValid=await loggedInUser.validatePassword(oldPassword);
        if(!isPasswordValid){
            throw new Error("Invalid Password");
        }
        loggedInUser.password=await bcrypt.hash(newPassword, 10);
        await loggedInUser.save();
        res.json({
            message:`${loggedInUser.firstName}, your password updated successfully!`
        });

    }catch(err){
        res.status(400).send("ERROR : " + err.message);
    }
})

module.exports = profileRouter;