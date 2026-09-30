import type { CSSProperties } from "react";
import { Led } from "./Ornaments";

const AGENTS = [
  {
    name: "Explorer",
    body: "Explores your app like a new visitor would: signing up, searching, adding to the cart, paying.",
    tint: "nm-sky",
  },
  {
    name: "Test writer",
    body: "Saves what the Explorer learned as Cucumber tests in your own GitHub repo.",
    tint: "nm-mint",
  },
  {
    name: "Runner",
    body: "Runs every test each night against your live app, then works out whether a failure is a real bug or a test that has gone out of date.",
    tint: "nm-butter",
  },
  {
    name: "Reporter",
    body: "Writes the morning email in plain English, real bugs first, each with a markdown prompt for your coding agent.",
    tint: "nm-lilac",
  },
];

/**
 * The agentic QA system, explained as a relay: four agents with one job each hand work along
 * a track. A failure splits two ways: a real bug goes on to the Reporter, and an out-of-date
 * test goes back to the Test writer. Pure CSS 3D; a still picture under reduced motion.
 */
export function AgentSystem() {
  return (
    <section aria-labelledby="agents" className="agents overflow-x-clip">
      <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 py-32 sm:px-6 md:grid-cols-12 md:items-center md:gap-10 md:py-56">
        <div className="min-w-0 md:col-span-5">
          <h2 id="agents" className="vc-display text-[clamp(2.25rem,4.4vw,3.75rem)]">
            Four agents. One job each.
          </h2>
          <p className="text-ink-soft mt-7 max-w-[46ch] text-xl">
            They hand work to each other every night. When a test fails, the Runner decides whether
            your app broke or the test went stale, so the email leads with real bugs.
          </p>

          <ol className="border-line mt-12 border-b">
            {AGENTS.map((agent, i) => (
              <li
                key={agent.name}
                data-k={i}
                className="border-line grid grid-cols-[2.5rem_1fr] items-start gap-x-4 border-t py-6"
              >
                <span aria-hidden="true" className="text-accent-text text-lg font-light tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-xl font-normal tracking-[-0.02em]">{agent.name}</h3>
                  <p className="text-ink-soft mt-2 max-w-[46ch] font-light">{agent.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="min-w-0 md:col-span-7">
          <div
            role="img"
            aria-label="A track with four stations: Explorer, Test writer, Runner and Reporter. Work moves along the track. After the Runner, a real bug carries on to the Reporter, and an out-of-date test loops back to the Test writer."
            className="agents-scene"
          >
            <div className="flow">
              <span className="track track--main" />
              <span className="track track--down" />
              <span className="track track--back" />
              <span className="track track--up" />
              {AGENTS.map((agent, i) => (
                <span key={agent.name} data-k={i} className="station" style={{ "--k": i } as CSSProperties}>
                  {i + 1}
                  <span className="station-tag">
                    <span>{agent.name}</span>
                  </span>
                </span>
              ))}
              <span className="packet packet--bug" />
              <span className="packet packet--stale" />
            </div>
          </div>

          <ul className="text-ink-soft mt-4 space-y-2 text-base md:pl-4">
            <li className="flex items-center gap-3">
              <Led tone="rose" />
              A real bug goes to your report, with a prompt to fix it.
            </li>
            <li className="flex items-center gap-3">
              <Led tone="mint" />
              An out-of-date test goes back to the Test writer to be updated.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
