import mongoose from "mongoose";

const { Schema } = mongoose;

const importSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId },

    // file details
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },          // "CSV" or "Excel"
    importedOn: { type: Date, default: Date.now },
    records: { type: Number, required: true },       // number of rows
    status: {
      type: String,
      default: "Success",                            // "Success" or "Failed"
    },

    // who imported
    importedByName: { type: String },                
    importedByUserId: { type: Schema.Types.ObjectId, ref: "User" },

    // optional: which organization / tenant
    tenantId: { type: String },                      

    // optional: for debugging / notes (e.g. error message)
    notes: { type: String },
  },
  { timestamps: true }
);

const ImportModel = mongoose.model("Import", importSchema);

export default ImportModel;
