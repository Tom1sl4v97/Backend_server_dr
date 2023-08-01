const express = require("express");
const router = express.Router();
const { admin } = require("../util/admin");

const db = admin.firestore();

const getPostComments = async (postId) => {
  try {
    const postCommentsRef = db.collection("postComments");
    const postCommentsSnapshot = await postCommentsRef
      .where("postId", "==", postId)
      .get();

    if (!postCommentsSnapshot.empty) {
      const postCommentsList = [];

      postCommentsSnapshot.forEach((doc) => {
        postCommentsList.push({
          postCommentId: doc.id,
          ...doc.data(),
        });
      });

      return postCommentsList;
    }

    return null;
  } catch (error) {
    console.error("Error getting post comments:", error);
    return null;
  }
};

const getBestScoredPostIdList = async (limit, skip) => {
  try {
    const postCommentsRef = db.collection("postComments");
    const postCommentsSnapshot = await postCommentsRef
      .orderBy("postId")
      .get();

    if (!postCommentsSnapshot.empty) {
      const postCommentsList = [];

      const postCommentsGroupedByPostId = {};

      postCommentsSnapshot.forEach((doc) => {
        const data = doc.data();
        const postId = data.postId;

        if (postCommentsGroupedByPostId[postId]) {
          postCommentsGroupedByPostId[postId].push(data);
        } else {
          postCommentsGroupedByPostId[postId] = [data];
        }
      });

      for (const postId in postCommentsGroupedByPostId) {
        const postComments = postCommentsGroupedByPostId[postId];
        let sum = 0;
        for (const postComment of postComments) {
          sum += postComment.rating;
        }
        const avgScore = sum / postComments.length;

        postCommentsList.push({
          postId: postId,
          avgScore: avgScore,
        });
      }

      postCommentsList.sort((a, b) => b.avgScore - a.avgScore);

      const postCommentsListLength = postCommentsList.length;
      const postCommentsListToReturn = [];

      for (let i = skip; i < postCommentsListLength; i++) {
        postCommentsListToReturn.push(postCommentsList[i]);

        if (postCommentsListToReturn.length === limit) {
          break;
        }
      }

      return postCommentsListToReturn;
    }

    return null;
  } catch (error) {
    console.error("Error getting best scored post id list:", error);
    return null;
  }
};

router
  .get("/postComments", async (req, res) => {
    try {
      const { postId } = req.query;

      console.log("Getting post comments postId:", postId);

      const postCommentsList = await getPostComments(postId);

      if (postCommentsList !== null) {
        res.status(200).json(postCommentsList);
      } else {
        res.status(204).json({ message: "No comments" });
      }
    } catch (error) {
      console.error("Greška pri dohvatanju najpopularnijih postova:", error);
      return res.status(500).json({
        error: "Došlo je do greške pri dohvatanju najpopularnijih postova.",
      });
    }
  })
  .get("/postComments/bestScored", async (req, res) => {
    try {
      const { limit, skip } = req.query;

      console.log("Getting best scored post comments limit:", limit);

      const parsedLimit = parseInt(limit);
      const parsedSkip = parseInt(skip);

      if (isNaN(parsedLimit) || isNaN(parsedSkip)) {
        return res.status(400).json({
          error: "Parametri limit i skip moraju biti validni brojevi.",
        });
      }

      const bestScoredPostIdList = await getBestScoredPostIdList(
        parsedLimit,
        parsedSkip
      );

      if (bestScoredPostIdList !== null) {
        res.status(200).json(bestScoredPostIdList);
      } else {
        res.status(204).json({ message: "No comments" });
      }
    } catch (error) {
      console.error("Greška pri dohvatanju najpopularnijih postova:", error);
      return res.status(500).json({
        error: "Došlo je do greške pri dohvatanju najpopularnijih postova.",
      });
    }
  });

module.exports = router;
