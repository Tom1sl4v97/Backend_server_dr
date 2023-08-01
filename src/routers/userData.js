const express = require("express");
const router = express.Router();
const { admin } = require("../util/admin");

const db = admin.firestore();

const getUserData = async (email) => {
  try {
    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("email", "==", email).get();

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      return userData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

const createNewUser = async (user) => {
  try {
    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("email", "==", user.email).get();

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      const userId = userSnapshot.docs[0].id;

      if (userData) {
        await usersRef.doc(userId).update(user);
      }
    } else {
      await usersRef.add(user);
    }
  } catch (error) {
    throw ("Error creating new user:", error);
  }
};

router
  .route("/users")
  .get(async (req, res) => {
    const { email } = req.headers;

    console.log("Getting user data by email:", email);

    const userData = await getUserData(email);

    if (userData) {
      res.status(200).json(userData);
    } else {
      res.status(204).json({ message: "No content" });
    }
  })
  .post((req, res) => {
    const user = req.body;

    console.log("Creating user:", user);

    try {
      createNewUser(user);

      res.status(200).json({ message: "User created" });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  })
  .put((req, res) => {
    const user = req.body;

    console.log("Updating user:", user);

    try {
      createNewUser(user);

      res.status(200).json({ message: "User updated" });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  });

module.exports = router;
