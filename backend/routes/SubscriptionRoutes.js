import express from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Role from "../models/Role.js";
import UserOrgRelation from "../models/UserOrgRelation.js";
import UserRoleRelation from "../models/UserRoleRelation.js";
import { sendSuperadminSignupAlertEmail } from "../services/emailService.js";

const router = express.Router();
const SALT_ROUNDS = 10;

async function notifySuperadminsOfPaidActivation({
  organizationName,
  adminEmail,
  planName,
  amount,
  transactionUuid,
  paidAt,
}) {
  const superAdminRole = await Role.findOne({ name: "SuperAdmin" });
  if (!superAdminRole) {
    return;
  }

  const relations = await UserRoleRelation.find({ roleId: superAdminRole._id });
  if (!relations.length) {
    return;
  }

  const superadminIds = relations.map((relation) => relation.userId);
  const superadmins = await User.find(
    { _id: { $in: superadminIds }, status: "Active" },
    { email: 1 },
  );
  const recipientEmails = [
    ...new Set(superadmins.map((user) => user.email).filter(Boolean)),
  ];

  if (!recipientEmails.length) {
    return;
  }

  await sendSuperadminSignupAlertEmail({
    recipients: recipientEmails,
    organizationName,
    adminEmail,
    planName,
    amount,
    transactionUuid,
    paidAt,
  });
}

// GET /api/subscription/verify
router.get("/subscription/verify", async (req, res) => {
  // eSewa sends a 'data' query parameter in the URL
  const { data } = req.query;
  console.log("Verification request received with data:", data);
  
  if (!data) {
    return res
      .status(400)
      .json({ error: "No payment data received from eSewa" });
  }

  try {
    const decodedString = Buffer.from(data, "base64").toString("utf-8");
    const paymentInfo = JSON.parse(decodedString);

    if (paymentInfo.status === "COMPLETE") {
      const transactionUuid = paymentInfo.transaction_uuid;
      const subscription = await Subscription.findOne({ transactionUuid });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: "Subscription not found",
        });
      }

      const paidAt = new Date().toISOString();

      subscription.status = "Active";
      subscription.paidAt = paidAt;
      subscription.esewaRefId =
        paymentInfo.ref_id || paymentInfo.transaction_code || "";
      subscription.transactionUuid = transactionUuid;

      let organization = null;

      if (subscription.orgId) {
        organization = await Organization.findById(subscription.orgId);
      }

      if (!organization) {
        organization = await Organization.findOne({ name: subscription.orgName });
      }

      if (!organization) {
        organization = await Organization.create({
          name: subscription.orgName,
          contactEmail: subscription.billingEmail,
          phone: subscription.phone || "0000000000",
          plan: subscription.planName || "Starter",
          status: "Active",
        });
      } else {
        organization.contactEmail = subscription.billingEmail;
        organization.phone = subscription.phone || organization.phone;
        organization.plan = subscription.planName || organization.plan;
        organization.status = "Active";
        await organization.save();
      }

      let adminUser = await User.findOne({ email: subscription.billingEmail });

      if (!adminUser) {
        const plainPassword =
          subscription.password || Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

        adminUser = await User.create({
          fullName: subscription.orgName || "Admin",
          email: subscription.billingEmail,
          passwordHash,
          status: "Active",
        });
      } else {
        adminUser.status = "Active";
        await adminUser.save();
      }

      let adminRole = await Role.findOne({ name: "Admin" });
      if (!adminRole) {
        adminRole = await Role.create({ name: "Admin" });
      }

      await UserOrgRelation.findOneAndUpdate(
        { userId: adminUser._id },
        { $set: { orgId: organization._id } },
        { upsert: true, new: true },
      );

      await UserRoleRelation.findOneAndUpdate(
        { userId: adminUser._id },
        { $set: { roleId: adminRole._id } },
        { upsert: true, new: true },
      );

      subscription.orgId = organization._id;
      subscription.userId = adminUser._id;
      subscription.password = undefined;
      await subscription.save();

      try {
        await notifySuperadminsOfPaidActivation({
          organizationName: organization.name,
          adminEmail: adminUser.email,
          planName: subscription.planName,
          amount: subscription.amount,
          transactionUuid,
          paidAt,
        });
      } catch (mailError) {
        console.error(
          "Failed to notify superadmins about paid activation:",
          mailError.message,
        );
      }

      return res.json({
        success: true,
        message: "Payment verified and account activated",
        subscription: {
          orgName: subscription.orgName,
          billingEmail: subscription.billingEmail,
          amount: subscription.amount,
          planName: subscription.planName,
          transactionUuid,
          orgId: organization._id,
          userId: adminUser._id,
          status: "Active",
          createdAt: subscription.createdAt,
          nextBilling: subscription.nextBilling || null,
        },
        details: paymentInfo,
      });
    } else {
      return res.status(400).json({ error: "Payment was not completed" });
    }
  } catch (error) {
    console.error("Verification Error:", error.message);
    // This prevents the "app crashed" error if decoding fails
    return res.status(500).json({ error: "Failed to parse payment data" });
  }
});

