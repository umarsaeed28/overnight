const faqs = [
  {
    q: "Is my code safe?",
    a: "Yes. We only get read-only access, so we can look at your code but never change it. The tests we write go into your own GitHub repo, and any secrets you share are stored encrypted.",
  },
  {
    q: "Which builders are supported?",
    a: "Any app with a public web address. That covers Vercel, Lovable, Bolt, Replit, Netlify and your own domain. If your app sits behind a login, we'll ask for a test account during setup.",
  },
  {
    q: "What's Cucumber?",
    a: "A way of writing tests as plain sentences, like “Given I have a tote in my cart, when I pay, then I see a thank-you message.” You can read them without knowing how to code, and they're just files in your repo.",
  },
  {
    q: "What if my app changes?",
    a: "Each night we notice what changed and update the tests that no longer match. Your report lists every test we changed, so nothing moves without you knowing.",
  },
  {
    q: "Can I leave?",
    a: "Any time. The tests are already in your GitHub repo, so they stay with you.",
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq" className="mx-auto w-full max-w-7xl px-4 pb-32 sm:px-6 md:pb-36">
      <div className="grid gap-12 md:grid-cols-12">
        <h2 id="faq" className="vc-display text-[clamp(2.25rem,4.4vw,3.75rem)] md:col-span-4">
          Questions.
        </h2>
        <div className="border-line border-t md:col-span-8">
          {faqs.map((item) => (
            <details key={item.q} className="border-line group border-b">
              <summary className="flex min-h-20 cursor-pointer items-center justify-between gap-6 py-6 text-xl font-normal leading-tight tracking-[-0.02em] md:text-2xl">
                {item.q}
                <span className="text-ink-soft grid h-8 w-8 shrink-0 place-items-center">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                    className="h-5 w-5 transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  >
                    <path d="M12 4.5v15M4.5 12h15" />
                  </svg>
                </span>
              </summary>
              <p className="text-ink-soft max-w-[62ch] pb-8 text-lg font-light">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
