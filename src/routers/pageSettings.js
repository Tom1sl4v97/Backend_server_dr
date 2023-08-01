const express = require("express");
const router = express.Router();
const { admin } = require("../util/admin");

const db = admin.firestore();

async function getPageSettings() {
  try {
    const pageSettingsRef = db.collection("pageSettings");
    const pageSettingsSnapshot = await pageSettingsRef.get();

    if (!pageSettingsSnapshot.empty) {
      const pageSettingsData = pageSettingsSnapshot.docs[0].data();

      if (pageSettingsData) {
        return pageSettingsData;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting page settings:", error);
    return null;
  }
}

router.get("/pageSettings", async (req, res) => {
  try {
    console.log("Getting page settings...");

    const pageSettings = await getPageSettings();


    if (pageSettings !== null) {
      res.status(200).json(pageSettings);
    } else {
      res.status(404).json({ message: "Page settings not found." });
    }
  } catch (error) {
    console.error("Error getting page settings:", error);
    res.status(500).json({ message: "Error getting page settings." });
  }
});
module.exports = router;
