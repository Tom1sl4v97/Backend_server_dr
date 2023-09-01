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

const getPostComments = async (postID) => {
  try {
    const postCommentsRef = db.collection("postComments");

    const snapshot = await postCommentsRef
      .where("postId", "==", postID)
      .get();

    const postComments = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      postComments.push(data);
    });

    return postComments;
  } catch (error) {
    throw error;
  }
};


const getTotalViews = async () => {
  try {
    const pageStatisticsRef = db.collection("pageStatistics");

    const snapshot = await pageStatisticsRef.get();

    let totalViews = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      totalViews += data.views;
    });

    return totalViews;
  } catch (error) {
    throw error;
  }
}

const getPostsStatisticsByContentIdsList = async (postIDList, totalViews) => {
  try {
    const postIDs = postIDList.split(",");

    const pageStatisticsRef = db.collection("pageStatistics");

    const snapshot = await pageStatisticsRef.where("postID", "in", postIDs).get();

    const contentStatistics = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const comments = await getPostComments(data.postID);
      contentStatistics.push({ postID: data.postID, views: data.views, totalViews: totalViews, comments: comments });
    }

    return contentStatistics;
  } catch (error) {
    throw error;
  }
}

let batchData = [];
let requestCounter = 0;

router
  .post("/modStatistics",async (req, res) => {
    try {
      const {contentIdsList} = req.body;

      const totalViews = await getTotalViews();

      console.log("Getting statistics for contentIdsList: " + contentIdsList);

      const contentStatistics = await getPostsStatisticsByContentIdsList(contentIdsList, totalViews);

      res.status(200).json({contentStatistics});
    } catch (error) {
      console.error("Greška pri dohvatanju najpopularnijih postova:", error);
      return res.status(500).json({
        error: "Došlo je do greške pri dohvatanju najpopularnijih postova.",
      });
    }
  })
  .get("/pageStatistics/mostPopular", async (req, res) => {
    try {
      const { limit, skip } = req.query;

      console.log(
        "Getting most popular posts... limit: " + limit + ", skip: " + skip
      );

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
