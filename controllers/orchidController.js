const Orchids = require("../model/orchid");
const Categories = require("../model/category");
const Users = require("../model/user");
const jwt = require("jsonwebtoken");

class OrchidController {
  home(req, res, next) {
    var regex = null;
    var query = null;
    if (req.query.name) {
      regex = new RegExp(req.query.name, "i");
      query = {
        name: { $regex: regex },
      };
    }
    if (req.cookies.jwt) {
      jwt.verify(req.cookies.jwt, "my_secret_key", (err, decoded) => {
        if (err) {
          req.name = undefined;
          req.role = undefined;
          Categories.find({})
            .then((categories) => {
              Orchids.find(query)
                .populate("category", ["categoryName"])
                .then((orchids) => {
                  res.render("index", {
                    title: "List of Orchids",
                    orchids: orchids,
                    categoriesList: categories,
                    isLogin: { name: req.name, role: req.role },
                  });
                })
                .catch((err) => {
                  console.log(err);
                  next();
                });
            })
            .catch((err) => {
              console.log(err);
              next();
            });
        } else {
          req.userId = decoded.user.userId;
          req.name = decoded.user.name;
          req.role = decoded.user.role;
          Categories.find({})
            .then((categories) => {
              Orchids.find(query)
                .populate("category", ["categoryName"])
                .then((orchids) => {
                  res.render("index", {
                    title: "List of Orchids",
                    orchids: orchids,
                    categoriesList: categories,
                    isLogin: { name: req.name, role: req.role },
                  });
                })
                .catch((err) => {
                  console.log(err);
                  next();
                });
            })
            .catch((err) => {
              console.log(err);
              next();
            });
        }
      });
    } else {
      Categories.find({})
        .then((categories) => {
          Orchids.find(query)
            .populate("category", ["categoryName"])
            .then((orchids) => {
              res.render("index", {
                title: "List of Orchids",
                orchids: orchids,
                categoriesList: categories,
                isLogin: { name: req.name, role: req.role },
              });
            })
            .catch((err) => {
              console.log(err);
              next();
            });
        })
        .catch((err) => {
          console.log(err);
          next();
        });
    }
  }
  index = async function index(req, res, next) {
    const categories = await Categories.find();
    console.log("first", categories);
    Orchids.find({})
      .populate("category", ["categoryName"])
      .then((orchids) => {
        res.render("orchidSite", {
          title: "List of Orchids",
          orchids: orchids,
          categoriesList: categories,
          isLogin: { name: req.name, role: req.role },
        });
      })
      .catch((err) => {
        console.log(err);
        next();
      });
  };

  dashboard(req, res, next) {
    Promise.all([
      Orchids.countDocuments({}),
      Categories.countDocuments({}),
      Users.countDocuments({}),
    ])
      .then(([totalOrchids, totalCategories, totalUsers]) => {
        res.render("dashboard", {
          title: "Dashboard",
          totalOrchids: totalOrchids,
          totalCategories: totalCategories,
          totalUsers: totalUsers,
          isLogin: { name: req.name, role: req.role },
        });
      })
      .catch((err) => {
        console.log(err);
        next();
      });
  }

  create(req, res, next) {
    Categories.find({})
      .then((categories) => {
        if (categories.length === 0) {
          req.flash(
            "error_msg",
            "Please input data of Categories in Database first!!!"
          );
          return res.redirect("/Orchids");
        } else {
          var data = {
            name: req.body.name,
            image:
              req.file === undefined
                ? ""
                : `/images/Orchids/${req.file.originalname}`,
            origin: req.body.origin,
            category: req.body.category,
            isNatural: req.body.isNatural === undefined ? false : true,
          };
          const orchid = new Orchids(data);
          Orchids.find({ name: orchid.name }).then((orchidCheck) => {
            if (orchidCheck.length > 0) {
              req.flash("error_msg", "Duplicate orchid name!");
              res.redirect("/orchids");
            } else {
              orchid
                .save()
                .then(() => res.redirect("/orchids"))
                .catch(next);
            }
          });
        }
      })
      .catch((err) => {
        req.flash("error_msg", "Server Error");
        return res.redirect("/orchids");
      });
  }
  postComment(req, res, next) {
    const orchidId = req.params.orchidId;
    // Thêm comment mới
    var check = false;
    Orchids.findById(orchidId)
      .then((orchid) => {
        if (orchid.comments.length > 0) {
          for (var i = 0; i < orchid.comments.length; i++) {
            if (req.userId === orchid.comments[i].author.toString()) {
              check = true;
              req.flash(
                "error_msg",
                "You had already posted comment for this Orchid!"
              );
              res.redirect(`/orchids/${req.params.orchidId}`);
              return;
            }
          }
        }
        if (check === false) {
          const newComment = {
            rating: req.body.rating,
            comment: req.body.comment,
            author: req.userId, // Thay author_id_here bằng _id của người viết comment
          };
          // Sử dụng findOneAndUpdate để thêm comment vào orchid
          Orchids.findOneAndUpdate(
            { _id: orchidId },
            { $push: { comments: newComment } },
            { new: true }, // Trả về document mới sau khi cập nhật
            (err) => {
              if (err) {
                console.error("Error updating orchid:", err);
                req.flash("error_msg", "Post comment failed!");
                res.redirect(`/orchids/${req.params.orchidId}`);
              } else {
                req.flash("success_msg", "Post comment successfully!");
                res.redirect(`/orchids/${req.params.orchidId}`);
              }
            }
          );
        }
      })
      .catch((err) => {
        console.log(err);
        next();
      });

    // }
    // });
  }

