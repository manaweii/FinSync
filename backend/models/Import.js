import mongoose from "mongoose";

const { Schema } = mongoose;

const importSchema = new Schema(
  {
    fileName: { type: String, required: true },
    type: { type: String },          // CSV or Excel
    importedOn: { type: String },    // simple formatted string
    records: { type: String },       // you can change to Number later
    status: { type: String, default: "Success" },

  },
  { timestamps: true }
);

const ImportModel = mongoose.model("Import", importSchema);

export default ImportModel;
