import { ArrowRight, Check, ChevronDown, FileUp, GitBranch, ShieldCheck } from "lucide-react";
import { Cabinet, Format, Plot, Relay } from "@lucasmarkes/hairline/react";
import { Link } from "react-router-dom";

const figure = { theme: "light" as const, play: true, intensity: 0.72 };

export const LandingPage = () => (
  <main className="landing-shell bg-white text-[#111] min-h-screen overflow-x-hidden">
    <nav className="landing-nav h-[72px] flex items-center justify-between px-[6vw] border-b border-[#e8e8e2] relative z-10">
      <Link to="/" className="font-extrabold tracking-[-.1em] text-[19px]">MECH<span className="ml-1 bg-[#111] text-white text-[10px] px-1 py-0.5 tracking-[-.04em]">G</span></Link>
      <div className="hidden sm:flex gap-7 text-[11px] font-bold"><a href="#workflow">Workflow</a><a href="#integrity">Integrity</a><a href="#mission">Missions</a></div>
      <Link to="/notebooks" className="ink-cta">Open workspace <ArrowRight size={15}/></Link>
    </nav>

    <section className="min-h-[calc(100svh-72px)] grid lg:grid-cols-2 gap-8 px-[9vw] py-[min(12vw,130px)] relative">
      <div className="self-center max-w-[650px] relative z-10">
        <p className="eyebrow landing-reveal">Mission intelligence, held to the source.</p>
        <h1 className="text-[clamp(48px,6.6vw,104px)] leading-[.91] tracking-[-.085em] font-bold m-0 landing-reveal delay-1">Know what to do<br/><em className="font-light not-italic">before</em> you touch it.</h1>
        <p className="max-w-[485px] text-[15px] sm:text-[16px] leading-7 text-[#5d5d56] mt-8 landing-reveal delay-2">MECH-G turns the manuals, service records, and field knowledge for one mission into an offline-ready, verifiable engineering notebook.</p>
        <div className="flex gap-5 items-center mt-8 landing-reveal delay-3"><Link to="/notebooks" className="ink-cta">Create a mission <ArrowRight size={17}/></Link><a href="#workflow" className="text-[11px] font-bold inline-flex gap-2 items-center">See the system <ChevronDown size={15}/></a></div>
      </div>
      <div className="self-center max-w-[650px] mx-auto w-full hairline-light landing-visual relative"><Cabinet {...figure} label="A cabinet of mission documents"/><span className="landing-tag top-10 right-0">Manuals become context</span><span className="landing-tag bottom-16 left-0">One mission. One memory.</span></div>
      <div className="absolute left-0 bottom-0 bg-[#111] h-px w-[45vw] landing-rule"/><p className="hidden lg:block absolute right-[9vw] bottom-8 max-w-[240px] text-[10px] leading-4 text-[#77776f]">Built for field engineers operating under pressure, in poor connectivity, with no room for invented instructions.</p>
    </section>

    <section id="workflow" className="border-t border-[#e6e6df] px-[9vw] py-[clamp(80px,11vw,150px)] grid lg:grid-cols-[.35fr_.65fr] gap-12 overflow-hidden">
      <p className="section-index">01 — The working loop</p>
      <div><h2 className="landing-heading">From scattered evidence to a defensible next move.</h2><p className="landing-copy">Every mission begins with the material engineers already trust. MECH-G compiles it into a linked OKF knowledge graph, then keeps every answer in view of that evidence.</p></div>
      <div className="lg:col-span-2 grid md:grid-cols-3 gap-9 mt-8 relative"><div className="step-line"/>
        <Step n="01" icon={<FileUp size={20}/>} title="Bring the evidence" body="Upload OEM manuals, procedures, schematics, notes, and reports to the mission."/>
        <Step n="02" icon={<GitBranch size={20}/>} title="Build the context" body="Documents compile into traceable, connected OKF nodes—locally."/>
        <Step n="03" icon={<ShieldCheck size={20}/>} title="Work with proof" body="Ask, diagnose, resolve, and export—with citations and safety prerequisites intact."/>
      </div>
      <div className="lg:col-start-2 max-w-[530px] mx-auto hairline-light w-full"><Relay {...figure} label="A mission workflow path"/></div>
    </section>

    <section id="integrity" className="border-t border-[#e6e6df] px-[9vw] py-[clamp(80px,11vw,150px)] grid lg:grid-cols-2 gap-[10vw] items-center"><div className="hairline-light"><Format {...figure} label="A document becoming structured knowledge"/></div><div><p className="section-index">02 — A source has to hold up</p><h2 className="landing-heading">The answer is not the record. It points back to it.</h2><p className="landing-copy">Citations are verified against the active knowledge graph. Safety steps are surfaced before execution. A mission report keeps its evidence, reasoning, and issue history together.</p><ul className="list-none p-0 mt-6">{["Offline-first graph retrieval", "Citation verification against local sources", "Safety-gated repair guidance"].map(item => <li key={item} className="py-3 border-b border-[#e2e2dc] text-[12px] flex gap-2"><Check size={15}/>{item}</li>)}</ul></div></section>

    <section id="mission" className="bg-[#111] text-white px-[9vw] py-[clamp(80px,11vw,150px)] grid lg:grid-cols-[.85fr_1.15fr] gap-[8vw] items-center"><div><p className="section-index text-[#b7b7af]">03 — The notebook is the boundary</p><h2 className="landing-heading">New mission,<br/>clean context.</h2><p className="landing-copy text-[#b7b7af]">Keep different machines, sites, and incidents apart. Each notebook carries its own sources, chat history, graph, issue register, and exportable report.</p><Link to="/notebooks" className="bg-white text-[#111] border-white ink-cta mt-5">Start a mission <ArrowRight size={17}/></Link></div><div className="hairline-dark"><Plot {...figure} label="An interactive mission progress plot"/></div></section>
    <footer className="min-h-[115px] px-[9vw] py-7 flex flex-wrap gap-5 justify-between items-center text-[11px] text-[#6a6a62]"><span className="font-extrabold tracking-[-.1em] text-[#111] text-[18px]">MECH<span className="ml-1 bg-[#111] text-white text-[10px] px-1 py-0.5">G</span></span><p>Edge engineering intelligence for work that cannot be guessed.</p><Link to="/notebooks" className="text-[#111] font-bold flex gap-2 items-center">Enter workspace <ArrowRight size={14}/></Link></footer>
  </main>
);

function Step({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) { return <article className="relative z-[1] pt-4 border-t border-[#bdbdb5]"><span className="text-[10px] text-[#77776f]">{n}</span><div className="my-6">{icon}</div><h3 className="text-[17px] tracking-[-.04em] m-0">{title}</h3><p className="text-[12px] text-[#696960] leading-5 max-w-[250px]">{body}</p></article>; }
