import type { CSSProperties } from "react";

const LANES = [
  {
    name: "Your systems",
    body: "Your live app, your GitHub repo and your inbox. We read and run; we never change your code.",
  },
  {
    name: "The agents",
    body: "The Explorer, Test writer, Runner and Reporter work in a line, and each one looks things up in the knowledge layer before it acts.",
  },
  {
    name: "Knowledge (RAG)",
    body: "Your docs, BRDs and tickets are split into chunks and indexed. Every answer cites the chunk it came from, and “not found in sources” is an allowed answer.",
  },
  {
    name: "Evals and people",
    body: "Evals replay known cases against the agents and score the results, so a change is checked before tonight's run. A person always reviews, maintains and customizes the agents.",
  },
];

const AGENTS = [
  { name: "Explorer", x: 40, lines: ["Walks your app like", "a new visitor"] },
  { name: "Test writer", x: 280, lines: ["Saves the flows as", "Cucumber tests"] },
  { name: "Runner", x: 520, lines: ["Runs them on your", "live app each night"] },
  { name: "Reporter", x: 760, lines: ["Real bugs first, each", "with a fix prompt"] },
];

function Tag({ x, y, w, children }: { x: number; y: number; w: number; children: string }) {
  return (
    <g className="dg-tag">
      <rect x={x} y={y - 11} width={w} height={22} rx={11} />
      <text x={x + w / 2} y={y + 4.5} textAnchor="middle">
        {children}
      </text>
    </g>
  );
}

/**
 * The agent architecture drawn as a solutions architect would: systems on top, the four agents in
 * a line, the knowledge layer (RAG) below them, and evals with a person underneath. Dashed lines
 * carry data; the agents light up in turn. Desktop draws the diagram, small screens get the list.
 */
