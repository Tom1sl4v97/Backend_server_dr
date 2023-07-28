const express = require("express");
const router = express.Router();
const { admin } = require("../util/admin");

const db = admin.firestore();

const updatePageStatistics = async (batchData) => {
  try {
    const batch = db.batch();

    for (const data of batchData) {
      const { postID, counter } = data;

      const pageStatisticsRef = db
        .collection("pageStatistics")
        .where("postID", "==", postID);
      const pageStatisticsSnapshot = await pageStatisticsRef.get();

      if (!pageStatisticsSnapshot.empty) {
        const pageStatisticsData = pageStatisticsSnapshot.docs[0].data();
        const pageStatisticsId = pageStatisticsSnapshot.docs[0].id;

        if (pageStatisticsData) {
          const pageStatisticsDocRef = db
            .collection("pageStatistics")
            .doc(pageStatisticsId);
          batch.update(pageStatisticsDocRef, {
            views: pageStatisticsData.views + counter,
          });
        }
      } else {
        const pageStatisticsDocRef = db.collection("pageStatistics").doc();
        batch.set(pageStatisticsDocRef, { postID: postID, views: counter });
      }
    }

    await batch.commit();

    console.log("Batch zahtev uspešno izvršen.");
  } catch (error) {
    console.error("Greška pri izvršavanju batch zahteva:", error);
  }
};

const getMostPopularPosts = async (limit, skip) => {
  try {
    const pageStatisticsRef = db.collection("pageStatistics");

    const snapshot = await pageStatisticsRef
      .orderBy("views", "desc")
      .limit(limit)
      .offset(skip)
      .get();

    const mostPopularPosts = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      mostPopularPosts.push(data.postID);
    });

    return mostPopularPosts;
  } catch (error) {
    throw error;
  }
};

let batchData = [];
let requestCounter = 0;

router
  .get(async (req, res) => {})
  .get("/pageStatistics/mostPopular", async (req, res) => {
    try {
      const { limit, skip } = req.body;

      const parsedLimit = parseInt(limit);
      const parsedSkip = parseInt(skip);

      if (isNaN(parsedLimit) || isNaN(parsedSkip)) {
        return res.status(400).json({
          error: "Parametri limit i skip moraju biti validni brojevi.",
        });
      }

      const mostPopularPosts = await getMostPopularPosts(
        parsedLimit,
        parsedSkip
      );

      res.status(200).json({ mostPopularPosts });
    } catch (error) {
      console.error("Greška pri dohvatanju najpopularnijih postova:", error);
      return res.status(500).json({
        error: "Došlo je do greške pri dohvatanju najpopularnijih postova.",
      });
    }
  })
  .put("/pageStatistics", async (req, res) => {
    try {
      const { postID } = req.body;

      const existingIndex = batchData.findIndex(
        (data) => data.postID === postID
      );

      if (existingIndex !== -1) {
        batchData[existingIndex].counter++;
      } else {
        batchData.push({ postID, counter: 1 });
      }

      requestCounter++;

      if (requestCounter >= 10) {
        await updatePageStatistics(batchData);
        batchData = [];
        requestCounter = 0;
      }

      return res.end();
    } catch (error) {
      console.error("Greška pri dodavanju podatka u batch:", error);
      return res
        .status(500)
        .json({ error: "Došlo je do greške pri dodavanju podatka u batch." });
    }
  });

module.exports = router;
