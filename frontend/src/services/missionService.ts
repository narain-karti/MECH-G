import { fetchWithTimeout } from "./apiClient";
import { MissionIssue, MissionNotebook, MissionReport } from "../types/mission";

export class MissionService {
  static async list(): Promise<MissionNotebook[]> {
    const response = await fetchWithTimeout("/api/notebooks");
    if (!response.ok) throw new Error("Could not load mission notebooks.");
    return response.json();
  }

  static async get(id: string): Promise<MissionNotebook> {
    const response = await fetchWithTimeout(`/api/notebooks/${id}`);
    if (!response.ok) throw new Error("Mission notebook was not found.");
    return response.json();
  }

  static async create(title: string, description: string): Promise<MissionNotebook> {
    const response = await fetchWithTimeout("/api/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }

  static async issues(notebookId: string): Promise<MissionIssue[]> {
    const response = await fetchWithTimeout(`/api/notebooks/${notebookId}/issues`);
    if (!response.ok) throw new Error("Could not load the issue register.");
    return response.json();
  }

  static async createIssue(notebookId: string, title: string, description = "", severity = "medium"): Promise<MissionIssue> {
    const response = await fetchWithTimeout(`/api/notebooks/${notebookId}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, severity }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }

  static async updateIssue(notebookId: string, issueId: string, values: Partial<MissionIssue>): Promise<MissionIssue> {
    const response = await fetchWithTimeout(`/api/notebooks/${notebookId}/issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }

  static async report(notebookId: string): Promise<MissionReport> {
    const response = await fetchWithTimeout(`/api/notebooks/${notebookId}/report`);
    if (!response.ok) throw new Error("Could not create the mission report.");
    return response.json();
  }
}
