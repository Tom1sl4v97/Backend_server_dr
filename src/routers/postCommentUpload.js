const express = require("express");
const router = express.Router();
const { admin } = require("../util/admin");

const db = admin.firestore();

const uploadPostComment = async (postComment) => {
  try {
    /* just add new post comment */
    const postCommentsRef = db.collection("postComments");
    await postCommentsRef.add(postComment);
  } catch (error) {
    throw ("Error uploading post comment:", error);
  }
};

router
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