  orchidDetail(req, res, next) {
    const orchidId = req.params.orchidId;
    if (req.cookies.jwt) {
      jwt.verify(req.cookies.jwt, "my_secret_key", (err, decoded) => {
        if (err) {
          req.name = undefined;
          req.role = undefined;
          Categories.find({})
            .then((categories) => {
              Orchids.findById(orchidId)
                .populate({
                  path: "comments",
                  populate: {
                    path: "author",
                    model: "users", // Đặt tên collection của model User
                  },
                })
                .populate("category", "categoryName")
                .then((orchid) => {
                  let count = 0,
                    total = 0;
                  if (orchid.comments.length > 0) {
                    for (let i = 0; i < orchid.comments.length; i++) {
                      count = count + 1;
                      total = total + orchid.comments[i].rating;
                    }
                  }
                  res.render("orchidDetail", {
                    title: "Detail of Orchid",
                    orchid: orchid,
                    categoriesList: categories,
                    isLogin: { name: req.name, role: req.role },
                    rating: total > 0 && count > 0 ? total / count : 0,
                    totalTimeRating: count,
                  });
                })
                .catch(next);
            })
            .catch(next);
        } else {
          req.userId = decoded.user.userId;
          req.name = decoded.user.name;
          req.role = decoded.user.role;
          Categories.find({})
            .then((categories) => {
              Orchids.findById(orchidId)
                .populate({
                  path: "comments",
                  populate: {
                    path: "author",
                    model: "users", // Đặt tên collection của model User
                  },
                })
                .populate("category", "categoryName")
                .then((orchid) => {
                  let count = 0,
                    total = 0;
                  if (orchid.comments.length > 0) {
                    for (let i = 0; i < orchid.comments.length; i++) {
                      count = count + 1;
                      total = total + orchid.comments[i].rating;
                    }
                  }
                  res.render("orchidDetail", {
                    title: "Detail of Orchid",
                    orchid: orchid,
                    // categoriesList: categories,
                    isLogin: { name: req.name, role: req.role },
                    rating: total > 0 && count > 0 ? total / count : 0,
                    totalTimeRating: count,
                  });
                })
                .catch(next);
            })
            .catch(next);
        }
      });
    } else {
      Categories.find({})
        .then((categories) => {
          Orchids.findById(orchidId)
            .populate({
              path: "comments",
              populate: {
                path: "author",
                model: "users", // Đặt tên collection của model User
              },
            })
            .populate("category", "categoryName")
            .then((orchid) => {
              let count = 0,
                total = 0;
              if (orchid.comments.length > 0) {
                for (let i = 0; i < orchid.comments.length; i++) {
                  count = count + 1;
                  total = total + orchid.comments[i].rating;
                }
              }
              res.render("orchidDetail", {
                title: "Detail of Orchid",
                orchid: orchid,
                categoriesList: categories,
                isLogin: { name: req.name, role: req.role },
                rating: total > 0 && count > 0 ? total / count : 0,
                totalTimeRating: count,
              });
            })
            .catch(next);
        })
        .catch(next);
    }
  }
  formEdit(req, res, next) {
    const orchidId = req.params.orchidId;
    Categories.find({})
      .then((categories) => {
        Orchids.findById(orchidId)
          .populate("category", "categoryName")
          .then((orchid) => {
            res.render("editorchid", {
              title: "Detail of Orchid",
              orchid: orchid,
              categoriesList: categories,
              isLogin: { name: req.name, role: req.role },
            });
          })
          .catch(next);
      })
      .catch(next);
  }
  edit(req, res, next) {
    var data;
    if (!req.file) {
      data = {
        name: req.body.name,
        origin: req.body.origin,
        category: req.body.category,
        isNatural: req.body.isNatural === undefined ? false : true,
      };
    } else {
      data = {
        name: req.body.name,
        image: `/images/Orchids/${req.file.originalname}`,
        origin: req.body.origin,
        category: req.body.category,
        isNatural: req.body.isNatural === undefined ? false : true,
      };
    }
    Orchids.updateOne({ _id: req.params.orchidId }, data)
      .then(() => {
        res.redirect("/orchids");
      })
      .catch((err) => {
        console.log("error update: ", err);
        req.flash("error_msg", "Duplicate orchid name!");
        res.redirect(`/orchids/edit/${req.params.orchidId}`);
      });
  }
  delete(req, res, next) {
    Orchids.findByIdAndDelete({ _id: req.params.orchidId })
      .then(() => res.redirect("/orchids"))
      .catch(next);
  }
}
module.exports = new OrchidController();
