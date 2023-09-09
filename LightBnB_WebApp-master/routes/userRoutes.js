const express = require("express");
const bcrypt = require("bcrypt");
const database = require("../db/database");

const router = express.Router();

// Create a new user
router.post("/", (req, res) => {
  const user1 = req.body;
  user1.password = bcrypt.hashSync(user1.password, 12);
  database.getUserWithEmail(user1.email).then((user) => {
    if (user) {
      console.log("Email already registered");
      return res.send({ error: "Email already registered" });
    } else {
      database
        .addUser(user1)
        .then((user) => {
          if (!user) {
            return res.send({ error: "error" });
          }
          req.session.userId = user.id;
          res.send("🤗");
        })
        .catch((e) => res.send(e));
    }
  });
});

// Log a user in
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  database.getUserWithEmail(email).then((user) => {
    if (!user) {
      return res.send({ error: "no user with that id" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.send({ error: "error" });
    }

    req.session.userId = user.id;
    res.send({
      user: {
        name: user.name,
        email: user.email,
        id: user.id,
      },
    });
  });
});

// Log a user out
router.post("/logout", (req, res) => {
  req.session.userId = null;
  res.send({});
});

// Return information about the current user (based on cookie value)
router.get("/me", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.send({ message: "not logged in" });
  }

  database
    .getUserWithId(userId)
    .then((user) => {
      if (!user) {
        return res.send({ error: "no user with that id" });
      }

      res.send({
        user: {
          name: user.name,
          email: user.email,
          id: userId,
        },
      });
    })
    .catch((e) => res.send(e));
});

module.exports = router;
