const express = require("express");
const bodyParser = require("body-parser");
const userController = require("../controllers/userController");
const orchidsController = require("../controllers/orchidController");
const userRouter = express.Router();
const { ensureAuthenticated, jwtAuth } = require("../config/auth");

userRouter.use(bodyParser.json());
userRouter.route("/").get(userController.index).post(userController.regist);
userRouter
  .route("/change-password")
  .get(jwtAuth, userController.changePasswordIndex)
  .post(jwtAuth, userController.changePasswordHandle);
userRouter
  .route("/login")
  .get(userController.login)
  .post(userController.loginJWT);
userRouter.route("/logout").get(userController.logout);
userRouter.route("/dashboard").get(jwtAuth, orchidsController.dashboard);
userRouter
  .route("/edit")
  .get(jwtAuth, userController.formEdit)
  .post(jwtAuth, userController.edit);
module.exports = userRouter;
