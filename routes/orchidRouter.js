const express = require("express");
const bodyParser = require("body-parser");
const OrchidController = require("../controllers/orchidController");
const multer = require("multer");
const { ensureAuthenticated, jwtAuth } = require("../config/auth");
const { requireRole } = require("../config/verifyRole");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/Orchids/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});

const upload = multer({ storage: storage });
const orchidRouter = express.Router();
orchidRouter.use(bodyParser.json());
orchidRouter
  .route("/")
  .get(jwtAuth, requireRole, OrchidController.index)
  .post(jwtAuth, requireRole, upload.single("file"), OrchidController.create);
orchidRouter
  .route("/edit/:orchidId")
  .get(jwtAuth, requireRole, OrchidController.formEdit)
  .post(jwtAuth, requireRole, upload.single("file"), OrchidController.edit);
orchidRouter
  .route("/:orchidId")
  .get(OrchidController.orchidDetail)
  .post(jwtAuth, OrchidController.postComment);
orchidRouter
  .route("/delete/:orchidId")
  .get(jwtAuth, requireRole, OrchidController.delete);
module.exports = orchidRouter;
