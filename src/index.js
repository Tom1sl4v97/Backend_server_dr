const express = require("express");
const cors = require("cors");
const app = express();
const { admin } = require("./util/admin");

const userData = require("./routers/userData");
const pageStatistics = require("./routers/pageStatistics");

const corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));

app.use(express.json());
// app.use("/api", userData);

function checkAuth(req, res, next) {
  const { authorization } = req.headers;
  const authtoken = authorization && authorization.split(" ")[1];
  if (authtoken) {
    admin
      .auth()
      .verifyIdToken(authtoken)
      .then(() => {
        next();
      })
      .catch(() => {
        res.status(403).send("Unauthorized");
      });
  } else {
    res.status(403).send("Unauthorized");
  }
}

app.use("/api", pageStatistics);

app.use(checkAuth);
app.use("/api", userData);

app.listen(5050, () => {
  console.log("Server is running on port 5050");
});
