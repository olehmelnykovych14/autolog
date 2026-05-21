import React, { useEffect, useRef, useState } from 'react'

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');

.al-landing {
  font-family: 'Inter', sans-serif;
  background: #06061a;
  color: #e8eaf6;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
.al-landing *, .al-landing *::before, .al-landing *::after { box-sizing: border-box; margin: 0; padding: 0; }

.al-landing {
  --brand: #5C3EFE;
  --brand-2: #7C5CFF;
  --brand-glow: rgba(92,62,254,0.45);
  --brand-soft: rgba(92,62,254,0.12);
  --good: #10B981;
  --warn: #F59E0B;
  --text: #e8eaf6;
  --text-2: #94a3b8;
  --text-3: #475569;
  --surface: rgba(255,255,255,0.04);
  --surface-2: rgba(255,255,255,0.07);
  --line: rgba(255,255,255,0.08);
  --ease-out: cubic-bezier(.22,1,.36,1);
  --ease-spring: cubic-bezier(.34,1.56,.64,1);
}

/* noise overlay */
.al-noise {
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  background-size: 200px;
  pointer-events: none; z-index: 0; opacity: .5;
}

.al-blob {
  position: fixed; border-radius: 50%;
  filter: blur(100px); pointer-events: none; z-index: 0;
  will-change: transform; transition: transform 0.1s ease-out;
}
.al-blob-1 { width:700px;height:700px;top:-200px;left:-200px;background:radial-gradient(circle,rgba(92,62,254,.22),transparent 70%);animation:alBlobFloat 18s ease-in-out infinite; }
.al-blob-2 { width:500px;height:500px;bottom:10%;right:-150px;background:radial-gradient(circle,rgba(99,102,241,.18),transparent 70%);animation:alBlobFloat 22s ease-in-out infinite reverse; }
.al-blob-3 { width:400px;height:400px;top:40%;left:40%;background:radial-gradient(circle,rgba(16,185,129,.08),transparent 70%);animation:alBlobFloat 15s ease-in-out infinite 5s; }
@keyframes alBlobFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-40px) scale(1.05)} 66%{transform:translate(-20px,20px) scale(.97)} }

.al-con { max-width:1200px;margin:0 auto;padding:0 32px;position:relative;z-index:1; }

/* nav */
.al-nav {
  position:sticky;top:0;left:0;right:0;z-index:100;
  padding:16px 0;transition:all 500ms var(--ease-out);
}
.al-nav.scrolled {
  background:rgba(6,6,26,.88);backdrop-filter:blur(24px) saturate(160%);
  border-bottom:1px solid var(--line);padding:12px 0;
}
.al-nav-inner { display:flex;align-items:center;gap:24px;max-width:1200px;margin:0 auto;padding:0 32px; }
.al-nav-logo { display:flex;align-items:center;gap:10px;font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.02em;color:white;text-decoration:none;cursor:pointer; }
.al-nav-logo .mark { width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--brand),var(--brand-2));display:grid;place-items:center;box-shadow:0 0 20px var(--brand-glow);overflow:hidden; }
.al-nav-links { display:flex;gap:4px;margin-left:32px; }
.al-nav-link { padding:8px 14px;border-radius:10px;font-size:14px;font-weight:500;color:var(--text-2);text-decoration:none;cursor:pointer;transition:all 200ms;background:transparent;border:none; }
.al-nav-link:hover { color:white;background:var(--surface); }
.al-nav-right { margin-left:auto;display:flex;gap:10px;align-items:center; }
.al-btn-ghost { padding:9px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all 250ms;background:var(--surface);border:1px solid var(--line);color:white; }
.al-btn-ghost:hover { background:var(--surface-2); }
.al-btn-primary { padding:9px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all 250ms;background:linear-gradient(135deg,var(--brand),var(--brand-2));border:none;color:white;box-shadow:0 4px 20px var(--brand-glow);display:inline-flex;align-items:center;gap:8px; }
.al-btn-primary:hover { box-shadow:0 8px 32px var(--brand-glow);transform:translateY(-1px); }

