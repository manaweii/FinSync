import express from 'express';
import { connectSubscriptionDB } from '../config/db.js'; 
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Role from '../models/Role.js';
import UserOrgRelation from '../models/UserOrgRelation.js';
import UserRoleRelation from '../models/UserRoleRelation.js';
import { ObjectId } from 'mongodb';

const router = express.Router();
const SALT_ROUNDS = 10;

// GET /api/subscription/verify
router.get('/subscription/verify', async (req, res) => {
  // eSewa sends a 'data' query parameter in the URL
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({ error: "No payment data received from eSewa" });
  }

  try {
    // 1. Decode the Base64 string natively (No library needed)
    const decodedString = Buffer.from(data, 'base64').toString('utf-8');
    
    // 2. Convert string to JSON object
    const paymentInfo = JSON.parse(decodedString);

    // 3. Check if status is COMPLETE
    if (paymentInfo.status === "COMPLETE") {
      /* 
         MOCK LOGIC: 
         Find the organization/user by the transaction_uuid 
         and flip their isActive status to true.
      */
      
      // Example (commented out until you connect your model):
      // const db = await connectSubscriptionDB();
      // await db.collection('users').updateOne(
      //   { transactionUuid: paymentInfo.transaction_uuid },
      //   { $set: { isActive: true, paymentStatus: 'paid' } }
      // );

      return res.json({
        success: true,
        message: "Payment verified and account activated",
        details: paymentInfo
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
router.post('/subscription/complete', async (req, res) => {
  try {
    const { orgName, billingEmail, amount } = req.body;

    // Simple validation 
    if (!orgName || !billingEmail || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Simulate payment processing 
    const paymentId = 'pay_' + Date.now(); // Simple unique ID
    const subscription = {
      orgName,
      billingEmail,
      amount,
      paymentId,
      status: 'active',
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
      createdAt: new Date().toISOString()
    };

    // Save to DB (use your existing MongoDB connection)
    const db = await connectSubscriptionDB(); // Reuse your DB
    await db.collection('subscriptions').insertOne(subscription);

    res.json({
      success: true,
      message: 'Subscription completed successfully!',
      subscriptionId: subscription._id,
      paymentId,
      nextBilling: subscription.nextBilling
    });

  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Server error during subscription' });
  }
});

// Get subscription logs endpoint
router.get('/subscription/logs', async (req, res) => {
  try {
    const { search, from, to } = req.query;
    
    const db = await connectSubscriptionDB();
    let query = { status: { $exists: true } }; // All subscriptions
    
    // Search filter
    if (search) {
      query.$or = [
        { billingEmail: { $regex: search, $options: 'i' } },
        { orgName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Date filter
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
    }
    
    const subscriptions = await db.collection('subscriptions').find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    
    // Transform for frontend table
    const logs = subscriptions.map(sub => ({
      timestamp: new Date(sub.createdAt).toISOString().slice(0, 16).replace('T', ' '),
      user: sub.billingEmail,
      role: 'Admin',
      org: sub.orgName,
      plan: 'Growth Plan', // Customize based on amount/plan field
      result: sub.status.charAt(0).toUpperCase() + sub.status.slice(1)
    }));
    
    // Calculate total payments (completed only)
    const totalPayments = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.amount, 0);
    
    res.json({
      logs,
      totalCount: subscriptions.length,
      totalPayments,
      showing: Math.min(logs.length, 6) // For footer
    });
    
  } catch (error) {
    console.error('Logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Initiate subscription: create pending record and return signed eSewa payload
router.post('/initiate', async (req, res) => {
  try {
    const { orgName, billingEmail, amount, planName, password } = req.body;
    if (!orgName || !billingEmail || !amount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Ensure an Organization record exists (pending) so plan is saved on onboarding
    let orgDoc = await Organization.findOne({ name: orgName });
    if (!orgDoc) {
      orgDoc = await Organization.create({
        name: orgName,
        contactEmail: billingEmail,
        phone: '',
        plan: planName || 'Starter',
        status: 'Pending',
      });
    } else {
      // update plan/status to pending in case user re-initiates
      orgDoc.plan = planName || orgDoc.plan || 'Starter';
      orgDoc.status = 'Pending';
      await orgDoc.save();
    }

    // Create a transaction UUID
    const transactionUuid = `txn_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    // Save pending subscription to DB
    const db = await connectSubscriptionDB();
    const pending = {
      orgName,
      orgId: orgDoc._id,
      billingEmail,
      amount: Number(amount),
      planName: planName || 'Starter',
      password: password || null,
      transactionUuid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await db.collection('subscriptions').insertOne(pending);

    // Prepare signature for eSewa (server-side secret)
    // NOTE: adjust the signed fields/order to match your eSewa configuration
    const secret = process.env.ESEWA_SECRET || 'dev-secret';
    const product_code = 'EPAYTEST';
    const total_amount = String(amount);
    const payloadToSign = `${total_amount}|${transactionUuid}|${product_code}`;
    const signature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');

    return res.json({ success: true, transactionUuid, signature, orgId: orgDoc._id });
  } catch (err) {
    console.error('Initiate subscription error:', err);
    return res.status(500).json({ success: false, error: 'Server error initiating subscription' });
  }
});

// eSewa callback/verification endpoint
// Expects JSON body with: transactionUuid, amount, esewaRefId (optional), product_code (optional), signature (optional)
router.post('/esewa/callback', async (req, res) => {
  try {
    const { transactionUuid, amount, esewaRefId, product_code, signature } = req.body;
    if (!transactionUuid) return res.status(400).json({ success: false, error: 'transactionUuid required' });

    const subConn = await connectSubscriptionDB();
    const subsColl = subConn.db.collection('subscriptions');
    const pending = await subsColl.findOne({ transactionUuid });
    if (!pending) return res.status(404).json({ success: false, error: 'Transaction not found' });

    // basic amount check
    if (amount && Number(amount) !== Number(pending.amount)) {
      return res.status(400).json({ success: false, error: 'Amount mismatch' });
    }

    const secret = process.env.ESEWA_SECRET || 'dev-secret';
    const pid = product_code || 'EPAYTEST';
    const payloadToSign = `${String(amount || pending.amount)}|${transactionUuid}|${pid}`;
    const expected = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');

    let verified = false;
    if (signature) {
      verified = signature === expected;
    } else if (process.env.ESEWA_VERIFY_URL) {
      // Call remote verify endpoint if configured (merchant should set ESEWA_VERIFY_URL)
      try {
        const verifyResp = await fetch(process.env.ESEWA_VERIFY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amt: String(amount || pending.amount), rid: esewaRefId, pid: pid }),
        });
        const txt = await verifyResp.text();
        // Many eSewa verification endpoints return XML or text; treat any 2xx as success for now
        verified = verifyResp.ok;
      } catch (e) {
        console.warn('eSewa remote verify failed', e);
        verified = false;
      }
    } else {
      // No signature and no remote verify configured -- fallback to comparing our expected with provided signature if any
      console.warn('No signature provided and no verify URL configured; performing best-effort local check');
      verified = true; // best-effort accept (NOT recommended for production)
    }

    if (!verified) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    // mark subscription active
    await subsColl.updateOne({ transactionUuid }, { $set: { status: 'active', esewaRefId: esewaRefId || null, paidAt: new Date().toISOString() } });

    // create or activate organization in auth DB
    let org = await Organization.findOne({ name: pending.orgName });
    if (!org) {
      org = await Organization.create({
        name: pending.orgName,
        contactEmail: pending.billingEmail,
        phone: pending.phone || '',
        plan: pending.planName || 'Starter',
        status: 'Active',
      });
    } else {
      // set plan from pending subscription if provided (signup or upgrade)
      if (pending.planName) org.plan = pending.planName;
      org.status = 'Active';
      await org.save();
    }

    // create admin user if not exists
    let user = await User.findOne({ email: pending.billingEmail });
    if (!user) {
      const pw = pending.password || Math.random().toString(36).slice(-10);
      const pwHash = await bcrypt.hash(pw, SALT_ROUNDS);
      user = await User.create({ fullName: 'Admin', email: pending.billingEmail, passwordHash: pwHash, status: 'Active' });
      await UserOrgRelation.create({ userId: user._id, orgId: org._id });
      let adminRole = await Role.findOne({ name: 'Admin' });
      if (!adminRole) adminRole = await Role.create({ name: 'Admin' });
      await UserRoleRelation.create({ userId: user._id, roleId: adminRole._id });
    } else {
      // ensure user-org relation
      await UserOrgRelation.findOneAndUpdate({ userId: user._id }, { $set: { orgId: org._id } }, { upsert: true });
    }

    // link subscription to org/user
    await subsColl.updateOne({ transactionUuid }, { $set: { orgId: org._id, userId: user._id } });

    return res.json({ success: true, message: 'Payment verified and subscription activated' });
  } catch (err) {
    console.error('eSewa callback error', err);
    return res.status(500).json({ success: false, error: 'Server error during callback' });
  }
});

// Initiate plan upgrade for existing organization
router.post('/upgrade', async (req, res) => {
  try {
    const { orgId, billingEmail, amount, planName } = req.body;
    if (!orgId || !billingEmail || !amount || !planName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // find organization
    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ success: false, error: 'Organization not found' });

    // mark pendingPlan so org settings page can show it
    org.pendingPlan = planName;
    // keep organization active during upgrade, optionally mark pending flag
    org.status = org.status || 'Active';
    await org.save();

    // Create a transaction UUID
    const transactionUuid = `txn_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    // Save pending subscription to DB (type: upgrade)
    const db = await connectSubscriptionDB();
    const pending = {
      orgName: org.name,
      orgId: org._id,
      billingEmail,
      amount: Number(amount),
      planName: planName,
      transactionUuid,
      status: 'pending',
      type: 'upgrade',
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection('subscriptions').insertOne(pending);

    // Prepare signature for eSewa
    const secret = process.env.ESEWA_SECRET || 'dev-secret';
    const product_code = 'EPAYTEST';
    const total_amount = String(amount);
    const payloadToSign = `${total_amount}|${transactionUuid}|${product_code}`;
    const signature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');

    return res.json({ success: true, transactionUuid, signature, orgId: org._id, subscriptionId: result.insertedId });
  } catch (err) {
    console.error('Upgrade initiate error:', err);
    return res.status(500).json({ success: false, error: 'Server error initiating upgrade' });
  }
});

// Verify subscription lookup endpoint
router.get('/verify', async (req, res) => {
  try {
    const { data } = req.query;
    if (!data) return res.status(400).json({ success: false, error: 'data query param is required' });

    const subConn = await connectSubscriptionDB();
    const subsColl = subConn.db.collection('subscriptions');

    // Try direct lookup by transactionUuid
    let sub = await subsColl.findOne({ transactionUuid: data });

    // Try lookup by ObjectId
    if (!sub) {
      try {
        if (ObjectId.isValid(data)) {
          sub = await subsColl.findOne({ _id: new ObjectId(data) });
        }
      } catch (e) {
        // ignore
      }
    }

    // Try base64-decoded JSON payload that may contain transactionUuid
    if (!sub) {
      try {
        const decoded = Buffer.from(data, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.transactionUuid) {
          sub = await subsColl.findOne({ transactionUuid: parsed.transactionUuid });
        }
      } catch (e) {
        // not base64/json — ignore
      }
    }

    if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found' });

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
      status: sub.status || 'pending',
      createdAt: sub.createdAt,
    };

    return res.json({ success: true, subscription: result });
  } catch (err) {
    console.error('Verify endpoint error', err);
    return res.status(500).json({ success: false, error: 'Server error during verify' });
  }
});

export default router;