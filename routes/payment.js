const express = require("express");
const { userAuth } = require("../middlewares/auth");
const paymentRouter = express.Router();
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const User = require("../models/user");

const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { firstName, lastName, emailId } = req.user;

    const order = await razorpayInstance.orders.create({
      amount: 700 * 100,
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        firstName,
        lastName,
        emailId,
      },
    });

    console.log(order);

    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });

    const savedPayment = await payment.save();
    res.json({ ...savedPayment.toJSON() });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// Fixed webhook route - just "/webhook"
paymentRouter.post("/webhook", async (req, res) => {
  try {
    console.log("Webhook Called");
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);
    
    const webhookSignature = req.get("X-Razorpay-Signature");
    console.log("Webhook Signature", webhookSignature);

    if (!webhookSignature) {
      return res.status(400).json({ msg: "No webhook signature" });
    }

    // Convert buffer to string since we're using raw body parser
    const bodyString = req.body.toString();
    
    const isWebhookValid = validateWebhookSignature(
      bodyString,
      webhookSignature,
      "Sanju@123" // Make sure this matches your Razorpay webhook secret
    );

    if (!isWebhookValid) {
      console.log("Invalid Webhook Signature");
      return res.status(400).json({ msg: "Webhook signature is invalid" });
    }
    
    console.log("Valid Webhook Signature");

    // Parse JSON after validation
    const webhookData = JSON.parse(bodyString);
    console.log("Webhook event:", webhookData.event);

    // Handle only successful payments
    if (webhookData.event === "payment.captured") {
      const paymentDetails = webhookData.payload.payment.entity;

      const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
      if (payment) {
        payment.status = paymentDetails.status;
        await payment.save();
        console.log("Payment saved");

        const user = await User.findById(payment.userId);
        if (user) {
          user.isPremium = true;
          await user.save();
          console.log("User marked as premium");
        }
      }
    }

    return res.status(200).json({ msg: "Webhook received successfully" });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ msg: err.message });
  }
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  const user = req.user.toJSON();
  console.log(user);
  return res.json({ ...user });
});

module.exports = paymentRouter;