/* hero */
.al-hero { min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:140px 0 100px;text-align:center;position:relative;overflow:hidden; }
.al-hero-badge { display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:var(--brand-soft);border:1px solid rgba(92,62,254,.3);font-size:12px;font-weight:700;color:#a5b4fc;text-transform:uppercase;letter-spacing:.08em;margin-bottom:28px;animation:alFadeUp 700ms var(--ease-out) both; }
.al-hero-badge .dot { width:6px;height:6px;border-radius:50%;background:var(--brand-2);animation:alPulse 1.8s infinite; }
@keyframes alPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
.al-hero-title { font-family:'Syne',sans-serif;font-size:clamp(48px,8vw,96px);font-weight:800;line-height:1;letter-spacing:-.04em;color:white;animation:alFadeUp 700ms var(--ease-out) 100ms both; }
.al-hero-title .grad { background:linear-gradient(135deg,var(--brand-2) 0%,#a78bfa 50%,#60a5fa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
.al-hero-sub { font-size:clamp(17px,2.5vw,22px);color:var(--text-2);max-width:580px;line-height:1.6;margin:24px auto 40px;font-weight:400;animation:alFadeUp 700ms var(--ease-out) 200ms both; }
.al-hero-sub strong { color:white;font-weight:600; }
.al-hero-cta { display:flex;gap:14px;justify-content:center;flex-wrap:wrap;animation:alFadeUp 700ms var(--ease-out) 300ms both; }
.al-btn-lg { padding:16px 32px;border-radius:16px;font-size:16px;font-weight:700;cursor:pointer;transition:all 280ms var(--ease-out);display:inline-flex;align-items:center;gap:10px;text-decoration:none;border:none; }
.al-btn-lg.primary { background:linear-gradient(135deg,var(--brand),var(--brand-2));color:white;box-shadow:0 8px 32px var(--brand-glow),inset 0 1px 0 rgba(255,255,255,.2); }
.al-btn-lg.primary:hover { transform:translateY(-2px);box-shadow:0 16px 48px var(--brand-glow); }
.al-btn-lg.secondary { background:var(--surface);color:white;border:1px solid var(--line); }
.al-btn-lg.secondary:hover { background:var(--surface-2);transform:translateY(-1px); }

/* floating cards */
.al-float-card { position:absolute;pointer-events:none;animation:alFloatCard 6s ease-in-out infinite; }
.al-float-card.left { left:2%;top:30%;animation-delay:0s; }
.al-float-card.right { right:2%;top:25%;animation-delay:2s; }
@keyframes alFloatCard { 0%,100%{transform:translateY(0) rotate(var(--rot,0deg))} 50%{transform:translateY(-16px) rotate(var(--rot,0deg))} }
.al-fc { background:rgba(15,23,42,.9);border:1px solid var(--line);border-radius:20px;padding:16px;backdrop-filter:blur(20px);box-shadow:0 24px 64px rgba(0,0,0,.5);width:220px; }
.al-fc .fc-label { font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--text-3);margin-bottom:8px; }
.al-fc .fc-val { font-size:24px;font-weight:900;color:white;line-height:1; }
.al-fc .fc-sub { font-size:12px;color:var(--text-2);margin-top:4px; }
.al-fc .fc-chip { display:inline-flex;align-items:center;gap:5px;margin-top:10px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(16,185,129,.12);color:var(--good);border:1px solid rgba(16,185,129,.2); }
.al-fc .bar-mini { display:flex;gap:3px;align-items:flex-end;height:40px;margin-top:10px; }
.al-fc .bar-mini .b { flex:1;border-radius:3px 3px 0 0;background:rgba(92,62,254,.25); }
.al-fc .bar-mini .b.a { background:linear-gradient(to top,var(--brand),var(--brand-2)); }

/* records ticker */
.al-records-wrap { margin:64px auto 0;max-width:700px;animation:alFadeUp 700ms var(--ease-out) 450ms both; }
.al-records-label { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:var(--text-3);margin-bottom:12px; }
.al-records-outer { position:relative;overflow:hidden;max-height:200px; }
.al-records-fade { position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(to top,#06061a,transparent);z-index:2;pointer-events:none; }
.al-records-list { display:flex;flex-direction:column;gap:8px;transition:transform 800ms cubic-bezier(.22,1,.36,1); }
.al-record-row { display:flex;gap:12px;align-items:center;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;flex-shrink:0; }

/* trust */
.al-trust { padding:40px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line); }
.al-trust-inner { display:flex;align-items:center;gap:40px;flex-wrap:wrap;justify-content:center;font-size:13px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em; }
.al-trust-inner .div { width:1px;height:20px;background:var(--line); }
.al-trust-num { font-size:22px;font-weight:900;color:white;display:block;margin-bottom:2px; }

/* section headers */
.al-eyebrow { font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:var(--brand-2);margin-bottom:16px;display:flex;align-items:center;gap:10px; }
.al-eyebrow::before { content:'';width:24px;height:2px;background:var(--brand);border-radius:2px; }
.al-h2 { font-family:'Syne',sans-serif;font-size:clamp(32px,5vw,52px);font-weight:800;letter-spacing:-.03em;line-height:1.1;color:white;margin-bottom:16px; }
.al-section-p { font-size:18px;color:var(--text-2);line-height:1.65;max-width:520px; }

/* features */
.al-features { padding:120px 0; }
.al-features-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:2px;border:1px solid var(--line);border-radius:28px;overflow:hidden;background:var(--line);margin-top:64px; }
.al-feat-cell { background:#06061a;padding:40px 36px;transition:background 350ms;position:relative;overflow:hidden; }
.al-feat-cell::before { content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 30%,var(--brand-soft),transparent 70%);opacity:0;transition:opacity 400ms; }
.al-feat-cell:hover { background:#0a0a22; }
.al-feat-cell:hover::before { opacity:1; }
.al-feat-cell.large { grid-column:span 2; }
.al-feat-icon { width:52px;height:52px;border-radius:16px;background:var(--brand-soft);border:1px solid rgba(92,62,254,.2);display:grid;place-items:center;margin-bottom:20px;color:var(--brand-2);transition:transform 300ms var(--ease-spring); }
.al-feat-cell:hover .al-feat-icon { transform:scale(1.1) rotate(-5deg); }
.al-feat-cell h3 { font-size:20px;font-weight:800;color:white;margin-bottom:10px;letter-spacing:-.01em; }
.al-feat-cell p { font-size:14px;color:var(--text-2);line-height:1.65; }
.al-feat-tag { display:inline-block;margin-top:16px;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em; }
.tag-brand { background:var(--brand-soft);color:var(--brand-2); }
.tag-good { background:rgba(16,185,129,.12);color:var(--good); }
.tag-warn { background:rgba(245,158,11,.12);color:var(--warn); }

/* how it works */
.al-how { padding:120px 0; }
.al-how-grid { display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;margin-top:64px; }
.al-steps { display:flex;flex-direction:column;gap:32px; }
.al-step { display:flex;gap:20px;align-items:flex-start; }
.al-step-num { width:44px;height:44px;border-radius:14px;flex:none;background:var(--brand-soft);border:1px solid rgba(92,62,254,.3);display:grid;place-items:center;font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:var(--brand-2);transition:all 350ms var(--ease-spring); }
.al-step:hover .al-step-num { background:var(--brand);color:white;transform:scale(1.1);box-shadow:0 8px 24px var(--brand-glow); }
.al-step-body h4 { font-size:17px;font-weight:700;color:white;margin-bottom:6px; }
.al-step-body p { font-size:14px;color:var(--text-2);line-height:1.6; }
.al-mockup { position:relative;background:rgba(15,23,42,.95);border:1px solid var(--line);border-radius:28px;padding:20px;box-shadow:0 40px 100px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.05);overflow:hidden; }
.al-mockup::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(92,62,254,.6),transparent); }
.al-mockup-bar { display:flex;gap:6px;margin-bottom:16px; }
.al-mockup-dot { width:10px;height:10px;border-radius:50%; }
.al-mockup-content { display:flex;flex-direction:column;gap:10px; }
.al-ms { background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:16px;padding:16px 18px;display:flex;gap:14px;align-items:center; }
.al-ms-icon { width:36px;height:36px;border-radius:10px;background:var(--brand-soft);display:grid;place-items:center;flex:none;color:var(--brand-2); }
.al-ms-val { font-size:18px;font-weight:900;color:white; }
.al-ms-lbl { font-size:11px;color:var(--text-3);font-weight:600;text-transform:uppercase;letter-spacing:.06em; }
.al-chips-row { display:flex;gap:10px; }
.al-chip { flex:1;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--line);font-size:12px;font-weight:700;color:var(--text-2);text-align:center; }
.al-chip.active { background:var(--brand-soft);border-color:rgba(92,62,254,.3);color:var(--brand-2); }
.al-mini-chart { display:flex;align-items:flex-end;gap:4px;height:56px;padding:8px 0; }
.al-mini-bar { flex:1;border-radius:4px 4px 0 0;background:rgba(92,62,254,.2);min-height:4px; }
.al-mini-bar.hi { background:linear-gradient(to top,var(--brand),var(--brand-2)); }