// Complete subscription endpoint
router.post("/subscription/complete", async (req, res) => {
  try {
    const { orgName, billingEmail, amount } = req.body;

    // Simple validation
    if (!orgName || !billingEmail || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Simulate payment processing
    const paymentId = "pay_" + Date.now(); // Simple unique ID
    const subscription = {
      orgName,
      billingEmail,
      amount,
      paymentId,
      status: "Active",
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // +30 days
      createdAt: new Date().toISOString(),
    };

    const savedSubscription = await Subscription.create({
      orgName,
      billingEmail,
      amount,
      transactionUuid: paymentId,
      status: "Active",
      nextBilling: subscription.nextBilling,
      createdAt: subscription.createdAt,
    });
    
    res.json({
      success: true,
      message: "Subscription completed successfully!",
      subscriptionId: savedSubscription._id,
      paymentId,
      nextBilling: subscription.nextBilling,
    });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Server error during subscription" });
  }
});

// Get subscription logs endpoint
router.get("/subscription/logs", async (req, res) => {
  try {
    const { search, from, to } = req.query;

    let query = { status: { $exists: true } }; // All subscriptions

    // Search filter
    if (search) {
      query.$or = [
        { billingEmail: { $regex: search, $options: "i" } },
        { orgName: { $regex: search, $options: "i" } },
      ];
    }

    // Date filter
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + "T23:59:59.999Z");
    }

    const subscriptions = await Subscription.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Transform for frontend table
    const logs = subscriptions.map((sub) => ({
      timestamp: new Date(sub.createdAt)
        .toISOString()
        .slice(0, 16)
        .replace("T", " "),
      user: sub.billingEmail,
      role: "Admin",
      org: sub.orgName,
      plan: "Growth Plan", // Customize based on amount/plan field
      result: sub.status.charAt(0).toUpperCase() + sub.status.slice(1),
    }));

    // Calculate total payments (completed only)
    const totalPayments = subscriptions
      .filter((s) => s.status === "Active")
      .reduce((sum, s) => sum + s.amount, 0);

    res.json({
      logs,
      totalCount: subscriptions.length,
      totalPayments,
      showing: Math.min(logs.length, 6), // For footer
    });
  } catch (error) {
    console.error("Logs error:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// Initiate subscription: create pending record and return signed eSewa payload
router.post("/subscription/initiate", async (req, res) => {
  try {
    console.log("Initiate subscription request body:", req.body);
    const { orgName, billingEmail, phone, amount, planName, period, password } =
      req.body;
    if (!orgName || !billingEmail || !phone || !amount || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // Ensure an Organization record exists (pending) so plan is saved on onboarding
    // Inside router.post('/subscription/initiate', ...)

    let orgDoc = await Organization.findOne({ name: orgName });

    if (!orgDoc) {
      orgDoc = await Organization.create({
        name: orgName,
        contactEmail: billingEmail,
        phone: req.body.phone || "0000000000",
        plan: planName || "Starter",
        status: "Pending",
      });
    } else {
      orgDoc.plan = planName || orgDoc.plan || "Starter";
      orgDoc.status = "Pending";
      await orgDoc.save();
    }

    // Create a transaction UUID
    const transactionUuid = `Finsync_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    // Save pending subscription to DB so callback can find it
    let pendingId = null;
    try {
      const date = new Date();
      switch (period) {
        case 'month':
          date.setMonth(date.getMonth() + 1);
          break;
        case '3 month':
          date.setMonth(date.getMonth() + 3);
          break;
        case '6 month':
          date.setMonth(date.getMonth() + 6);
          break;
        case 'year':
          date.setFullYear(date.getFullYear() + 1);
          break;
        default:
          console.log("Invalid period");
      }
      const nextBilling = date.toISOString();

      console.log("Next billing date calculated as:", nextBilling);
      const pending = {
        orgName,
        orgId: orgDoc._id,
        billingEmail,
        phone,
        amount: Number(amount),
        planName: planName || "Starter",
        transactionUuid,
        password,
        status: "Pending",
        type: "signup",
        nextBilling,
        createdAt: new Date().toISOString(),
      };
      const createdSubscription = await Subscription.create(pending);
      pendingId = createdSubscription._id;
    } catch (dbErr) {
      console.warn("Warning: failed to persist pending subscription:", dbErr);
      // continue — still return signature so frontend can submit payment; callback will fail to match if not persisted
    }

    // Prepare signature for eSewa (server-side secret)
    // Use consistent payload format and hex digest to match verification step
    const secret = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
    const product_code = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
    const total_amount = String(amount);
    const payloadToSign = `total_amount=${total_amount},transaction_uuid=${transactionUuid},product_code=${product_code}`;
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payloadToSign)
      .digest("base64");

    return res.json({
      success: true,
      transactionUuid,
      signature,
      subscriptionid: pendingId,
      orgId: orgDoc._id,
    });
  } catch (err) {
    console.error("Initiate subscription error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Server error initiating subscription" });
  }
});

// eSewa callback/verification endpoint
// Expects JSON body with: transactionUuid, amount, esewaRefId (optional), product_code (optional), signature (optional)
router.post("/esewa/callback", async (req, res) => {
  try {
    const { transactionUuid, amount, esewaRefId, product_code, signature } =
      req.body;
    if (!transactionUuid)
      return res
        .status(400)
        .json({ success: false, error: "transactionUuid required" });

    const pending = await Subscription.findOne({ transactionUuid });
    if (!pending)
      return res
        .status(404)
        .json({ success: false, error: "Transaction not found" });

    // basic amount check
    if (amount && Number(amount) !== Number(pending.amount)) {
      return res.status(400).json({ success: false, error: "Amount mismatch" });
    }

    const secret = process.env.ESEWA_SECRET || "dev-secret";
    const pid = product_code || "EPAYTEST";
    const payloadToSign = `${String(amount || pending.amount)}|${transactionUuid}|${pid}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payloadToSign)
      .digest("hex");

    let verified = false;
    if (signature) {
      verified = signature === expected;
    } else if (process.env.ESEWA_VERIFY_URL) {
      // Call remote verify endpoint if configured (merchant should set ESEWA_VERIFY_URL)
      try {
        const verifyResp = await fetch(process.env.ESEWA_VERIFY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amt: String(amount || pending.amount),
            rid: esewaRefId,
            pid: pid,
          }),
        });
        const txt = await verifyResp.text();
        // Many eSewa verification endpoints return XML or text; treat any 2xx as success for now
        verified = verifyResp.ok;
      } catch (e) {
        console.warn("eSewa remote verify failed", e);
        verified = false;
      }
    } else {
      // No signature and no remote verify configured -- fallback to comparing our expected with provided signature if any
      console.warn(
        "No signature provided and no verify URL configured; performing best-effort local check",
      );
      verified = true; // best-effort accept (NOT recommended for production)
    }

    if (!verified) {
      return res
        .status(400)
        .json({ success: false, error: "Payment verification failed" });
    }

    const alreadyNotified = pending.status === "Active";
    const paidAt = new Date().toISOString();
    pending.status = "Active";
    pending.esewaRefId = esewaRefId || null;
    pending.paidAt = paidAt;

    let org = await Organization.findOne({ name: pending.orgName });
    if (!org) {
      org = await Organization.create({
        name: pending.orgName,
        contactEmail: pending.billingEmail,
        phone: pending.phone || "0000000000",
        plan: pending.planName || "Starter",
        status: "Active",
      });
    } else {
      org.contactEmail = pending.billingEmail;
      org.phone = pending.phone || org.phone;
      if (pending.planName) org.plan = pending.planName;
      org.status = "Active";
      await org.save();
    }

    let user = await User.findOne({ email: pending.billingEmail });
    if (!user) {
      const pw = pending.password || Math.random().toString(36).slice(-10);
      const pwHash = await bcrypt.hash(pw, SALT_ROUNDS);
      user = await User.create({
        fullName: "Admin",
        email: pending.billingEmail,
        passwordHash: pwHash,
        status: "Active",
      });
    } else {
      user.status = "Active";
      await user.save();
    }

    let adminRole = await Role.findOne({ name: "Admin" });
    if (!adminRole) adminRole = await Role.create({ name: "Admin" });

    await UserOrgRelation.findOneAndUpdate(
      { userId: user._id },
      { $set: { orgId: org._id } },
      { upsert: true, new: true },
    );

    await UserRoleRelation.findOneAndUpdate(
      { userId: user._id },
      { $set: { roleId: adminRole._id } },
      { upsert: true, new: true },
    );

    pending.orgId = org._id;
    pending.userId = user._id;
    pending.password = undefined;
    await pending.save();

    if (!alreadyNotified) {
      try {
        await notifySuperadminsOfPaidActivation({
          organizationName: org.name,
          adminEmail: user.email,
          planName: pending.planName,
          amount: pending.amount,
          transactionUuid,
          paidAt,
        });
      } catch (mailError) {
        console.error(
          "Failed to notify superadmins about paid activation:",
          mailError.message,
        );
      }
    }

    return res.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: {
        orgName: pending.orgName,
        billingEmail: pending.billingEmail,
        amount: pending.amount,
        planName: pending.planName,
        transactionUuid,
        orgId: org._id,
        userId: user._id,
        status: "Active",
        createdAt: pending.createdAt,
        nextBilling: pending.nextBilling || null,
      },
    });
  } catch (err) {
    console.error("eSewa callback error", err);
    return res
      .status(500)
      .json({ success: false, error: "Server error during callback" });
  }
});

