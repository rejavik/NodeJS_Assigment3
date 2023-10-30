const express = require("express");
const categoryRouter = express.Router();
const bodyParser = require("body-parser");
const categoryController = require("../controllers/categoryController");
const { ensureAuthenticated, jwtAuth } = require("../config/auth");
const { requireRole } = require("../config/verifyRole");
categoryRouter.use(bodyParser.json());
categoryRouter
  .route("/")
  .get(jwtAuth, requireRole, categoryController.index)
  .post(jwtAuth, requireRole, categoryController.create);
categoryRouter
  .route("/edit/:categoryId")
  .get(jwtAuth, requireRole, categoryController.formEdit)
  .post(jwtAuth, requireRole, categoryController.edit);
categoryRouter
  .route("/delete/:categoryId")
  .get(jwtAuth, requireRole, categoryController.delete);

module.exports = categoryRouter;
