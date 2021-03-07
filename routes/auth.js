const router = require("express").Router();
const mongoose = require("mongoose");
const UserModel = require("../models/ModelUser");
var jwt = require("jsonwebtoken");

router.post("/register", (req, res) => {
  console.log(`email register ${JSON.stringify(req.body)}`);
  UserModel.findOne({ email: req.body.email })
    .exec()
    .then(async (users) => {
      console.log(`users ${users}`);
      if (!users) {
        console.log("not found");

        const newUser = new UserModel({ ...req.body });

        newUser.save().then(
          async (suc) => {
            console.log(`user save ${suc}`);
            const data = {
              id: suc._id,
              email: suc.email,
              name: suc.name,
              signUpType: suc.signUpType,
            };
            const token = await jwt.sign(
              JSON.stringify(data),
              process.env.SECRET
            );
            res.send({
              msg: "User created successfully",
              token: token,
            });
          },
          (err) => {
            console.log(`user save err ${err}`);
            res.status(403).send({ msg: "Server Error Try again" });
          }
        );
      } else {
        console.log("not else");
        const data = {
          id: users._id,
          email: users.email,
          name: users.name,
          signUpType: users.signUpType,
        };
        const token = await jwt.sign(JSON.stringify(data), process.env.SECRET);
        res.send({ msg: "User allready registered", token: token });
      }
    });
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
