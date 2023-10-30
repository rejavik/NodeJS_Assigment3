var express = require("express");
var router = express.Router();
const orchidController = require("../controllers/orchidController");
const User = require("../controllers/userController");
const { ensureAuthenticated, jwtAuth } = require("../config/auth");
const { requireRole } = require("../config/verifyRole");
const slug = require("slug");
/* GET home page. */
router.get("/", orchidController.home);
router.get("/accounts", jwtAuth, requireRole, User.listUsers);
router.get("/post/:slug", (req, res) => {
  const title = slug(req.params.slug, { lower: false });
  res.send(`Hello, you requested the post with slug: ${title}`);
});

module.exports = router;
