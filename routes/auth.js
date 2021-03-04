const router = require("express").Router();
const mongoose = require("mongoose");
const UserModel = require("../models/ModelUser");
const CircularJSON = require("circular-json");

router.post("/register", (req, res) => {
  res.send({ msg: "Registerd done successfull" });
});

router.post("/fbRegister", async (req, res) => {
  console.log(`req ${JSON.stringify(req.body)}`);

  UserModel.findOne({ email: req.body.email })
    .exec()
    .then((users) => {
      console.log(`users ${users}`);
      if (users.length <= 0) {
        console.log("not found");
        const newUser = new UserModel({ ...req.body });
        newUser.save().then(
          (suc) => {
            console.log(`user save ${suc}`);
            res.send({
              msg: "User created successfully",
              data: suc,
            });
          },
          (err) => {
            console.log(`user save err ${err}`);
            res.status(403).send({ msg: "Server Error Try again" });
          }
        );
      } else {
        console.log("not else");
        res.send({ msg: "User allready registered", data: users });
      }
    });
});
router.post("/gRegister", async (req, res) => {
  console.log(`req ${JSON.stringify(req.body)}`);

  UserModel.find({ email: req.body.email })
    .exec()
    .then((users) => {
      console.log(`users ${users}`);
      if (users.length <= 0) {
        console.log("not found");
        const newUser = new UserModel({ ...req.body });
        newUser.save().then(
          (suc) => {
            console.log(`user save ${suc}`);
            res.send({ msg: "User created successfully", data: { suc } });
          },
          (err) => {
            console.log(`user save err ${err}`);
            res.status(403).send({ msg: "Server Error Try again" });
          }
        );
      } else {
        console.log("not else");
        res.send({ msg: "User allready registered", data: { users } });
      }
    });
});

module.exports = router;
