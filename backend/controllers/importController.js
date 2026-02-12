import ImportModel from "../models/Import.js";

export const uploadFile = async (req, res) => {
  try {
    const { fileName, fileType, records, data, userId, userName, orgId, orgName } = req.body;      // client may send uploader info

    // basic payload validation
    if (!fileName || !data || !Array.isArray(data)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    // auth / org validation – these are required in the schema
    if (!userId || !userName || !orgId || !orgName) {
      return res
        .status(400)
        .json({ message: "Missing user / organization context for import" });
    }

    const newImport = await ImportModel.create({
      fileName,
      fileType: fileType || "CSV",
      importedOn: Date.now(),
      records: records ?? data.length,
      status: "Success",
      userName,
      userId,
      orgId,
      orgName,
      notes: "",
      importedData: JSON.stringify(data),
    });

    // process `rows` and insert into a Transactions collection

    res.status(201).json(newImport);
  } catch (err) {
    console.error("Error saving import:", err);
    res.status(500).json({ message: "Failed to save import" });
  }
};

// Get past imports for the organization
export const pastImportData = async (req, res) => {
  try {
    const orgId = req.params?.orgId;
     if (!orgId) {
      return res
        .status(400)
        .json({ message: "Organization context is required" });
    }
    
    const imports = await ImportModel.find({ orgId })
      .sort({ createdAt: -1 });
    res.status(200).json(imports);
  } catch (err) {
    console.error("Error fetching imports:", err);
    res.status(500).json({ message: "Failed to load imports" });
  }
};
