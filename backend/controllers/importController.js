import ImportModel from "../models/Import.js";

export const importData = async (req, res) => {
  try {
    const { fileName, type, rows } = req.body;      // client sends these
    const userId = req.user?._id;                   // from auth middleware
    const userName = req.user?.name;
    const tenantId = req.user?.tenantId || req.headers["x-tenant-id"];

    if (!fileName || !rows || !Array.isArray(rows)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const newImport = await ImportModel.create({
      fileName,
      type: type || "CSV",
      records: rows.length,
      status: "Success",
      importedByName: userName,
      importedByUserId: userId,
      tenantId,
      notes: "",
    });

    // optionally: process `rows` and insert into a Transactions collection here

    res.status(201).json(newImport);
  } catch (err) {
    console.error("Error saving import:", err);
    res.status(500).json({ message: "Failed to save import" });
  }
};

export const getImportsForTenant = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.headers["x-tenant-id"];
    const imports = await ImportModel.find({ tenantId })
      .sort({ createdAt: -1 });
    res.status(200).json(imports);
  } catch (err) {
    console.error("Error fetching imports:", err);
    res.status(500).json({ message: "Failed to load imports" });
  }
};
