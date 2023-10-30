const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    rating: { type: Number, min: 1, max: 5, require: true },
    comment: { type: String, require: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      require: true,
    },
  },
  { timestamps: true }
);

const orchidSchema = new Schema(
  {
    name: { type: String, require: true },
    image: { type: String, require: true },
    isNatural: { type: Boolean, default: false },
    origin: { type: String, require: true },
    comments: [commentSchema],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
      require: true,
    },
  },
  { timestamps: true }
);

var Orchids = mongoose.model("orchids", orchidSchema);

module.exports = Orchids;
