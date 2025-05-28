const express = require("express");
const { userAuth } = require("../middlewares/auth");
const router = express.Router();
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");
const User = require("../models/user");

// Payment creation endpoint
router.post("/payment/create", userAuth, async (req, res) => {
    try {
        const { firstName, lastName } = req.user;
        const order = await razorpayInstance.orders.create({
            "amount": 70000, // Amount in paise
            "currency": "INR",
            "receipt": "receipt#1",
            "notes": {
                firstName: firstName,
                lastName: lastName,
                emailId: req.user.emailId,
                membershipType: "silver"
            }
        });

        // Save order in database
        const payment = new Payment({
            orderId: order.id,
            amount: 70000,
            currency: order.currency,
            status: order.status,
            paymentId: null, // Will be updated via webhook
            receipt: order.receipt,
            userId: req.user._id,
            notes: order.notes
        });

        const savedPayment = await payment.save();
        if (!savedPayment) {
            return res.status(500).json({ message: "Internal Server Error" });
        }

        // Return order details to frontend
        res.json({ ...savedPayment.toJSON() });
    } catch (error) {
        console.error("Payment creation error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Raw body parser for webhook - IMPORTANT: This must come before the webhook route
router.use('/payment/webhook', express.raw({ type: 'application/json' }));

// Webhook endpoint
router.post("/payment/webhook", async (req, res) => {
    try {
        console.log("Webhook received:", req.body.toString());
        
        // Validate webhook signature
        const webhookSignature = req.get('X-Razorpay-Signature');
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "Sanju@123";
        
        const isWebhookValid = validateWebhookSignature(
            req.body.toString(), 
            webhookSignature, 
            webhookSecret
        );

        if (!isWebhookValid) {
            console.log("Invalid webhook signature");
            return res.status(400).json({ message: "Invalid Webhook Signature" });
        }

        console.log("Webhook signature validated successfully");
        
        // Parse the body
        const webhookBody = JSON.parse(req.body.toString());
        console.log("Webhook event:", webhookBody.event);

        // Handle payment captured event
        if (webhookBody.event === "payment.captured") {
            const paymentDetails = webhookBody.payload.payment.entity;
            console.log("Payment details:", paymentDetails);

            // Find and update payment
            const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
            if (!payment) {
                console.log("Payment not found for order:", paymentDetails.order_id);
                return res.status(404).json({ message: "Payment not found" });
            }

            // Update payment details
            payment.status = paymentDetails.status;
            payment.paymentId = paymentDetails.id; // Update with actual payment ID
            await payment.save();
            console.log("Payment updated:", payment.orderId);

            // Update user to premium
            const user = await User.findById(payment.userId);
            if (!user) {
                console.log("User not found:", payment.userId);
                return res.status(404).json({ message: "User not found" });
            }

            user.isPremium = true;
            await user.save();
            console.log("User upgraded to premium:", user.emailId);
        }

        // Handle payment failed event
        if (webhookBody.event === "payment.failed") {
            const paymentDetails = webhookBody.payload.payment.entity;
            
            const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
            if (payment) {
                payment.status = "failed";
                payment.paymentId = paymentDetails.id;
                await payment.save();
                console.log("Payment marked as failed:", payment.orderId);
            }
        }

        // Always return success to Razorpay
        return res.status(200).json({ message: "Webhook processed successfully" });

    } catch (error) {
        console.error("Webhook error:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

module.exports = router;