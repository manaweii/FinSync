import mongoose from "mongoose";

const { Schema } = mongoose;

const lineItemSchema = new Schema(
  {
    productId: { type: String, default: "" },
    productName: { type: String, default: "" },
    category: { type: String, default: "" },
    qty: { type: Number, default: 0 },
    sellingPriceUnit: { type: Number, default: 0 },
    sellingPriceTotal: { type: Number, default: 0 },
    costPriceUnit: { type: Number, default: 0 },
    costPriceTotal: { type: Number, default: 0 },
    grossProfitLine: { type: Number, default: 0 },
  },
  { _id: false },
);

const orderTotalsSchema = new Schema(
  {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxVat13pct: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
  },
  { _id: false },
);

const journalEntrySchema = new Schema(
  {
    date: { type: String, required: true },
    account: { type: String, required: true, trim: true },
    accountType: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const recordSchema = new Schema(
  {
    orgName: { type: String, required: true, trim: true, index: true },
    source: { type: String, required: true, default: "fruitygo", index: true },
    schemaVersion: { type: String, default: "finsync_v2" },
    transactionId: { type: String, required: true, trim: true, index: true },
    transactionDate: { type: Date, required: true, index: true },
    currency: { type: String, default: "NPR" },

    importedOn: { type: Date, default: Date.now, index: true },

    orderTotals: { type: orderTotalsSchema, default: () => ({}) },
    lineItems: { type: [lineItemSchema], default: [] },
    journalEntries: { type: [journalEntrySchema], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

recordSchema.index({ orgName: 1, transactionId: 1 });

const RecordModel = mongoose.model("Record", recordSchema);

export default RecordModel;
