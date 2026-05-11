import Organization from "../models/Organization.js";
import { sendDisabledNotificationEmail } from "../services/emailService.js";

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

    // If org is being disabled, send notification to its contact email
    try {
      if (updates.status && String(updates.status).toLowerCase() === 'disabled') {
        const to = updated.contactEmail || updated.BillingEmail || updated.email;
        const orgName = updated.orgName || updated.name || null;
        const disabledBy = (req.user && req.user.email) || 'admin';
        const reason = updates.disableReason || updates.reason || 'Manual disable by administrator';
        const effectiveDate = new Date().toISOString();
        if (to) {
          // best-effort notify; don't block the response if mail fails
          sendDisabledNotificationEmail({ to, name: null, orgName, disabledBy, reason, effectiveDate }).catch((e) => {
            console.error('Failed to send disabled notification for org:', e.message || e);
          });
        }
      }
    } catch (mailErr) {
      console.warn('sendDisabledNotificationEmail threw:', mailErr && mailErr.message);
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