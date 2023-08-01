const express = require("express");
const router = express.Router();
const { admin } = require("../util/admin");

const db = admin.firestore();

async function updatePageSettings(pageSettings) {
  try {
    await db
      .collection("pageSettings")
      .doc("pageSettings")
      .update(pageSettings);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function updateUsersRole(email) {
  try {
    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("email", "==", email).get();

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      const userId = userSnapshot.docs[0].id;

      if (userData) {
        await usersRef.doc(userId).update({ role: "moderator" });
      }
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    throw new Error(error);
  }
}

router
  .put("/pageSettings", async (req, res) => {
    const pageSettings = req.body;

    const success = await updatePageSettings(pageSettings);

    if (success) {
      res.status(200).send("Page settings updated successfully");
    } else {
      res.status(500).send("Something went wrong");
    }
  })
  .put("/newModerator", async (req, res) => {
    const { email } = req.body;

    try {
      await updateUsersRole(email);

      res.status(200).send("Moderator added successfully");
    } catch (error) {
      res.status(204).send(error.message);
    }
  });
module.exports = router;
