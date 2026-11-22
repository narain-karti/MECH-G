export type IssueStatus = "open" | "investigating" | "resolved";
export type IssueSeverity = "low" | "medium" | "high" | "critical";

export interface MissionNotebook {
  id: string;
  title: string;
  description: string;
  default_conversation_id?: string | null;
  source_count: number;
  issue_count: number;
  open_issue_count: number;
  created_at: string;
  updated_at: string;
}

export interface MissionIssue {
  id: string;
  notebook_id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  source_message_id?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface MissionReport {
  notebook: MissionNotebook;
  generated_at: string;
  sources: Array<{ filename: string; status: string; concepts_count: number }>;
  issues: MissionIssue[];
  messages: Array<{ role: string; content: string; created_at?: string }>;
}
