"use client";

import { LeadForm } from "@/components/LeadForm";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { kv, leadUrl, lines, rows, type Block, type BlockProps } from "@/lib/content-data";

function HeroBlock({ p, lead }: { p: BlockProps; lead?: string }) {
  const center = p.center === "1";
  const withForm = p.form === "1";

  const headline = (
    <h1 className="anim-fade-up text-3xl font-bold leading-tight tracking-tight md:text-5xl anim-delay-200">
      <span className={center ? "" : "text-gradient"}>{p.title_a}</span>
      <br />
      <span className={center ? "text-gradient" : ""}>{p.title_b}</span>
    </h1>
  );
  const subtitle = p.subtitle && (
    <p
      className={`anim-fade-up mt-5 text-base leading-relaxed text-white/60 md:text-lg anim-delay-300 ${
        center ? "mx-auto" : "max-w-xl"
      }`}
    >
      {p.subtitle}
    </p>
  );
  const bullets = p.bullets && (
    <ul className="anim-fade-up mt-8 space-y-3 text-sm text-white/70 md:text-base anim-delay-400">
      {lines(p.bullets).map((t) => (
        <li key={t} className={`flex items-start gap-2.5 ${center ? "justify-center" : ""}`}>
          <span className="mt-0.5 block h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
          {t}
        </li>
      ))}
    </ul>
  );

  if (withForm) {
    return (
      <section className="flex flex-col items-center md:grid md:grid-cols-2 md:items-center md:gap-16">
        <div className="flex flex-col">
          {p.badge && (
            <span className="badge anim-fade-up mb-5 w-fit anim-delay-100">{p.badge}</span>
          )}
          {headline}
          {subtitle}
          {bullets}
        </div>
        <section className="glass glow-border anim-fade-up mt-10 w-full rounded-2xl p-6 shadow-xl md:mt-0 md:p-8 anim-delay-300">
          <h2 className="text-xl font-semibold">{p.form_title}</h2>
          <p className="mb-6 mt-1 text-sm text-white/50">{p.form_subtitle}</p>
          <LeadForm buttonTxt={p.button_txt} buttonTxtLoading={p.button_txt_loading} note={p.button_note} />
        </section>
      </section>
    );
  }

  return (
    <section className={`flex flex-col ${center ? "mx-auto max-w-2xl items-center text-center" : ""}`}>
      {p.badge && (
        <span className="badge anim-fade-up mb-5 w-fit anim-delay-100">{p.badge}</span>
      )}
      {headline}
      {subtitle}
      {bullets}
    </section>
  );
}

