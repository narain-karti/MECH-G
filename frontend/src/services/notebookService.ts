import { API_BASE, fetchWithTimeout } from "./apiClient";
import { SourceDocument } from "../types/workspace";

export interface EquipmentNotebook {
  id: string;
  title: string;
  description: string;
  model: string;
  category: string;
  location: string;
  status: "operational" | "degraded" | "maintenance";
  default_conversation_id?: string;
  source_count: number;
  issue_count: number;
  open_issue_count: number;
  created_at: string;
  updated_at: string;
}

export interface MachineIssue {
  id: string;
  notebook_id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical" | "warning" | "advisory";
  status: "open" | "investigating" | "fixed" | "resolved";
  component: string;
  part_number: string;
  defect: string;
  verified_torque: string;
  technician_id: string;
  citation_anchor: string;
  source_message_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export class NotebookService {
  static async listNotebooks(): Promise<EquipmentNotebook[]> {
    try {
      const res = await fetchWithTimeout("/api/notebooks");
      if (!res.ok) throw new Error("Failed to load equipment notebooks");
      return await res.json();
    } catch (err) {
      console.warn("Using local fallback notebooks:", err);
      return [
        {
          id: "nb-vestas-v112",
          title: "Vestas V112 Nacelle Pitch System",
          description: "Pitch control manifolds, hydraulic proportional valves, accumulator banks and emergency feathering.",
          model: "V112-3.45MW",
          category: "Wind Energy",
          location: "Offshore Horns Rev 3",
          status: "degraded",
          source_count: 3,
          issue_count: 2,
          open_issue_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "nb-siemens-sgt400",
          title: "Siemens SGT-400 Gas Turbine",
          description: "Twin-shaft industrial gas turbine for offshore power generation and high-pressure mechanical drive.",
          model: "SGT-400-15MW",
          category: "Turbomachinery",
          location: "North Sea Platform Alpha",
          status: "operational",
          source_count: 4,
          issue_count: 1,
          open_issue_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "nb-komatsu-930e",
          title: "Komatsu 930E-5 Mining Haul Truck",
          description: "Ultra-class haul truck featuring AC electric drive, high-flow hydraulic hoist cylinders, and wet disc braking.",
          model: "930E-5-AC",
          category: "Heavy Mining",
          location: "Pilbara Iron Ore Pit #2",
          status: "maintenance",
          source_count: 2,
          issue_count: 3,
          open_issue_count: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }
  }

  static async getNotebook(notebookId: string): Promise<EquipmentNotebook | null> {
    try {
      const res = await fetchWithTimeout(`/api/notebooks/${notebookId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      const all = await this.listNotebooks();
      return all.find((n) => n.id === notebookId) || all[0];
    }
  }

  static async createNotebook(payload: {
    title: string;
    description?: string;
    model?: string;
    category?: string;
    location?: string;
    status?: string;
  }): Promise<EquipmentNotebook> {
    const res = await fetchWithTimeout("/api/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create equipment notebook");
    return await res.json();
  }

  static async updateNotebook(
    notebookId: string,
    payload: Partial<EquipmentNotebook>
  ): Promise<EquipmentNotebook> {
    const res = await fetchWithTimeout(`/api/notebooks/${notebookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update equipment notebook");
    return await res.json();
  }

  static async deleteNotebook(notebookId: string): Promise<void> {
    const res = await fetchWithTimeout(`/api/notebooks/${notebookId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete equipment notebook");
  }

  static async listIssues(notebookId: string): Promise<MachineIssue[]> {
    try {
      const res = await fetchWithTimeout(`/api/notebooks/${notebookId}/issues`);
      if (!res.ok) throw new Error("Failed to fetch issues");
      return await res.json();
    } catch (err) {
      console.warn("Using sample issues fallback:", err);
      return [
        {
          id: "issue-vestas-01",
          notebook_id: notebookId,
          title: "PRV-992-B Proportional Relief Valve Seal Weepage",
          description: "High-pressure O-ring extrusion observed at PRV-992-B manifold interface under 210 bar load.",
          severity: "critical",
          status: "open",
          component: "Proportional Relief Valve",
          part_number: "PRV-992-B",
          defect: "Hydraulic extrusion leak under 210 bar load",
          verified_torque: "35 Nm (3-stage star pattern)",
          technician_id: "TECH-8842-OFFSHORE",
          citation_anchor: "SEC-4.2",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "issue-vestas-02",
          notebook_id: notebookId,
          title: "PCB Bus Capacitor C14 Voltage Degradation",
          description: "Capacitor ripple voltage exceeded 5.2% tolerance. Replaced and calibrated under PB-2026-08.",
          severity: "warning",
          status: "fixed",
          component: "Pitch Controller PCB",
          part_number: "PCB-V112-CTRL",
          defect: "Capacitor dielectric breakdown",
          verified_torque: "45 Nm",
          technician_id: "TECH-8842-OFFSHORE",
          citation_anchor: "ELEC-7.1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
        },
      ];
    }
  }

  static async createIssue(notebookId: string, payload: Partial<MachineIssue>): Promise<MachineIssue> {
    const res = await fetchWithTimeout(`/api/notebooks/${notebookId}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create machine issue");
    return await res.json();
  }

  static async updateIssue(
    notebookId: string,
    issueId: string,
    payload: Partial<MachineIssue>
  ): Promise<MachineIssue> {
    const res = await fetchWithTimeout(`/api/notebooks/${notebookId}/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update machine issue");
    return await res.json();
  }

  static async deleteIssue(notebookId: string, issueId: string): Promise<void> {
    const res = await fetchWithTimeout(`/api/notebooks/${notebookId}/issues/${issueId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete machine issue");
  }

  static async listNotebookDocuments(notebookId: string): Promise<SourceDocument[]> {
    try {
      const res = await fetchWithTimeout(`/api/notebooks/${notebookId}/documents`);
      if (!res.ok) throw new Error("Failed to fetch notebook documents");
      return await res.json();
    } catch {
      return [];
    }
  }
}
