var admin = require("firebase-admin");

var serviceAccount = require("../../svijet-u-oblacima-firebase-adminsdk-4dh66-0be831cebb.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://svijet-u-oblacima.firebaseio.com",
  });
}

module.exports = { admin };