/* carfax */
.al-carfax { padding:120px 0; }
.al-carfax-inner { display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center; }
.al-report-card { background:rgba(10,15,30,.95);border:1px solid var(--line);border-radius:28px;padding:32px;position:relative;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.5); }
.al-report-card::before { content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(16,185,129,.5),transparent); }
.al-report-grade { display:flex;align-items:center;gap:20px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--line); }
.al-grade-circle { width:72px;height:72px;border-radius:50%;flex:none;background:linear-gradient(135deg,var(--good),#34d399);display:grid;place-items:center;font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:white;box-shadow:0 8px 32px rgba(16,185,129,.4); }
.al-grade-info h3 { font-size:18px;font-weight:800;color:white; }
.al-grade-info p { font-size:13px;color:var(--text-2);margin-top:3px; }
.al-report-checks { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
.al-check-item { background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px;border-left:3px solid var(--good); }
.al-ci-label { font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:4px; }
.al-ci-val { font-size:22px;font-weight:900;color:var(--good); }
.al-ci-desc { font-size:11px;color:var(--text-2);margin-top:3px; }
.al-report-footer { display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:20px;border-top:1px solid var(--line); }
.al-btn-share { padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,var(--brand),var(--brand-2));color:white;font-size:13px;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 16px var(--brand-glow);display:flex;align-items:center;gap:8px;transition:all 250ms var(--ease-out); }
.al-btn-share:hover { transform:translateY(-1px);box-shadow:0 8px 24px var(--brand-glow); }

/* sto section */
.al-sto { padding:120px 0; }
.al-sto-grid { display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;margin-top:64px; }
.al-sto-features { display:flex;flex-direction:column;gap:20px; }
.al-sto-feat { display:flex;gap:16px;align-items:flex-start;padding:20px;border-radius:16px;background:var(--surface);border:1px solid var(--line);transition:all 300ms var(--ease-out);cursor:default; }
.al-sto-feat:hover { background:var(--surface-2);border-color:rgba(92,62,254,.2);transform:translateX(4px); }
.al-sto-fi { width:44px;height:44px;border-radius:12px;flex:none;background:var(--brand-soft);display:grid;place-items:center;color:var(--brand-2); }
.al-sto-feat h4 { font-size:15px;font-weight:700;color:white;margin-bottom:4px; }
.al-sto-feat p { font-size:13px;color:var(--text-2);line-height:1.5; }
.al-vin-demo { background:rgba(10,15,30,.95);border:1px solid var(--line);border-radius:28px;padding:32px;box-shadow:0 40px 100px rgba(0,0,0,.5); }
.al-vin-demo h4 { font-size:18px;font-weight:800;color:white;margin-bottom:6px; }
.al-vin-demo p { font-size:13px;color:var(--text-2);margin-bottom:24px; }
.al-vin-grid { display:grid;grid-template-columns:repeat(17,1fr);gap:4px;margin-bottom:16px; }
.al-vc { aspect-ratio:1/1.2;display:grid;place-items:center;border-radius:6px;background:var(--surface);border:1px solid var(--line);font-family:'Courier New',monospace;font-size:12px;font-weight:800;color:var(--brand-2);transition:all 300ms; }
.al-vc.f { background:rgba(92,62,254,.15);border-color:rgba(92,62,254,.4);color:white; }
.al-vin-result { padding:16px;border-radius:16px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);display:flex;gap:12px;align-items:center; }
.al-vin-result .vr-title { font-size:15px;font-weight:700;color:white; }
.al-vin-result .vr-sub { font-size:12px;color:var(--text-2); }
.al-verify-btn { width:100%;margin-top:14px;padding:14px;border-radius:14px;background:linear-gradient(135deg,var(--brand),var(--brand-2));color:white;border:none;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 24px rgba(92,62,254,.35);transition:all 250ms; }
.al-verify-btn:hover { box-shadow:0 16px 40px rgba(92,62,254,.45);transform:translateY(-1px); }

/* testimonials */
.al-testi { padding:120px 0; }
.al-testi-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:64px; }
.al-testi-card { background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:28px;transition:all 300ms var(--ease-out); }
.al-testi-card:hover { background:var(--surface-2);transform:translateY(-2px); }
.al-testi-stars { color:var(--warn);font-size:16px;margin-bottom:16px;letter-spacing:2px; }
.al-testi-text { font-size:15px;color:var(--text-2);line-height:1.7;margin-bottom:20px;font-style:italic; }
.al-testi-text em { color:white;font-style:normal;font-weight:600; }
.al-testi-author { display:flex;align-items:center;gap:12px; }
.al-testi-avatar { width:40px;height:40px;border-radius:50%;flex:none;background:linear-gradient(135deg,var(--brand),var(--brand-2));display:grid;place-items:center;font-size:15px;font-weight:800;color:white; }
.al-testi-name { font-weight:700;font-size:14px;color:white; }
.al-testi-role { font-size:12px;color:var(--text-3); }