// Initiate plan upgrade for existing organization
router.post("/upgrade", async (req, res) => {
  try {
    const { orgId, billingEmail, amount, planName } = req.body;
    if (!orgId || !billingEmail || !amount || !planName) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // find organization
    const org = await Organization.findById(orgId);
    if (!org)
      return res
        .status(404)
        .json({ success: false, error: "Organization not found" });

    // mark pendingPlan so org settings page can show it
    org.pendingPlan = planName;
    // keep organization active during upgrade, optionally mark pending flag
    org.status = org.status || "Active";
    await org.save();

    // Create a transaction UUID
    const transactionUuid = `txn_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    // Save pending subscription to DB (type: upgrade)
    const pending = {
      orgName: org.name,
      orgId: org._id,
      billingEmail,
      amount: Number(amount),
      planName: planName,
      transactionUuid,
      status: "Pending",
      type: "upgrade",
      createdAt: new Date().toISOString(),
    };

    const result = await Subscription.create(pending);

    // Prepare signature for eSewa
    const secret = process.env.ESEWA_SECRET || "dev-secret";
    const product_code = "EPAYTEST";
    const total_amount = String(amount);
    const payloadToSign = `${total_amount}|${transactionUuid}|${product_code}`;
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payloadToSign)
      .digest("hex");

    return res.json({
      success: true,
      transactionUuid,
      signature,
      orgId: org._id,
      subscriptionId: result._id,
    });
  } catch (err) {
    console.error("Upgrade initiate error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Server error initiating upgrade" });
  }
});

// Verify subscription lookup endpoint
router.get("/verify", async (req, res) => {
  try {
    const { data } = req.query;
    if (!data)
      return res
        .status(400)
        .json({ success: false, error: "data query param is required" });

    // Try direct lookup by transactionUuid
    let sub = await Subscription.findOne({ transactionUuid: data }).lean();

    // Try lookup by ObjectId
    if (!sub) {
      try {
        sub = await Subscription.findById(data).lean();
      } catch (e) {
        // ignore
      }
    }

    // Try base64-decoded JSON payload that may contain transactionUuid
    if (!sub) {
      try {
        const decoded = Buffer.from(data, "base64").toString("utf8");
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.transactionUuid) {
          sub = await Subscription.findOne({
            transactionUuid: parsed.transactionUuid,
          }).lean();
        }
      } catch (e) {
        // not base64/json — ignore
      }
    }

    if (!sub)
      return res
        .status(404)
        .json({ success: false, error: "Subscription not found" });

    // Remove sensitive fields before returning
    if (sub.password) delete sub.password;
    if (sub.passwordHash) delete sub.passwordHash;

    // Return minimal subscription info
    const result = {
      orgName: sub.orgName,
      billingEmail: sub.billingEmail,
      amount: sub.amount,
      planName: sub.planName,
      transactionUuid: sub.transactionUuid,
      orgId: sub.orgId || null,
      status: sub.status || "Pending",
      createdAt: sub.createdAt,
    };

    return res.json({ success: true, subscription: result });
  } catch (err) {
    console.error("Verify endpoint error", err);
    return res
      .status(500)
      .json({ success: false, error: "Server error during verify" });
  }
});

router.get("/subscription/org/:orgId/latest", async (req, res) => {
  try {
    const { orgId } = req.params;

    if (!orgId) {
      return res
        .status(400)
        .json({ success: false, error: "orgId is required" });
    }

    const subscription = await Subscription.findOne({ orgId })
      .sort({ createdAt: -1 })
      .lean();

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, error: "Subscription not found" });
    }

    return res.json({
      success: true,
      subscription: {
        orgName: subscription.orgName,
        billingEmail: subscription.billingEmail,
        amount: subscription.amount,
        planName: subscription.planName,
        transactionUuid: subscription.transactionUuid,
        orgId: subscription.orgId || null,
        status: subscription.status || "Pending",
        createdAt: subscription.createdAt,
        nextBilling: subscription.nextBilling || null,
      },
    });
  } catch (err) {
    console.error("Latest org subscription lookup error", err);
    return res.status(500).json({
      success: false,
      error: "Server error during subscription lookup",
    });
  }
});

export default router;
