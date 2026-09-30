import { Tick } from "@oqa/ui";

const points = [
  {
    title: "We never change your code",
    body: "Access is read-only. We can look, and we can't edit anything.",
  },
  {
    title: "Your tests live in your repo",
    body: "They're committed to your GitHub, not held on our side.",
  },
  {
    title: "Your secrets stay encrypted",
    body: "Anything sensitive you share is stored encrypted, and we don't put it in reports.",
  },
];

export function Trust() {
  return (
    <section aria-labelledby="trust" className="mx-auto w-full max-w-7xl px-4 pb-32 sm:px-6 md:pb-56">
      <h2 id="trust" className="vc-display text-[clamp(2.25rem,4.4vw,3.75rem)]">
        Safe by default.
      </h2>
      <ul className="border-line mt-16 grid border-t md:mt-24 md:grid-cols-3">
        {points.map((p, i) => (
          <li
            key={p.title}
            className={`border-line nm-emerge py-10 md:py-14 ${i > 0 ? "border-t md:border-l md:border-t-0" : ""} ${
              i === 0 ? "md:pr-12" : "md:px-12"
            }`}
          >
            <Tick className="text-accent-text h-6 w-6" />
            <h3 className="mt-8 text-xl font-normal leading-tight tracking-[-0.02em] md:text-2xl">{p.title}</h3>
            <p className="text-ink-soft mt-3 max-w-[32ch] text-lg font-light">{p.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
