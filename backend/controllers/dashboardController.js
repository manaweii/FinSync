import DashboardSetting from '../models/DashboardSetting.js';
import mongoose from 'mongoose';

export const saveDashboardSettings = async (req, res) => {
  try {
    const { userId, orgId, settings, layout } = req.body;
    if (!orgId && !userId) return res.status(400).json({ message: 'Missing owner id' });

    // upsert by orgId if provided, else by userId
    const filter = orgId ? { orgId } : { userId };
    const update = { settings: settings || {}, layout: layout || [], createdBy: req.user?._id || null };

    const doc = await DashboardSetting.findOneAndUpdate(filter, update, { upsert: true, new: true });
    res.json(doc);
  } catch (err) {
    console.error('saveDashboardSettings error', err);
    res.status(500).json({ message: 'Server error while saving dashboard settings' });
  }
};

export const getDashboardSettings = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'Missing id' });

    // build a flexible query: try ObjectId matches first if id looks like an ObjectId
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      const oid = mongoose.Types.ObjectId(id);
      query = { $or: [{ orgId: oid }, { userId: oid }, { _id: oid }] };
    } else {
      query = { $or: [{ orgId: id }, { userId: id }, { _id: id }] };
    }

    const doc = await DashboardSetting.findOne(query);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    console.error('getDashboardSettings err', err);
    res.status(500).json({ message: 'Server error while loading dashboard settings' });
  }
};
