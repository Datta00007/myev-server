const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
require("../db/conn");
const User = require("../model/userSchema");
const Usercont = require("../model/userMessage");
const CryptoJS = require("crypto-js");
// const authenticate = require("../middleware/authenticate.jsx");
const Authenticate = require("../middleware/authenticate.jsx");

router.get("/", (req, res) => {
  res.send("index page should be here from router");
});

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

var cors = require("cors");
router.use(cors());

//async
router.post("/register", async (req, res) => {
  let { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(422).json({ error: "plz fill properly" });
  }

  try {
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      return res.status(422).json({ error: "email already exist" });
    }
    //hashing 32bit password
    console.log("Inside registration");
    console.log(password);
    const secretPass = "XkhZG4fW2t2W";
    const encrdata = CryptoJS.AES.encrypt(
      JSON.stringify(password),
      secretPass
    ).toString();
    password = encrdata;
    console.log(password);
    const user = new User({ name, email, phone, password });

    const userContact = await user.save();
    if (userContact) {
      res.status(201).json({ message: "user registered successfully" });
    } else {
      res.status(500).json({ error: "failed to register" });
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/favourites", async (req, res) => {
  const { id, email } = req.body;
  // console.log(id);
  try {
    const record = await User.count({
      email: email,
      favourited: { $in: [id] },
    });

    if (record == 0) {
      const r = await User.updateOne(
        { email: email },
        { $push: { favourited: id } }
      );
      return res.json({ effect: record });
    } else {
      const r = await User.updateOne(
        { email: email },
        { $pull: { favourited: id } }
      );
      return res.json({ effect: record });
    }
  } catch (err) {
    // console.log(err);
  }
  res.json({ message: "Updated" });
});

router.post("/checkfavourites", async (req, res) => {
  const { id, email } = req.body;
  // console.log(id);
  try {
    const record = await User.count({
      email: email,
      favourited: { $in: [id] },
    });

    return res.json({ effect: record });
  } catch (err) {
    // console.log(err);
  }
  res.json({ message: "Updated" });
});

router.post("/gotofavourites", async (req, res) => {
  const { email } = req.body;
  // console.log(email);
  try {
    const record = await User.findOne({ email: email });
    // console.log(record.favourited.length);
    if (record.favourited.length != 0) {
      return res.json(record.favourited);
    }
  } catch (err) {
    // console.log(err);
  }
  res.json([]);
});

router.post("/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: "plz fill properly" });
  } else {
    // const userExist = await User.findOne({email: email});

    // if (userExist) {
    //     return res.status(422).json({ error: "email already exist" });
    // }

    const user = new Usercont({ name, email, phone, message });

    const userContact = await user.save();
    if (userContact) {
      res.status(200).json({ message: "submitted successfully" });
    } else {
      res.status(500).json({ error: "failed to submit" });
    }
  }
});

router.post("/signin", async (req, res) => {
  // console.log(req.body);
  let Name = null;
  let Phone = null;
  try {
    let token;
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "plz fll the data" });
    }
    // console.log("Inside login");
    // console.log(password);
    const secretPass = "XkhZG4fW2t2W";
    const userLogin = await User.findOne({ email: email });
    if (userLogin) {
      const { name, phone } = userLogin;
      const bytes = CryptoJS.AES.decrypt(userLogin.password, secretPass);
      const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      // console.log(data)
      if (password === data) {
        Name = name;
        Phone = phone;
        token = await userLogin.generateAuthToken();
        // console.log(token);
        exp =
          "token=" + token + "expires=" + new Date(Date.now + 4) + ";path=/";
        res.cookie("jwtoken", exp); /*{
        expires: new Date(Date.now + 1800000),
        httpOnly: true,
      }*/

        if (token) {
          res.json({
            message: "logged in successfully",
            email: email,
            name: Name,
            phone: Phone,
          });
        }
      } else {
        res.status(400).json({ error: "Wrong password" });
      }
      // console.log(email);

      // console.log(name);
      // console.log(phone);
    } else {
      res.status(400).json({ error: "invalid credentials" });
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/rating", async (req, res) => {
  // console.log(req.body);
  const { email, vehicleId, givenRating } = req.body;
  // console.log(email, vehicleId, givenRating);
  const userRating = await User.findOne({ email: email });
  //   console.log(userRating);
  if (userRating) {
    try {
      const p = await User.updateOne(
        { email: email },
        { $pull: { rating: { id: vehicleId } } }
      );
      const r = await User.updateOne(
        { email: email },
        { $push: { rating: { id: vehicleId, rate: givenRating } } }
      );
      // console.log(r);
    } catch (err) {
      // console.log(err);
      res.status(422).json({ error: "Plz fill the field properly" });
    }
  }
});

router.get("/about", (req, res) => {
  // console.log("hello about page");
  res.send(req.rootUser);
});

router.get("/logout", (req, res) => {
  // console.log("hello about page");
  res.clearCookie("jwtoken", { path: "/" });
  res.status(200).send("logged out");
});

module.exports = router;