/* cta */
.al-cta { padding:120px 0;text-align:center; }
.al-cta-box { background:linear-gradient(135deg,rgba(92,62,254,.15),rgba(124,92,255,.08));border:1px solid rgba(92,62,254,.3);border-radius:40px;padding:80px 48px;position:relative;overflow:hidden;box-shadow:0 0 0 1px rgba(92,62,254,.1),0 40px 80px rgba(92,62,254,.15); }
.al-cta-box::before { content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:1px;background:linear-gradient(90deg,transparent,rgba(92,62,254,.8),transparent); }
.al-cta-box::after { content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% -20%,rgba(92,62,254,.2),transparent 60%);pointer-events:none; }
.al-cta-box h2 { font-family:'Syne',sans-serif;font-size:clamp(32px,5vw,56px);font-weight:800;letter-spacing:-.03em;color:white;margin-bottom:16px;position:relative;z-index:1; }
.al-cta-box p { font-size:18px;color:var(--text-2);margin-bottom:40px;position:relative;z-index:1; }
.al-cta-btns { display:flex;gap:16px;justify-content:center;position:relative;z-index:1;flex-wrap:wrap; }

/* footer */
.al-footer { padding:60px 0 40px;border-top:1px solid var(--line); }
.al-footer-inner { display:flex;gap:60px;flex-wrap:wrap; }
.al-footer-brand { flex:2;min-width:200px; }
.al-footer-logo { display:flex;align-items:center;gap:10px;margin-bottom:14px; }
.al-footer-logo-mark { width:32px;height:32px;border-radius:10px;background:var(--brand-soft);border:1px solid rgba(92,62,254,.3);display:grid;place-items:center;color:var(--brand-2); }
.al-footer-logo-text { font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:white; }
.al-footer-desc { font-size:14px;color:var(--text-3);line-height:1.6;max-width:280px; }
.al-footer-col { flex:1;min-width:130px; }
.al-footer-col h5 { font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);margin-bottom:16px; }
.al-footer-col a { display:block;font-size:14px;color:var(--text-2);margin-bottom:10px;text-decoration:none;transition:color 200ms;cursor:pointer; }
.al-footer-col a:hover { color:white; }
.al-footer-bottom { margin-top:48px;padding-top:24px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px; }
.al-footer-bottom p { font-size:13px;color:var(--text-3); }

/* grad line */
.al-grad-line { height:1px;background:linear-gradient(90deg,transparent,var(--line),transparent); }

/* reveal */
.al-reveal { opacity:0;transform:translateY(32px);transition:opacity 700ms var(--ease-out),transform 700ms var(--ease-out); }
.al-reveal.visible { opacity:1;transform:translateY(0); }
.al-reveal.d1 { transition-delay:100ms; }
.al-reveal.d2 { transition-delay:200ms; }
.al-reveal.d3 { transition-delay:300ms; }

@keyframes alFadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

@media (max-width:900px) {
  .al-features-grid { grid-template-columns:1fr; }
  .al-feat-cell.large { grid-column:span 1; }
  .al-how-grid,.al-carfax-inner,.al-sto-grid { grid-template-columns:1fr;gap:48px; }
  .al-testi-grid { grid-template-columns:1fr; }
  .al-float-card { display:none; }
  .al-nav-links { display:none; }
}

