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

// Get a single import by id and return parsed rows and a small summary
export const getImportById = async (req, res) => {
  try {
    const id = req.params?.id;
    if (!id) return res.status(400).json({ message: 'Import id is required' });

    const imp = await ImportModel.findById(id).lean();
    if (!imp) return res.status(404).json({ message: 'Import not found' });

    let rows = [];
    try {
      rows = JSON.parse(imp.importedData);
      if (!Array.isArray(rows)) rows = [];
    } catch (e) {
      // fallback: if stored differently
      rows = imp.data || [];
    }

    // determine columns from first row
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    // create simple numeric totals for numeric-like columns (if any)
    const totals = {};
    if (rows.length > 0) {
      for (const col of columns) {
        let isNumeric = true;
        let sum = 0;
        for (const r of rows) {
          const val = r[col];
          const num = typeof val === 'number' ? val : (val === null || val === undefined ? NaN : parseFloat(String(val).replace(/[,\s]/g, '')));
          if (Number.isFinite(num)) {
            sum += num;
          } else {
            isNumeric = false;
            break;
          }
        }
        if (isNumeric) totals[col] = sum;
      }
    }

    const previewRows = rows.slice(0, 200);

    res.json({
      id: imp._id,
      fileName: imp.fileName,
      fileType: imp.fileType,
      importedOn: imp.importedOn,
      records: imp.records,
      userId: imp.userId,
      userName: imp.userName,
      orgId: imp.orgId,
      orgName: imp.orgName,
      columns,
      previewRows,
      totals,
    });
  } catch (err) {
    console.error('getImportById error:', err);
    res.status(500).json({ message: 'Failed to load import details' });
  }
};
