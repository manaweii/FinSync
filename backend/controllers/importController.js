import ImportModel from "../models/Import.js";

export const uploadFile = async (req, res) => {
  try {
    const { fileName, fileType, records, data } = req.body;      // client sends these
    const userId = req.user?._id;                   // from auth middleware
    const userName = req.user?.name;
    const orgId = req.user?.orgId || req.headers["x-org-id"];
    // orgname
    
    if (!fileName || !data || !Array.isArray(data)) {
      return res.status(400).json({ message: "Invalid payload" });
    }
    
    const newImport = await ImportModel.create({
      fileName,
      fileType: fileType || "CSV",
      importedOn: Date.now(),
      records: records ?? data.length,
      status: "Success",
      importedByName: userName || "",
      importedByUserId: userId || null,
      orgId: orgId || "",
      notes: "",
      importedData: JSON.stringify(data),
    });

    // optionally: process `rows` and insert into a Transactions collection here

    res.status(201).json(newImport);
  } catch (err) {
    console.error("Error saving import:", err);
    res.status(500).json({ message: "Failed to save import" });
  }
};

// Get past imports for the organization
export const pastImportData = async (req, res) => {
  try {
    const orgId = req.user?.orgId || req.headers["x-org-id"];
    const imports = await ImportModel.find({ orgId })
      .sort({ createdAt: -1 });
    res.status(200).json(imports);
  } catch (err) {
    console.error("Error fetching imports:", err);
    res.status(500).json({ message: "Failed to load imports" });
  }
};