@media (max-width:640px) {
  .al-con { padding:0 16px; }
  .al-nav-inner { padding:0 16px;gap:12px; }
  .al-nav-logo { font-size:18px; }
  .al-nav-logo .mark { width:30px;height:30px; }
  .al-nav-right { gap:6px; }
  .al-btn-ghost { display:none; }
  .al-btn-primary { padding:8px 14px;font-size:13px; }

  .al-hero { padding:96px 0 64px;min-height:auto; }
  .al-hero-badge { font-size:11px;padding:5px 12px;margin-bottom:20px; }
  .al-hero-title { font-size:clamp(34px,10vw,48px); }
  .al-hero-sub { font-size:15px;margin:18px auto 28px; }
  .al-btn-lg { padding:14px 22px;font-size:15px;border-radius:14px; }
  .al-hero-cta { gap:10px; }

  .al-records-wrap { margin-top:48px; }
  .al-record-row { padding:10px 12px;gap:8px;flex-wrap:wrap; }
  .al-record-row > span:nth-child(3) { font-size:10px;flex-basis:100%;order:4;color:var(--text-3); }
  .al-record-row > span:nth-child(2) { font-size:12px;min-width:0; }
  .al-record-row > span:nth-child(4) { font-size:12px; }

  .al-trust { padding:28px 0; }
  .al-trust-inner { gap:20px;font-size:11px; }
  .al-trust-num { font-size:18px; }

  .al-features,.al-how,.al-carfax,.al-sto,.al-testi,.al-cta { padding:72px 0; }
  .al-features-grid { margin-top:40px;border-radius:20px; }
  .al-feat-cell { padding:28px 22px; }
  .al-feat-cell h3 { font-size:18px; }

  .al-h2 { font-size:clamp(26px,7vw,36px); }
  .al-section-p { font-size:15px; }

  .al-mockup,.al-report-card,.al-vin-demo { padding:20px;border-radius:20px; }
  .al-report-grade { gap:14px;padding-bottom:18px;margin-bottom:18px; }
  .al-grade-circle { width:60px;height:60px;font-size:22px; }
  .al-grade-info h3 { font-size:16px; }
  .al-report-checks { grid-template-columns:1fr 1fr;gap:8px; }
  .al-check-item { padding:12px; }
  .al-ci-val { font-size:18px; }
  .al-report-footer { flex-direction:column;gap:12px;align-items:flex-start; }

  .al-vin-grid { grid-template-columns:repeat(9,1fr);gap:3px; }
  .al-vc { font-size:11px; }
  .al-chips-row { flex-wrap:wrap; }
  .al-chip { font-size:11px;padding:8px 10px; }

  .al-testi-card { padding:22px;border-radius:20px; }
  .al-testi-text { font-size:14px; }

  .al-cta-box { padding:48px 22px;border-radius:28px; }
  .al-cta-box p { font-size:15px;margin-bottom:28px; }
  .al-cta-btns { flex-direction:column;gap:10px; }
  .al-cta-btns .al-btn-lg { width:100%;justify-content:center; }

  .al-footer { padding:48px 0 28px; }
  .al-footer-inner { gap:32px; }
  .al-footer-bottom { flex-direction:column;align-items:flex-start;gap:8px; }

  .al-blob-1 { width:400px;height:400px;top:-150px;left:-150px; }
  .al-blob-2 { width:320px;height:320px;right:-120px; }
  .al-blob-3 { width:260px;height:260px; }
}
`

const RECORDS = [
  { cat: 'ТО', catClr: '#DBEAFE', catTxt: '#1D4ED8', title: 'Заміна масла Mobil 5W-30', date: '14 кві', km: '411 111', cost: '2 222 ₴' },
  { cat: 'Ремонт', catClr: '#FFEDD5', catTxt: '#C2410C', title: 'Гальмівні колодки передні', date: '22 бер', km: '408 200', cost: '4 800 ₴' },
  { cat: 'Шиномонтаж', catClr: '#F1F5F9', catTxt: '#475569', title: 'Літня гума Continental', date: '08 лют', km: '402 000', cost: '850 ₴' },
  { cat: 'ТО', catClr: '#DBEAFE', catTxt: '#1D4ED8', title: 'Повне ТО — фільтри, свічки', date: '05 лют', km: '400 000', cost: '6 400 ₴' },
  { cat: 'Паливо', catClr: '#FEE2E2', catTxt: '#B91C1C', title: 'Заправка OKKO 95+', date: '28 січ', km: '398 500', cost: '1 240 ₴' },
  { cat: 'Мийка', catClr: '#CFFAFE', catTxt: '#0E7490', title: 'Комплексне миття з хімчисткою', date: '15 січ', km: '396 000', cost: '380 ₴' },
]

const VIN_CHARS = 'WBA3A5C50CF256985'.split('')

function IcoChevron() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
}

export function LandingView({ onLogin }) {
  const containerRef = useRef(null)
  const blob1Ref = useRef(null)
  const blob2Ref = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [tickOffset, setTickOffset] = useState(0)
  const [vinLit, setVinLit] = useState(0)

  // scroll nav
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const fn = () => setScrolled(el.scrollTop > 40)
    el.addEventListener('scroll', fn, { passive: true })
    return () => el.removeEventListener('scroll', fn)
  }, [])

  // records ticker
  useEffect(() => {
    const id = setInterval(() => setTickOffset(p => (p + 1) % RECORDS.length), 2200)
    return () => clearInterval(id)
  }, [])

  // VIN animation
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setVinLit(i)
      if (i >= VIN_CHARS.length) clearInterval(id)
    }, 80)
    return () => clearInterval(id)
  }, [])

  // scroll reveal
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const els = container.querySelectorAll('.al-reveal')
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } })
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px', root: container })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  // mouse parallax on blobs
  useEffect(() => {
    const fn = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30
      const y = (e.clientY / window.innerHeight - 0.5) * 30
      if (blob1Ref.current) blob1Ref.current.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`
      if (blob2Ref.current) blob2Ref.current.style.transform = `translate(${-x * 0.3}px, ${-y * 0.3}px)`
    }
    window.addEventListener('mousemove', fn, { passive: true })
    return () => window.removeEventListener('mousemove', fn)
  }, [])

  return (
    <div ref={containerRef} className="al-landing" style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
      <style>{STYLE}</style>
      <div className="al-noise" />
      <div className="al-blob al-blob-1" ref={blob1Ref} />
      <div className="al-blob al-blob-2" ref={blob2Ref} />
      <div className="al-blob al-blob-3" />

      {/* NAV */}
      <nav className={`al-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="al-nav-inner">
          <div className="al-nav-logo" onClick={onLogin}>
            <div className="mark">
              <img src="/logo.png" alt="AutoLog" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            </div>
            AutoLog
          </div>
          <div className="al-nav-links">
            <button className="al-nav-link">Функції</button>
            <button className="al-nav-link">Як це працює</button>
          </div>
          <div className="al-nav-right">
            <button className="al-btn-ghost" onClick={onLogin}>Увійти</button>
            <button className="al-btn-primary" onClick={onLogin}>
              Почати безкоштовно <IcoChevron />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="al-hero" style={{ position: 'relative', zIndex: 1 }}>
        <div className="al-float-card left" style={{ '--rot': '-4deg' }}>
          <div className="al-fc">
            <div className="fc-label">Здоров'я парку</div>
            <div className="fc-val">87<span style={{ fontSize: 16, opacity: .5 }}>/100</span></div>
            <div className="fc-sub">4 авто · все під контролем</div>
            <div className="fc-chip">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Все ОК
            </div>
          </div>
        </div>
        <div className="al-float-card right" style={{ '--rot': '3deg' }}>
          <div className="al-fc">
            <div className="fc-label">Витрати · квітень</div>
            <div className="fc-val">38 453<span style={{ fontSize: 13, marginLeft: 3, opacity: .5 }}>₴</span></div>
            <div className="fc-sub">−12% vs минулий місяць</div>
            <div className="bar-mini">
              {[45, 60, 35, 55, 80, 72].map((h, i) => (
                <div key={i} className={`b${i >= 4 ? ' a' : ''}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="al-con" style={{ textAlign: 'center' }}>
          <div className="al-hero-badge">
            <span className="dot" />
            Новий сервіс для авто власників
          </div>
          <h1 className="al-hero-title">
            Весь сервіс вашого авто<br />
            <span className="grad">в одному місці</span>
          </h1>
          <p className="al-hero-sub">
            Додайте авто, фіксуйте кожне ТО і ремонт, відстежуйте <strong>витрати та пробіг</strong> — і завжди знайдіть, що відбувається з вашим автомобілем.
          </p>
          <div className="al-hero-cta">
            <button className="al-btn-lg primary" onClick={onLogin}>
              Почати безкоштовно <IcoChevron />
            </button>
            <button className="al-btn-lg secondary" onClick={onLogin}>
              Як це працює <IcoChevron />
            </button>
          </div>

          <div className="al-records-wrap">
            <div className="al-records-label">Остання активність · Acura ILX</div>
            <div className="al-records-outer">
              <div className="al-records-fade" />
              <div className="al-records-list" style={{ transform: `translateY(-${tickOffset * 50}px)` }}>
                {RECORDS.map((r, i) => (
                  <div key={i} className="al-record-row">
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 800, background: r.catClr, color: r.catTxt, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{r.cat}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{r.date} · {r.km} км</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-2)', whiteSpace: 'nowrap' }}>{r.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="al-trust" style={{ position: 'relative', zIndex: 1 }}>
        <div className="al-con">
          <div className="al-trust-inner">
            <div style={{ textAlign: 'center' }}><span className="al-trust-num">12 000+</span>Активних користувачів</div>
            <div className="div" />
            <div style={{ textAlign: 'center' }}><span className="al-trust-num">86 000+</span>Верифікованих записів</div>
            <div className="div" />
            <div style={{ textAlign: 'center' }}><span className="al-trust-num">1 200+</span>Партнерських СТО</div>
            <div className="div" />
            <div style={{ textAlign: 'center' }}><span className="al-trust-num">4.9★</span>Рейтинг</div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="al-features" id="features" style={{ position: 'relative', zIndex: 1 }}>
        <div className="al-con">
          <div className="al-reveal">
            <div className="al-eyebrow">Функціональність</div>
            <h2 className="al-h2">Все що потрібно<br />вашому авто</h2>
          </div>
          <div className="al-features-grid al-reveal">
            <div className="al-feat-cell large">
              <div className="al-feat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
              </div>
              <h3>Гараж усього парку</h3>
              <p>Кілька авто в одному місці. Фото, пробіг, техпаспорт, VIN — завжди під рукою.</p>
              <span className="al-feat-tag tag-brand">Необмежена кількість авто</span>
            </div>
            <div className="al-feat-cell">
              <div className="al-feat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 16v-4M12 8h.01"/></svg>
              </div>
              <h3>AI Механік</h3>
              <p>Задайте питання — отримайте відповідь на основі реального пробігу та сервісної історії.</p>
              <span className="al-feat-tag tag-warn">Claude AI</span>
            </div>
            <div className="al-feat-cell">
              <div className="al-feat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
              </div>
              <h3>Сервісна хронологія</h3>
              <p>ТО, ремонт, мийка, паливо — все з датами, пробігом, фото чеків.</p>
            </div>
            <div className="al-feat-cell">
              <div className="al-feat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <h3>Запис на СТО</h3>
              <p>Знайдіть партнерське СТО поруч і запишіться онлайн.</p>
              <span className="al-feat-tag tag-good">1 200+ СТО</span>
            </div>
            <div className="al-feat-cell">
              <div className="al-feat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3>Командний доступ</h3>
              <p>Поділіться доступом до гаражу з партнером або водієм.</p>
              <span className="al-feat-tag tag-brand">Для парків</span>
            </div>
          </div>
        </div>
      </section>

      <div className="al-grad-line" style={{ position: 'relative', zIndex: 1 }} />

      {/* HOW IT WORKS */}
      <section className="al-how" id="how" style={{ position: 'relative', zIndex: 1 }}>
        <div className="al-con">
          <div className="al-how-grid">
            <div className="al-reveal">
              <div className="al-eyebrow">Як це працює</div>
              <h2 className="al-h2">Три кроки до порядку</h2>
              <p className="al-section-p" style={{ marginBottom: 40 }}>Без паперів. Без таблиць. Все онлайн — чисто і зрозуміло.</p>
              <div className="al-steps">
                {[
                  { n: '1', title: 'Додайте авто', text: 'Введіть номерний знак або VIN — дані підтягнуться автоматично.' },
                  { n: '2', title: 'Фіксуйте сервіс', text: 'Кожне ТО, заправка, ремонт — з датою, пробігом і фото чека.', cls: 'd1' },
                  { n: '3', title: 'Отримайте звіт', text: 'Поділіться посиланням. Покупець або страхова бачать верифіковану історію.', cls: 'd2' },
                ].map(s => (
                  <div key={s.n} className={`al-step al-reveal${s.cls ? ' ' + s.cls : ''}`}>
                    <div className="al-step-num">{s.n}</div>
                    <div className="al-step-body"><h4>{s.title}</h4><p>{s.text}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="al-reveal d2">
              <div className="al-mockup">
                <div className="al-mockup-bar">
                  <div className="al-mockup-dot" style={{ background: '#ff5f57' }} />
                  <div className="al-mockup-dot" style={{ background: '#febc2e' }} />
                  <div className="al-mockup-dot" style={{ background: '#28c840' }} />
                </div>
                <div className="al-mockup-content">
                  <div className="al-ms">
                    <div className="al-ms-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    </div>
                    <div><div className="al-ms-lbl">Витрати за місяць</div><div className="al-ms-val">38 453 ₴</div></div>
                  </div>
                  <div className="al-chips-row">
                    <div className="al-chip active">4 авто</div>
                    <div className="al-chip">86 000 км</div>
                    <div className="al-chip">9 записів</div>
                  </div>
                  <div style={{ padding: 14, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Останні 6 місяців</div>
                    <div className="al-mini-chart">
                      {[38, 55, 32, 65, 82, 72].map((h, i) => (
                        <div key={i} className={`al-mini-bar${i >= 4 ? ' hi' : ''}`} style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 14px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', borderRadius: 12 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                    <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>Acura ILX · Верифіковано TopService</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="al-grad-line" style={{ position: 'relative', zIndex: 1 }} />

      {/* CARFAX */}
      <section className="al-carfax" id="report" style={{ position: 'relative', zIndex: 1 }}>
        <div className="al-con">
          <div className="al-carfax-inner">
            <div className="al-reveal">
              <div className="al-report-card">
                <div className="al-report-grade">
                  <div className="al-grade-circle">А+</div>
                  <div className="al-grade-info">
                    <h3>Чисте авто</h3>
                    <p>Acura ILX · 2026 · ВС7673ГШ<br />Перевірено 12 параметрами</p>
                  </div>
                </div>
                <div className="al-report-checks">
                  {[['ДТП', '0', 'Не зафіксовано'], ['Власників', '1', 'Один власник'], ['Скручування', 'НІ', 'Дані співпадають'], ['Сервіс ✓', '9', 'Верифіковані']].map(([l, v, d]) => (
                    <div key={l} className="al-check-item">
                      <div className="al-ci-label">{l}</div>
                      <div className="al-ci-val">{v}</div>
                      <div className="al-ci-desc">{d}</div>
                    </div>
                  ))}
                </div>
                <div className="al-report-footer">
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Opendatabot API · 28 кві 2026</span>
                  <button className="al-btn-share">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
                    Поділитись
                  </button>
                </div>
              </div>
            </div>
            <div className="al-reveal d2">
              <div className="al-eyebrow">Carfax по-українськи</div>
              <h2 className="al-h2">Звіт, якому довіряють</h2>
              <p className="al-section-p">Генеруємо верифікований звіт за даними українських реєстрів. Поділіться одним посиланням — покупець побачить повну, чесну картину.</p>
              <ul style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14, listStyle: 'none' }}>
                {['Перевірка через Opendatabot в реальному часі', 'Верифіковані записи від партнерських СТО', 'PDF-звіт та публічне посилання на 30 днів', 'Безкоштовно для власника авто'].map(t => (
                  <li key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 15, color: 'var(--text-2)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="al-grad-line" style={{ position: 'relative', zIndex: 1 }} />

      {/* STO */}
      <section className="al-sto" id="sto" style={{ position: 'relative', zIndex: 1 }}>
        <div className="al-con">
          <div style={{ textAlign: 'center' }} className="al-reveal">
            <div className="al-eyebrow" style={{ justifyContent: 'center' }}>Для партнерів</div>
            <h2 className="al-h2">Рішення для СТО</h2>
            <p className="al-section-p" style={{ margin: '16px auto 0' }}>Автоматизуйте верифікацію, залучайте нових клієнтів через пошук AutoLog і керуйте записами в одному кабінеті.</p>
          </div>
          <div className="al-sto-grid">
            <div className="al-sto-features al-reveal">
              {[
                { title: 'VIN / номер пошук', text: 'Знайдіть авто клієнта за номером або VIN і відразу додайте верифікований запис.' },
                { title: 'Верифікація сервісних записів', text: 'Ваш підпис підтверджує справжність ТО. Клієнт отримує позначку «Verified by СТО».' },
                { title: 'Онлайн-календар записів', text: 'Клієнти записуються через AutoLog — ви підтверджуєте в кабінеті. Жодних дзвінків.' },
                { title: 'Аналітика та доходи', text: 'Дохід по місяцях, конверсія записів, клієнтська база — повна картина бізнесу.' },
              ].map(f => (
                <div key={f.title} className="al-sto-feat">
                  <div className="al-sto-fi">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div><h4>{f.title}</h4><p>{f.text}</p></div>
                </div>
              ))}
            </div>
            <div className="al-reveal d2">
              <div className="al-vin-demo">
                <h4>Знайти авто клієнта</h4>
                <p>Введіть номерний знак або VIN-код</p>
                <div className="al-vin-grid">
                  {VIN_CHARS.map((c, i) => (
                    <div key={i} className={`al-vc${i < vinLit ? ' f' : ''}`}>{c}</div>
                  ))}
                </div>
                <div className="al-vin-result">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                  <div><div className="vr-title">Acura ILX · 2026</div><div className="vr-sub">ВС7673ГШ · 1 000 км · 1 власник</div></div>
                </div>
                <button className="al-verify-btn" onClick={onLogin}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Верифікувати ТО
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="al-grad-line" style={{ position: 'relative', zIndex: 1 }} />

      {/* TESTIMONIALS */}
      <section className="al-testi" style={{ position: 'relative', zIndex: 1 }}>
        <div className="al-con">
          <div style={{ textAlign: 'center' }} className="al-reveal">
            <div className="al-eyebrow" style={{ justifyContent: 'center' }}>Відгуки</div>
            <h2 className="al-h2">Що кажуть користувачі</h2>
          </div>
          <div className="al-testi-grid">
            {[
              { t: '"Забув коли востаннє шукав паперець з датою ТО. Тепер все в AutoLog — <em>відкриваю і бачу всю історію</em> кожного авто."', name: 'Олег М.', role: 'Власник 4 авто · Київ', av: 'О', cls: '' },
              { t: '"Маю 4 авто. Тепер <em>кожне ТО фотографую чек і додаю</em> за 30 секунд. Через рік побачив — витрачаю на 18% менше."', name: 'TopService СТО', role: 'Партнер AutoLog · Харків', av: 'Т', avBg: 'linear-gradient(135deg,#10B981,#34d399)', cls: 'd1' },
              { t: '"AI Механік <em>порадив перевірити стійки</em> на основі пробігу і сезону. Заїхав — підтвердилось. Заощадив."', name: 'Василь К.', role: 'Premium · Львів', av: 'В', avBg: 'linear-gradient(135deg,#F59E0B,#EF4444)', cls: 'd2' },
            ].map((r, i) => (
              <div key={i} className={`al-testi-card al-reveal${r.cls ? ' ' + r.cls : ''}`}>
                <div className="al-testi-stars">★★★★★</div>
                <p className="al-testi-text" dangerouslySetInnerHTML={{ __html: r.t }} />
                <div className="al-testi-author">
                  <div className="al-testi-avatar" style={r.avBg ? { background: r.avBg } : {}}>{r.av}</div>
                  <div><div className="al-testi-name">{r.name}</div><div className="al-testi-role">{r.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="al-cta" style={{ position: 'relative', zIndex: 1 }}>
        <div className="al-con">
          <div className="al-cta-box al-reveal">
            <h2>Почніть вести авто<br />розумно — сьогодні</h2>
            <p>Безкоштовно. Без кредитної картки. Перший запис за 2 хвилини.</p>
            <div className="al-cta-btns">
              <button className="al-btn-lg primary" onClick={onLogin}>
                Зареєструватись безкоштовно <IcoChevron />
              </button>
              <button className="al-btn-lg secondary" onClick={onLogin}>Я — СТО</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="al-footer" style={{ position: 'relative', zIndex: 1 }}>
        <div className="al-con">
          <div className="al-footer-inner">
            <div className="al-footer-brand">
              <div className="al-footer-logo">
                <div className="al-footer-logo-mark">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L3 19h18L12 2z"/><circle cx="12" cy="15" r="2" fill="currentColor" stroke="none"/></svg>
                </div>
                <div className="al-footer-logo-text">AutoLog</div>
              </div>
              <p className="al-footer-desc">Розумний автожурнал для власників та СТО. Зберігайте, верифікуйте, діліться.</p>
            </div>
            <div className="al-footer-col">
              <h5>Продукт</h5>
              <a>Функції</a>
              <a>AI Механік</a>
              <a>Для СТО</a>
            </div>
            <div className="al-footer-col">
              <h5>Компанія</h5>
              <a>Про нас</a>
              <a>Блог</a>
              <a>Контакти</a>
            </div>
            <div className="al-footer-col">
              <h5>Правовий</h5>
              <a>Умови використання</a>
              <a>Конфіденційність</a>
            </div>
          </div>
          <div className="al-footer-bottom">
            <p>© 2026 AutoLog. Зроблено в Україні 🇺🇦</p>
            <p>Усі дані захищено · Opendatabot API</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
