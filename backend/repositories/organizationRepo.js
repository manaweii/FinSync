import Organization from "../models/Organization.js";

export async function CreateOrganization(req, res) {
  try {
    const doc = req.body;
    console.log("CreateOrganization body:", doc);
    const created = await Organization.create(doc);
    res.status(201).json({ message: "Organization created", organization: created });
  } catch (err) {
    console.error("Error creating org:", err);
    res.status(500).json({ message: "Failed to create organization", error: err.message });
  }
}

export async function LoadOrganization(req, res) {
  try {
    const orgs = await Organization.find();
    res.status(200).json(orgs);
  } catch (err) {
    console.error("Error fetching orgs:", err);
    res.status(500).json({ message: "Failed to fetch organizations" });
  }
}

// Update an organization by id (route handler)
export async function UpdateOrganization(req, res) {
  try {
    const id = req.params.id;
    const updates = req.body;
    if (!id) {
      return res.status(400).json({ message: "Organization id is required" });
    }

    const updated = await Organization.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.status(200).json({ message: "Organization updated", organization: updated });
  } catch (err) {
    console.error("Error updating organization:", err);
    res.status(500).json({ message: "Failed to update organization", error: err.message });
  }
}

// Delete an organization by id (route handler)
export async function DeleteOrganization(req, res) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: "Organization id is required" });
    }

    const deleted = await Organization.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.status(200).json({ message: "Organization deleted", organization: deleted });
  } catch (err) {
    console.error("Error deleting organization:", err);
    res.status(500).json({ message: "Failed to delete organization", error: err.message });
  }
}