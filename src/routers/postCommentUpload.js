const express = require("express");
const router = express.Router();
const { admin } = require("../util/admin");

const db = admin.firestore();

const uploadPostComment = async (postComment) => {
  try {
    const postCommentsRef = db.collection("postComments");
    await postCommentsRef.add(postComment);
  } catch (error) {
    throw ("Error uploading post comment:", error);
  }
};

const getUserCategoryList = async (userEmail) => {
  try {
    const postCommentsRef = db.collection("postComments");
    const snapshot = await postCommentsRef
      .select("postCategory")
      .where("email", "==", userEmail)
      .get();

    const userCategoryList = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      userCategoryList.push(data.postCategory);
    });

    const categoryList = [];
    userCategoryList.forEach((category) => {
      category.forEach((categoryItem) => {
        categoryList.push(categoryItem);
      });
    });

    const categoryListCount = {};
    categoryList.forEach((category) => {
      if (categoryListCount[category]) {
        categoryListCount[category]++;
      } else {
        categoryListCount[category] = 1;
      }
    });

    const sortedCategoryList = Object.keys(categoryListCount).sort(
      (a, b) => categoryListCount[b] - categoryListCount[a]
    );

    return sortedCategoryList;
  } catch (error) {
    throw ("Error getting user category list:", error);
  }
};

router
  .get("/userRecommendation", async (req, res) => {
    try {
      const userEmail = req.query.userEmail;

      console.log("Getting user recommendation... userEmail:", userEmail);

      const userCategoryList = await getUserCategoryList(userEmail);

      res.status(200).json({ userCategoryList: userCategoryList });
    } catch (error) {
      console.error("Greška pri dohvatanju rekomendacije korisnika:", error);
      return res.status(500).json({
        error: error.message,
      });
    }
  })
  .post("/pageCommentsUpload", async (req, res) => {
    try {
      const postComment = req.body;

      console.log("Uploading post comment... postComment:", postComment);

      const date = new Date();
      const month = date.toLocaleString("default", { month: "short" });
      const day = date.getDate();
      const year = date.getFullYear();
      const formattedDate = `${month} ${day}, ${year}`;

      postComment.postedDate = formattedDate;

      uploadPostComment(postComment);

      res.status(200).json({ message: "Post comment uploaded successfully." });
    } catch (error) {
      console.error("Greška pri dohvatanju komentara:", error);
      return res.status(500).json({
        error: error.message,
      });
    }
  })
  .delete("/pageCommentsUpload", async (req, res) => {
    try {
      const postCommentId = req.query.postCommentId;

      console.log("Deleting post comment... postCommentId:", postCommentId);

      const postCommentsRef = db.collection("postComments");
      await postCommentsRef.doc(postCommentId).delete();

      res.status(200).json({ message: "Post comment deleted successfully." });
    } catch (error) {
      console.error("Greška pri dohvatanju komentara:", error);
      return res.status(500).json({
        error: error.message,
      });
    }
  });

module.exports = router;
