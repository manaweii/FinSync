import mongoose from 'mongoose';

const { Schema } = mongoose;

const dashboardSettingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    settings: {
      type: Object,
      default: {},
    },
    layout: {
      type: [String],
      default: [],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const DashboardSetting = mongoose.model('DashboardSetting', dashboardSettingSchema);
export default DashboardSetting;