export function ArchSystem() {
  return (
    <section aria-labelledby="arch" className="mx-auto w-full max-w-7xl px-4 pb-32 sm:px-6 md:pb-56">
      <h2 id="arch" className="vc-display text-[clamp(2.25rem,4.4vw,3.75rem)]">
        How the agents are built.
      </h2>
      <p className="text-ink-soft mt-7 max-w-[52ch] text-xl font-light">
        Four agents in a line, a knowledge layer they all read from, and evals and a person keeping
        them honest.
      </p>

      <div
        role="img"
        aria-label="Architecture diagram. Top: your live app, your GitHub repo and your inbox. Below: the Explorer, Test writer, Runner and Reporter agents in a line. Below them: the knowledge layer (RAG), fed by your docs, BRDs and tickets, which every agent reads. At the bottom: evals and a person, whose findings feed back to the agents."
        className="mt-14 hidden lg:block"
      >
        <svg className="dg" viewBox="0 0 1040 620" aria-hidden="true" focusable="false">
          <defs>
            <marker id="dg-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M1 1.5 9 5 1 8.5z" className="dg-head" />
            </marker>
            <marker id="dg-arrow-feed" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M1 1.5 9 5 1 8.5z" className="dg-head dg-head--feed" />
            </marker>
          </defs>

          {/* lanes */}
          <rect className="dg-lane" x={16} y={16} width={968} height={116} rx={18} />
          <rect className="dg-lane" x={16} y={168} width={968} height={154} rx={18} />
          <rect className="dg-lane" x={16} y={350} width={968} height={150} rx={18} />
          <rect className="dg-lane" x={16} y={530} width={968} height={76} rx={18} />
          <Tag x={196} y={16} w={112}>Your systems</Tag>
          <Tag x={196} y={168} w={96}>The agents</Tag>
          <Tag x={196} y={350} w={132}>Knowledge (RAG)</Tag>
          <Tag x={196} y={530} w={140}>Evals and people</Tag>

          {/* your systems */}
          <rect className="dg-box" x={40} y={50} width={200} height={66} rx={12} />
          <text className="dg-title" x={60} y={78}>Your live app</text>
          <text className="dg-sub" x={60} y={98}>the URL you paste</text>
          <rect className="dg-box" x={280} y={50} width={440} height={66} rx={12} />
          <text className="dg-title" x={300} y={78}>Your GitHub repo</text>
          <text className="dg-sub" x={300} y={98}>Cucumber tests, committed to your repo</text>
          <rect className="dg-box" x={760} y={50} width={200} height={66} rx={12} />
          <text className="dg-title" x={780} y={78}>Your inbox</text>
          <text className="dg-sub" x={780} y={98}>email and fix prompts</text>

          {/* agents to systems */}
          <path className="dg-flow dg-flow--dash" d="M140 204V118" markerEnd="url(#dg-arrow)" />
          <path className="dg-flow dg-flow--dash" d="M380 204V118" markerEnd="url(#dg-arrow)" />
          <path className="dg-flow dg-flow--dash" d="M560 118V202" markerEnd="url(#dg-arrow)" />
          <path className="dg-flow dg-flow--dash" d="M680 204V150H190V118" markerEnd="url(#dg-arrow)" />
          <path className="dg-flow dg-flow--dash" d="M860 204V118" markerEnd="url(#dg-arrow)" />

          {/* agents */}
          {AGENTS.map((a, i) => (
            <g key={a.name}>
              <rect className="dg-agent" style={{ "--i": i } as CSSProperties} x={a.x} y={204} width={200} height={94} rx={14} />
              <text className="dg-agent-title" x={a.x + 20} y={238}>{a.name}</text>
              <text className="dg-sub" x={a.x + 20} y={262}>{a.lines[0]}</text>
              <text className="dg-sub" x={a.x + 20} y={280}>{a.lines[1]}</text>
              {i < 3 ? <path className="dg-flow" d={`M${a.x + 202} 251H${a.x + 238}`} markerEnd="url(#dg-arrow)" /> : null}
              <path className="dg-flow dg-flow--dash" d={`M${a.x + 100} 300V380`} markerStart="url(#dg-arrow)" markerEnd="url(#dg-arrow)" />
            </g>
          ))}

          {/* knowledge layer */}
          <rect className="dg-rag" x={40} y={382} width={920} height={36} rx={12} />
          <text className="dg-title" x={60} y={405}>Retrieval</text>
          <text className="dg-sub" x={150} y={405}>every answer cites its source chunk, or says “not found in sources”</text>
          <rect className="dg-rag" x={40} y={438} width={220} height={44} rx={12} />
          <text className="dg-sub" x={60} y={465} style={{ fill: "var(--ink)" }}>Docs, BRDs, tickets</text>
          <rect className="dg-rag" x={300} y={438} width={200} height={44} rx={12} />
          <text className="dg-sub" x={320} y={465} style={{ fill: "var(--ink)" }}>Chunk and index</text>
          <rect className="dg-rag" x={540} y={438} width={200} height={44} rx={12} />
          <text className="dg-sub" x={560} y={465} style={{ fill: "var(--ink)" }}>Vector index</text>
          <path className="dg-flow dg-flow--dash" d="M262 460H298" markerEnd="url(#dg-arrow)" />
          <path className="dg-flow dg-flow--dash" d="M502 460H538" markerEnd="url(#dg-arrow)" />
          <path className="dg-flow dg-flow--dash" d="M640 436V420" markerEnd="url(#dg-arrow)" />

          {/* evals and people */}
          <rect className="dg-eval" x={40} y={544} width={440} height={48} rx={12} />
          <text className="dg-title" x={60} y={565}>Evals</text>
          <text className="dg-sub" x={60} y={582}>Replay known cases, score every change before tonight’s run</text>
          <rect className="dg-human" x={520} y={544} width={440} height={48} rx={12} />
          <text className="dg-title" x={540} y={565}>A person, always</text>
          <text className="dg-sub" x={540} y={582}>Reviews, maintains and customizes the agents</text>
          <path className="dg-flow dg-flow--dash" d="M482 568H518" markerEnd="url(#dg-arrow)" />

          {/* feedback rail */}
          <path className="dg-flow dg-flow--dash dg-flow--feed" d="M986 568H1016V251H988" markerEnd="url(#dg-arrow-feed)" />
          <text className="dg-rail" textAnchor="middle" transform="rotate(-90 1032 410)" x={1032} y={410}>
            feedback
          </text>
        </svg>
      </div>

      <ol className="border-line mt-12 grid border-t sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
        {LANES.map((lane) => (
          <li
            key={lane.name}
            className="border-line border-t py-8 sm:px-6 lg:border-t-0 lg:border-l lg:first:border-l-0 lg:first:pl-0">
            <h3 className="text-xl font-normal tracking-[-0.02em]">{lane.name}</h3>
            <p className="text-ink-soft mt-2 max-w-[38ch] font-light">{lane.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
