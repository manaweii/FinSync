import mongoose from "mongoose";

const { Schema } = mongoose;

const importSchema = new Schema(
  {
    // file details
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },          // "CSV" or "Excel"
    importedOn: { type: Date, default: Date.now },
    records: { type: Number, required: true },       // number of rows
    importedData: { type: String, required: true },   // JSON string of imported data
    status: {
      type: String,
      default: "Success",                            // "Success" or "Failed"
    },

    // who imported
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },

    // which organization
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    orgName: { type: String, required: true },

    // additional notes
    notes: { type: String },
  },
  { timestamps: true }
);

const ImportModel = mongoose.model("Import", importSchema);

export default ImportModel;
