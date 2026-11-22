import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Clock3, Plus, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { MissionNotebook } from "../types/mission";
import { MissionService } from "../services/missionService";

export function NotebookHomePage() {
  const [notebooks, setNotebooks] = useState<MissionNotebook[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = () => MissionService.list().then(setNotebooks).catch(() => setError("The mission library is unavailable. Start the local API and try again."));
  useEffect(() => { load(); }, []);

  async function createMission(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length < 2) { setError("Give this mission a clear name."); return; }
    setSaving(true); setError("");
    try { const mission = await MissionService.create(title, description); navigate(`/notebooks/${mission.id}`); }
    catch { setError("The notebook could not be created. Please try again."); }
    finally { setSaving(false); }
  }

  return <main className="library-page">
    <header className="library-nav"><Link to="/" className="wordmark"><span>MECH</span><i>G</i></Link><Link to="/" className="back-link">← Overview</Link></header>
    <section className="library-intro"><p className="eyebrow">Mission library</p><h1>Every job gets<br />its own memory.</h1><p>Create one notebook for one machine, site, incident, or campaign. Its documents and decisions stay inside the boundary you set.</p><button className="ink-button" onClick={() => setShowCreate(true)}><Plus size={17}/> New mission</button></section>
    <section className="notebook-list" aria-label="Mission notebooks">
      {error && <p className="library-error">{error}</p>}
      {notebooks.length === 0 && !error && <div className="empty-library"><Sparkles size={22}/><h2>Your first mission starts here.</h2><p>Name the mission, add the evidence, then ask the first question.</p><button className="ink-button" onClick={() => setShowCreate(true)}>Create mission <ArrowRight size={17}/></button></div>}
      {notebooks.map((notebook, index) => <Link className="notebook-row" to={`/notebooks/${notebook.id}`} key={notebook.id}>
        <span className="notebook-number">{String(index + 1).padStart(2, "0")}</span><div><h2>{notebook.title}</h2><p>{notebook.description || "Untitled field mission"}</p></div><div className="notebook-meta"><span><BookOpen size={14}/>{notebook.source_count} sources</span><span>{notebook.open_issue_count} open issues</span><span><Clock3 size={14}/> Open</span></div><ArrowRight className="row-arrow" size={20}/>
      </Link>)}
    </section>
    {showCreate && <div className="mission-modal" role="dialog" aria-modal="true" aria-label="Create a mission notebook"><form onSubmit={createMission}><button type="button" className="modal-close" onClick={() => setShowCreate(false)}>×</button><p className="eyebrow">New mission notebook</p><h2>Give this work a boundary.</h2><p>The documents, conversations, issues, and report you create here belong to this mission.</p><label>Mission name<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Turbine 14 / hydraulic pressure loss" /></label><label>What is this mission about? <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Asset, location, scope, or current condition" /></label>{error && <small className="library-error">{error}</small>}<button className="ink-button" type="submit" disabled={saving}>{saving ? "Creating…" : "Create notebook"}<ArrowRight size={17}/></button></form></div>}
  </main>;
}
