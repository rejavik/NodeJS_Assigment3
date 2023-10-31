const bcrypt = require("bcrypt");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

class userController {
  index(req, res, next) {
    res.render("register");
  }
  listUsers(req, res, next) {
    User.find({})
      .then((users) => {
        res.render("accounts", {
          title: "The list of Users",
          users: users,
          isLogin: { name: req.name, role: req.role },
        });
      })
      .catch(next);
  }

  regist(req, res, next) {
    const { username, password } = req.body;
    let errors = [];
    if (!username || !password) {
      errors.push({ msg: "Please enter all fields" });
    }
    if (password.length < 6) {
      errors.push({ msg: "Password must be at least 6 characters" });
    }
    if (errors.length > 0) {
      res.render("register", {
        errors,
        username,
        password,
      });
    } else {
      User.findOne({ username: username }).then((user) => {
        if (user) {
          errors.push({ msg: "Username already exists" });
          res.render("register", {
            errors,
            username,
            password,
          });
        } else {
          const email_temp = `${username}@gmail.com`;
          const newUser = new User({
            username,
            password,
            email: email_temp,
          });
          //Hash password
          bcrypt.hash(newUser.password, 10, function (err, hash) {
            if (err) {
              console.log(err);
              throw err;
            }
            newUser.password = hash;
            newUser
              .save()
              .then((user) => {
                res.redirect("/users/login");
              })
              .catch((error) => {
                console.log(error);
                next();
              });
          });
        }
      });
    }
  }

  changePasswordIndex(req, res, next) {
    res.render("changePassword", {
      title: "Dashboard",
      isLogin: { name: req.name, role: req.role },
    });
  }
  changePasswordHandle(req, res, next) {
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
    if (currentPassword.length < 6) {
      req.flash("error_msg", "Current password must be at least 6 characters!");
      return res.redirect("/users/change-password");
    }
    if (newPassword.length < 6) {
      req.flash("error_msg", "New password must be at least 6 characters!");
      return res.redirect("/users/change-password");
    }
    if (confirmPassword.length < 6) {
      req.flash("error_msg", "Confirm password must be at least 6 characters!");
      return res.redirect("/users/change-password");
    }
    if (currentPassword === newPassword) {
      req.flash(
        "error_msg",
        "Current password is duplicated with New Password!"
      );
      return res.redirect("/users/change-password");
    }
    if (newPassword !== confirmPassword) {
      req.flash("error_msg", "Confirm Password not match with New Password!");
      return res.redirect("/users/change-password");
    }
    User.findById(req.userId)
      .then((user) => {
        //Check password
        bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
          if (err) {
            console.log(err);
            req.flash("error_msg", "Error compare password!");
            return res.redirect("/users/change-password");
          }
          if (isMatch) {
            bcrypt.hash(newPassword, 10, function (err, hash) {
              if (err) {
                console.log(err);
                req.flash("error_msg", "Hash password failed!");
                return res.redirect("/users/change-password");
              }
              User.findByIdAndUpdate({ _id: req.userId }, { password: hash })
                .then(() => {
                  res.clearCookie("jwt");
                  req.flash("success_msg", "Update password successfully!");
                  res.redirect("/");
                })
                .catch((err) => {
                  console.log(err);
                  req.flash("error_msg", "Update failed!");
                  return res.redirect("/users/change-password");
                });
            });
          } else {
            req.flash("error_msg", "Current password is incorrect!");
            return res.redirect("/users/change-password");
          }
        });
      })
      .catch((err) => {
        console.log(err);
        return res.redirect("/users/change-password");
      });
  }
  login(req, res, next) {
    if (req.cookies.jwt) {
      const token = req.cookies.jwt;
      jwt.verify(token, "my_secret_key", (err, decoded) => {
        if (err) {
          req.flash("error_msg", err.message);
          return res.render("login");
        } else {
          if (decoded.user.role === "admin")
            return res.redirect("/users/dashboard");
          else return res.redirect("/");
        }
      });
    } else {
      return res.render("login");
    }
  }

  dashboard(req, res, next) {
    res.render("dashboard", {
      title: "Dashboard",
      isLogin: { name: req.name, role: req.role },
    });
  }

  signout(req, res, next) {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      req.flash("success_msg", "You are logged out");
      //  res.clearCookie('jwt');
      res.redirect("/users/login");
    });
  }
  //update user
  formEdit(req, res, next) {
    const userId = req.userId;
    console.log(userId);
    User.findById(userId)
      .then((user) => {
        console.log(user);
        res.render("profile", {
          title: "The detail of User",
          user: user,
          isLogin: { name: req.name, role: req.role },
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
  edit(req, res, next) {
    var data = {
      name: req.body.name,
      email: req.body.email,
      YOB: req.body.yob,
    };
    User.updateOne({ _id: req.userId }, data)
      .then(() => {
        try {
          const decodedToken = jwt.verify(req.cookies.jwt, "my_secret_key");
          const now = Math.floor(Date.now() / 1000);
          console.log(decodedToken);
          const expiresIn = decodedToken.exp - now;
          console.log(`JWT will expire in ${expiresIn} seconds`);
          console.log(`${expiresIn}s`);
          const new_token = jwt.sign(
            {
              user: {
                userId: decodedToken.user.userId,
                name: req.body.name,
                role: decodedToken.user.role,
              },
            },
            "my_secret_key",
            {
              expiresIn: `${expiresIn}s`,
            }
          );
          const decodedToken2 = jwt.verify(new_token, "my_secret_key");
          console.log("2 : ", decodedToken2);
          const expiresIn2 = decodedToken.exp - now;
          console.log(`JWT will expire in ${expiresIn2} seconds`);
          res.clearCookie("jwt");
          res.cookie("jwt", new_token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
          });
        } catch (err) {
          console.error("Failed to verify JWT", err);
        }
        req.flash("success_msg", "Updated successfully!");
        res.redirect(`/users/edit`);
      })
      .catch((err) => {
        req.flash("error_msg", err);
        res.redirect(`/users/edit`);
      });
  }
  loginJWT(req, res, next) {
    const userName = req.body.userName;
    const password = req.body.password;
    User.findOne({ username: userName })
      .then((user) => {
        if (!user) {
          req.flash("error_msg", "This account is not exist!");
          return res.redirect("/users/login");
        }
        //Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            const token = jwt.sign(
              {
                user: {
                  userId: user._id.toString(),
                  name: user.name,
                  role: user.isAdmin === true ? "admin" : "user",
                },
              },
              "my_secret_key",
              {
                expiresIn: "30m",
              }
            );
            res.cookie("jwt", token, {
              httpOnly: true,
              secure: true,
              maxAge: 24 * 60 * 60 * 1000,
            });
            if (user.isAdmin === true) {
              console.log("zo admin");
              return res.redirect("/users/dashboard");
            } else {
              return res.redirect("/");
            }
          } else {
            req.flash("error_msg", "Password is incorrect!");
            return res.redirect("/users/login");
          }
        });
      })
      .catch((err) => console.log(err));
  }
  logout(req, res, next) {
    res.clearCookie("jwt");
    req.flash("success_msg", "You are logged out");
    res.redirect("/");
  }
}
module.exports = new userController();