function FeatureListBlock({ p }: { p: BlockProps }) {
  const features = kv(p.features);
  return (
    <section className="anim-fade-up mt-12">
      {p.section_title && <h2 className="mb-5 text-lg font-semibold text-white/80">{p.section_title}</h2>}
      <ul className="space-y-3">
        {features.map((f, i) => (
          <li
            key={`${f.a}-${i}`}
            className="glass glow-border flex items-start gap-4 rounded-xl p-4 anim-fade-up"
            style={{ animationDelay: `${0.3 + i * 0.08}s` }}
          >
            <span className="mt-1 block h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
            <div>
              <strong className="text-white">{f.a}</strong>
              {f.b && <span className="ml-2 text-sm text-white/50">— {f.b}</span>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FeatureGridBlock({ p, lead }: { p: BlockProps; lead?: string }) {
  const items = rows(p.items).map((r) => ({
    title: r[0] ?? "",
    desc: r[1] ?? "",
    link: r[2] ?? "",
  }));
  return (
    <section className="anim-fade-up mt-12">
      {p.section_title && <h2 className="mb-5 text-lg font-semibold text-white/80">{p.section_title}</h2>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((c, i) => (
          <div key={i} className="glass glow-border flex flex-col rounded-xl p-5 anim-fade-up" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
            <strong className="text-white">{c.title}</strong>
            <p className="mt-1.5 text-sm leading-relaxed text-white/60">{c.desc}</p>
            {c.link && (
              <a href={leadUrl(c.link, lead)} className="mt-auto pt-3 text-sm font-medium text-[var(--accent)]">
                Selengkapnya →
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingBlock({ p, lead }: { p: BlockProps; lead?: string }) {
  const plans = rows(p.items).map((r) => ({
    plan: r[0] ?? "",
    price: r[1] ?? "",
    period: r[2] ?? "",
    features: (r[3] ?? "").split(";").map((s) => s.trim()).filter(Boolean),
    cta_txt: r[4] ?? "",
    cta_href: r[5] ?? "",
  }));
  return (
    <section className="anim-fade-up mt-12">
      {p.section_title && <h2 className="mb-5 text-lg font-semibold text-white/80">{p.section_title}</h2>}
      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((pl, i) => (
          <div key={i} className="glass glow-border flex flex-col rounded-2xl p-6 anim-fade-up" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">{pl.plan}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="price-tag text-3xl">{pl.price}</span>
              {pl.period && <span className="text-xs text-white/40">/ {pl.period}</span>}
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-white/60">
              {pl.features.map((f, j) => (
                <li key={j}>• {f}</li>
              ))}
            </ul>
            {pl.cta_txt && pl.cta_href && (
              <a
                href={leadUrl(pl.cta_href, lead)}
                className="btn-glow mt-auto block rounded-xl px-5 py-3 text-center text-sm font-bold transition"
              >
                {pl.cta_txt}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqBlock({ p }: { p: BlockProps }) {
  const items = kv(p.items);
  return (
    <section className="anim-fade-up mt-12">
      {p.section_title && <h2 className="mb-5 text-lg font-semibold text-white/80">{p.section_title}</h2>}
      <div className="space-y-3">
        {items.map((q, i) => (
          <details key={i} className="glass glow-border group rounded-xl p-4">
            <summary className="flex cursor-pointer list-none items-center gap-3 font-medium text-white">
              <span className="text-[var(--accent)] transition group-open:rotate-90">▸</span>
              {q.a}
            </summary>
            <p className="mt-2 pl-6 text-sm leading-relaxed text-white/60">{q.b}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function TestimonialsBlock({ p }: { p: BlockProps }) {
  const items = kv(p.items);
  return (
    <section className="anim-fade-up mt-12">
      {p.section_title && <h2 className="mb-5 text-lg font-semibold text-white/80">{p.section_title}</h2>}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((t, i) => (
          <blockquote key={i} className="glass glow-border rounded-xl p-5 anim-fade-up" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
            <div className="text-sm tracking-widest text-[var(--accent)]">★★★★★</div>
            <p className="mt-2 text-sm leading-relaxed text-white/70">“{t.a}”</p>
            <footer className="mt-3 text-xs font-medium text-white/40">— {t.b}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

function CtaCardBlock({ p, lead }: { p: BlockProps; lead?: string }) {
  const bare = !p.offer_title && !p.offer_points && !p.price;
  const total = Number(p.slots_total);
  const left = Number(p.slots_left);
  const showProg = total > 0 && left >= 0 && left <= total;
  const pct = showProg ? Math.round((left / total) * 100) : 0;
  if (bare) {
    return (
      <section className="mt-10 text-center">
        <a
          href={leadUrl(p.cta_href, lead)}
          target={p.cta_external === "1" ? "_blank" : undefined}
          rel={p.cta_external === "1" ? "noopener noreferrer" : undefined}
          className="btn-glow anim-pulse-glow inline-block rounded-xl px-8 py-4 text-lg font-bold transition"
        >
          {p.cta_txt}
        </a>
      </section>
    );
  }
  return (
    <section className="glass glow-border anim-fade-up mt-12 rounded-2xl p-6 md:p-8">
      {p.offer_title && <h2 className="text-2xl font-bold">{p.offer_title}</h2>}
      {p.offer_points && (
        <ul className="mt-4 space-y-2 text-sm text-white/60">
          {lines(p.offer_points).map((pt, i) => (
            <li key={i}>• {pt}</li>
          ))}
        </ul>
      )}
      {(p.price || p.price_was) && (
        <div className="mt-5 flex items-baseline gap-3">
          {p.price_was && <s className="text-lg text-white/35">{p.price_was}</s>}
          {p.price && (
            <span className="price-tag text-2xl">{p.price}</span>
          )}
        </div>
      )}
      {p.urgency && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
          ⏳ {p.urgency}
        </p>
      )}
      {showProg && (
        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-red-300">
            <span>Slot tersisa</span>
            <span>{left}/{total} — {pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-red-500/30">
            <div className="h-full bg-red-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-red-200/90">Masih ada {left} slot tersisa.</p>
        </div>
      )}
      {p.cta_txt && p.cta_href && (
        <a
          href={leadUrl(p.cta_href, lead)}
          target={p.cta_external === "1" ? "_blank" : undefined}
          rel={p.cta_external === "1" ? "noopener noreferrer" : undefined}
          className="btn-glow anim-pulse-glow mt-6 block w-full rounded-xl px-6 py-4 text-center text-lg font-bold transition"
        >
          {p.cta_txt}
        </a>
      )}
      {p.secondary_txt && p.secondary_href && (
        <a
          href={leadUrl(p.secondary_href, lead)}
          target={p.secondary_external === "1" ? "_blank" : undefined}
          rel={p.secondary_external === "1" ? "noopener noreferrer" : undefined}
          className="btn-glow-outline mt-3 block w-full rounded-xl px-6 py-3 text-center text-sm font-medium transition"
        >
          {p.secondary_txt}
        </a>
      )}
    </section>
  );
}

function LeadFormBlock({ p }: { p: BlockProps }) {
  return (
    <section className="glass glow-border anim-fade-up mt-12 rounded-2xl p-6 shadow-xl md:p-8">
      <h2 className="text-xl font-semibold">{p.form_title}</h2>
      <p className="mb-6 mt-1 text-sm text-white/50">{p.form_subtitle}</p>
      <LeadForm buttonTxt={p.button_txt} buttonTxtLoading={p.button_txt_loading} note={p.button_note} />
    </section>
  );
}

function HeadingBlock({ p }: { p: BlockProps }) {
  const Tag = p.level === "h3" ? "h3" : "h2";
  return <Tag className="anim-fade-up mt-12 text-xl font-semibold text-white/80">{p.text}</Tag>;
}

function TextBlock({ p }: { p: BlockProps }) {
  const cls =
    "anim-fade-up mt-10 text-base leading-relaxed text-white/70 [&_a]:font-medium [&_a]:text-[var(--accent)] [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-semibold [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1";
  return (
    <div
      className={`${cls} ${p.center === "1" ? "text-center" : ""}`}
      dangerouslySetInnerHTML={{ __html: p.content }}
    />
  );
}

function ImageBlock({ p }: { p: BlockProps }) {
  if (!p.url) return null;
  return (
    <figure className="anim-fade-up mt-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.url} alt={p.alt || ""} className="w-full rounded-2xl border border-[var(--border)]" />
      {p.caption && <figcaption className="mt-2 text-center text-sm text-white/40">{p.caption}</figcaption>}
    </figure>
  );
}

function BlockView({ b, lead }: { b: Block; lead?: string }) {
  const p = b.props;
  switch (b.block_type) {
    case "hero":
      return <HeroBlock p={p} lead={lead} />;
    case "feature_list":
      return <FeatureListBlock p={p} />;
    case "feature_grid":
      return <FeatureGridBlock p={p} lead={lead} />;
    case "pricing":
      return <PricingBlock p={p} lead={lead} />;
    case "faq":
      return <FaqBlock p={p} />;
    case "testimonials":
      return <TestimonialsBlock p={p} />;
    case "cta_card":
      return <CtaCardBlock p={p} lead={lead} />;
    case "lead_form":
      return <LeadFormBlock p={p} />;
    case "youtube":
      return <YouTubeEmbed url={p.url} />;
    case "heading":
      return <HeadingBlock p={p} />;
    case "text":
      return <TextBlock p={p} />;
    case "image":
      return <ImageBlock p={p} />;
    case "html":
      return <div className="anim-fade-up mt-10" dangerouslySetInnerHTML={{ __html: p.code }} />;
    case "spacer":
      return <div style={{ height: Number(p.height) || 48 }} />;
    default:
      return null;
  }
}

export function ContentBlocks({ blocks, lead }: { blocks: Block[]; lead?: string }) {
  const custom = blocks.find((b) => b.block_type === "custom_page");
  if (custom) {
    return <div className="w-full" dangerouslySetInnerHTML={{ __html: custom.props.html ?? "" }} />;
  }
  const wide = blocks.some((b) => b.block_type === "hero" && b.props.form === "1");
  return (
    <main className={`relative z-10 mx-auto w-full ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
      {blocks.map((b, i) => (
        <BlockView key={b.id ?? i} b={b} lead={lead} />
      ))}
    </main>
  );
}