const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const Schema = mongoose.Schema;
const categorySchema = new Schema(
  { categoryName: String },
  { timestamps: true }
);
var categories = mongoose.model("categories", categorySchema);

module.exports = categories;
