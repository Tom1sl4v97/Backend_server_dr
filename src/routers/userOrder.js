const express = require("express");
const router = express.Router();
const { admin } = require("../util/admin");

const db = admin.firestore();

const createNewOrder = async (newOrder) => {
  try {
    const ordersRef = db.collection("orders");
    await ordersRef.add(newOrder);
  } catch (error) {
    throw ("Error creating new order:", error);
  }
};

const getUserOrders = async (userEmail, limit, skip) => {
  try {
    const ordersRef = db.collection("orders");
    const snapshot = await ordersRef
      .where("orderEmail", "==", userEmail)
      .limit(limit)
      .offset(skip)
      .get();

    const userOrders = [];
    snapshot.forEach((doc) => {
      const orderID = doc.id;
      const dateNotFormatted = doc.data().orderDate;
      const date = dateNotFormatted.replace(/-/g, "");
      const orderNumber = date + "-" + orderID;
      const data = doc.data();

      data.orderID = orderID;
      data.orderNumber = orderNumber;
      userOrders.push(data);
    });

    return userOrders;
  } catch (error) {
    throw ("Error getting user orders:", error);
  }
};

const getOrderList = async (limit, skip) => {
  try {
    const ordersRef = db.collection("orders");
    const snapshot = await ordersRef.limit(limit).offset(skip).get();

    const ordersList = [];
    snapshot.forEach((doc) => {
      const orderID = doc.id;
      const dateNotFormatted = doc.data().orderDate;
      const date = dateNotFormatted.replace(/-/g, "");
      const orderNumber = date + "-" + orderID;
      const data = doc.data();

      data.orderID = orderID;
      data.orderNumber = orderNumber;
      ordersList.push(data);
    });

    return ordersList;
  } catch (error) {
    throw ("Error getting orders list:", error);
  }
};

router
  .get("/order", async (req, res) => {
    try {
      const userEmail = req.query.userEmail;
      const limit = req.query.limit;
      const skip = req.query.skip;

      const parsedLimit = parseInt(limit);
      const parsedSkip = parseInt(skip);

      if (isNaN(parsedLimit) || isNaN(parsedSkip)) {
        res.status(400).json({
          error: "Parametri limit i skip moraju biti validni brojevi.",
        });
      }

      console.log(
        "Getting orders by email:",
        userEmail + " skip: " + parsedSkip + " limit: " + parsedLimit
      );

      const userOrdersData = await getUserOrders(
        userEmail,
        parsedLimit,
        parsedSkip
      );

      const ordersRef = db.collection("orders");
      const snapshot = await ordersRef
        .where("orderEmail", "==", userEmail)
        .get();
      const totalOrders = snapshot.size;

      res.status(200).json({ userOrdersData, totalOrders });
    } catch (error) {
      console.error("Error getting orders:", error);
      res.status(500).json({ message: "Error getting orders" });
    }
  })
  .get("/allOrders", async (req, res) => {
    try {
      const limit = req.query.limit;
      const skip = req.query.skip;

      const parsedLimit = parseInt(limit);
      const parsedSkip = parseInt(skip);

      if (isNaN(parsedLimit) || isNaN(parsedSkip)) {
        res.status(400).json({
          error: "Parametri limit i skip moraju biti validni brojevi.",
        });
      }

      console.log(
        "Getting all orders skip: ",
        parsedSkip,
        " limit: ",
        parsedLimit
      );

      const ordersList = await getOrderList(parsedLimit, parsedSkip);

      const ordersRef = db.collection("orders");
      const snapshot = await ordersRef.get();
      const totalOrders = snapshot.size;

      res.status(200).json({ ordersList, totalOrders });
    } catch (error) {
      console.error("Error getting orders:", error);
      res.status(500).json({ message: "Error getting orders" });
    }
  })
  .post("/order", (req, res) => {
    try {
      const newOrder = req.body;

      console.log("Creating new order:", newOrder);

      createNewOrder(newOrder);

      res.status(200).json({ message: "Order created successfully" });
    } catch (error) {
      console.error("Error creating new order:", error);
      res.status(500).json({ message: "Error creating new order" });
    }
  })
  .put("/order/cancelOrder", (req, res) => {
    try {
      const orderID = req.body.orderID;

      console.log("Canceling order:", orderID);

      db.collection("orders").doc(orderID).update({ orderStatus: "canceled" });

      res.status(200).json({ message: "Order canceled successfully" });
    } catch (error) {
      console.error("Error canceling order:", error);
      res.status(500).json({ message: "Error canceling order" });
    }
  })
  .put("/order/updateOrderStatus", (req, res) => {
    try {
      const orderID = req.body.orderID;
      const orderStatus = req.body.status;

      console.log(
        "Updating order status... orderID: " +
          orderID +
          " orderStatus: " +
          orderStatus
      );

      db.collection("orders").doc(orderID).update({ orderStatus: orderStatus });

      res.status(200).json({ message: "Order confirmed successfully" });
    } catch (error) {
      console.error("Error confirming order:", error);
      res.status(500).json({ message: "Error confirming order" });
    }
  });

module.exports = router;
