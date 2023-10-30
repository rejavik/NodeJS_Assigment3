const Categories = require("../model/category");
const Orchids = require("../model/orchid");
class categoryController {
  index(req, res, next) {
    Categories.find({})
      .then((c) => {
        res.render("categoryPage", {
          title: "List Categories",
          categories: c,
          isLogin: { name: req.name, role: req.role },
        });
      })
      .catch(next);
  }
  create(req, res, next) {
    const dataNew = {
      categoryName: req.body.categoryName?.trim(),
    };
    const category = new Categories(dataNew);
    Categories.find({ categoryName: category.categoryName }).then(
      (categoryCheck) => {
        if (categoryCheck.length > 0) {
          req.flash("error_msg", "Duplicate category name!");
          res.redirect("/categories");
        } else {
          category
            .save()
            .then(() => res.redirect("/categories"))
            .catch(next);
        }
      }
    );
  }
  formEdit(req, res, next) {
    const categoryId = req.params.categoryId;
    Categories.findById(categoryId)
      .then((c) => {
        res.render("editCategory", {
          title: "Detail Category",
          category: c,
          isLogin: { name: req.name, role: req.role },
        });
      })
      .catch(next);
  }
  edit(req, res, next) {
    const dataNew = {
      categoryName: req.body.categoryName?.trim(),
    };
    Categories.updateOne({ _id: req.params.categoryId }, dataNew)
      .then(() => {
        return res.redirect("/categories");
      })
      .catch((err) => {
        console.log("error update: ", err);
        req.flash("error_msg", "Duplicate category name!");
        res.redirect(`/categorys/edit/${req.params.categoryId}`);
      });
  }
  delete(req, res, next) {
    Orchids.find({ category: req.params.categoryId })
      .populate("category")
      .then((data) => {
        if (data.length > 0) {
          req.flash(
            "error_msg",
            `You can not delete this category because it has already been connected with other Orchids`
          );
          return res.redirect("/categories");
        } else {
          Categories.findByIdAndDelete({ _id: req.params.categoryId })
            .then(() => res.redirect("/categories"))
            .catch(next);
        }
      })
      .catch(next);
  }
}
module.exports = new categoryController();
