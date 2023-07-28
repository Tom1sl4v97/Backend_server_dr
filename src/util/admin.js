var admin = require("firebase-admin");

var serviceAccount = require("../../svijet-u-oblacima-firebase-adminsdk.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://svijet-u-oblacima.firebaseio.com",
  });
}

module.exports = { admin };