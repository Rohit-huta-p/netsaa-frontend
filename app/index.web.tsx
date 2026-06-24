import React, { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import useAuthStore from '@/stores/authStore';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';

/**
 * Root route `/` — WEB ONLY (`index.web.tsx`).
 *
 * Native keeps its React Native landing in `index.tsx`. On web, Expo Router
 * resolves `index.web.tsx` instead, so we render the marketing HTML design
 * (`DOCS/designs/NETSA_figma_clone_v2photos.html`) pixel-perfect.
 *
 * Auth gate is identical to `index.tsx`:
 *   logged OUT → public web landing
 *   logged IN  → /(app)/dashboard
 * Flash-safe: waits for SecureStore rehydration (isHydrated) before deciding.
 */
export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!isHydrated) return <AppLoadingScreen />;

  if (accessToken) return <Redirect href="/(app)/dashboard" />;

  return <WebLanding />;
}

/**
 * The verbatim CSS + body markup from
 * `DOCS/designs/NETSA_figma_clone_v2photos.html`.
 *
 * Edits applied to the source ONLY:
 *   - asset paths rewritten to the compressed copies served at `/landing/...`
 *     (`assets/v2-*.png` → `/landing/v2-*.jpg`; `netsa-figma-assets/imgX.jpg`
 *      → `/landing/imgX.jpg`)
 *   - stable hooks added to CTA anchors (`data-nav`/`data-cta`) for wiring.
 * Everything else is identical — fidelity is the goal.
 */
const PAGE_HTML = `
<style>
  /* ============================================================
     NETSA — faithful clone of Figma node 368:2277
     Playfair Display + Space Grotesk · #09090b · rose→orange
     ============================================================ */
  :root{
    --bg:#09090b; --ink:#f5f5f5; --grey:#a7a7ae; --grey16:#27272a;
    --rose:#ff4d88; --orange:#ff822e; --peach:#ff976b; --red:#ef4444;
    --serif:'Playfair Display',Georgia,serif;
    --sans:'Space Grotesk',system-ui,sans-serif;
    --grad-text:linear-gradient(160deg,#ff4d88 0%,#ff822e 50%,#ff976b 100%);
    --grad-btn:linear-gradient(135deg,#ff4d88 0%,#ff822e 100%);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}
  img{display:block;max-width:none}
  .gtext{background:var(--grad-text);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;font-style:italic}
  .wrap{max-width:1192px;margin:0 auto;padding:0 24px;position:relative;z-index:2}

  /* faint blueprint grid over dark areas */
  .grid-bg{position:absolute;inset:0;z-index:0;pointer-events:none;
    background-image:linear-gradient(rgba(245,245,245,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(245,245,245,.028) 1px,transparent 1px);
    background-size:67px 67px}

  /* ---------------- NAV ---------------- */
  .nav{position:absolute;top:0;left:0;right:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:26px 56px}
  .nav .logo{font-family:var(--serif);font-weight:700;font-size:24px;letter-spacing:.02em;background:var(--grad-text);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;font-style:normal}
  .nav .nav-cta{font-family:var(--sans);font-weight:500;font-size:15px;color:#fff;background:var(--grad-btn);padding:11px 22px;border-radius:9999px;box-shadow:0 0 40px 6px rgba(255,77,136,.18)}

  /* ---------------- HERO ---------------- */
  .hero{position:relative;min-height:840px;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:180px 24px 90px;isolation:isolate}
  .hero .glow{position:absolute;border-radius:9999px;z-index:0;pointer-events:none}
  .hero .g-rose{width:600px;height:600px;left:-60px;top:-180px;background:var(--rose);opacity:.05;filter:blur(75px)}
  .hero .g-or1{width:500px;height:500px;right:0;top:-120px;background:var(--orange);opacity:.06;filter:blur(65px)}
  .hero .g-or2{width:420px;height:420px;left:48%;top:30%;background:var(--peach);opacity:.04;filter:blur(60px)}
  .hero .blob{position:absolute;z-index:0;left:50%;top:46%;width:1180px;height:700px;transform:translate(-50%,-50%) rotate(-8deg);opacity:.8;pointer-events:none;filter:blur(44px);
    background:
      radial-gradient(closest-side at 52% 50%,rgba(255,26,102,.55),rgba(230,0,0,.28) 45%,transparent 72%),
      radial-gradient(closest-side at 40% 50%,rgba(255,117,26,.45),rgba(255,128,0,0) 70%),
      radial-gradient(closest-side at 33% 50%,rgba(255,130,77,.35),transparent 70%)}
  .hero-in{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:28px;max-width:1024px;text-align:center}
  .hero h1{font-family:var(--serif);letter-spacing:-3.2px;line-height:1.0}
  .hero h1 .l1{display:block;font-weight:400;font-size:100px;color:var(--ink)}
  .hero h1 .l2{display:block;font-weight:700;font-size:128px;color:#fff}
  .hero .sub{font-family:var(--sans);font-weight:400;font-size:20px;line-height:28px;color:var(--ink);max-width:823px}
  .hero .cta{display:flex;gap:16px;align-items:center;justify-content:center;padding-top:16px;flex-wrap:wrap}
  .btn{font-family:var(--sans);font-weight:500;font-size:18px;line-height:28px;border-radius:9999px;cursor:pointer;display:inline-flex;align-items:center;transition:transform .2s,box-shadow .2s}
  .btn-fill{color:#fff;background:var(--grad-btn);padding:16px 32px;box-shadow:0 3px 2.75px rgba(0,0,0,.25),0 0 60px 20px rgba(255,77,136,.15)}
  .btn-fill:hover{transform:translateY(-2px)}
  .btn-out{color:var(--ink);background:rgba(0,0,0,.1);border:1px solid rgba(255,255,255,.5);padding:16px 33px}
  .btn-out:hover{background:rgba(255,255,255,.06)}
  .proof{display:flex;align-items:center;gap:12px;padding-top:8px}
  .avatars{display:flex}
  .avatars .av{width:48px;height:48px;border-radius:24px;border:2px solid #000;background:var(--grey16);overflow:hidden;margin-right:-16px}
  .avatars .av:last-child{margin-right:0}
  .avatars .av img{width:100%;height:100%;object-fit:cover}
  .proof .lbl{font-family:var(--sans);font-weight:500;font-size:14px;line-height:20px;color:#fff}

  /* ---------------- shared section heads ---------------- */
  .section{position:relative;padding:64px 56px 80px}
  .section .glow{position:absolute;border-radius:9999px;z-index:0;pointer-events:none}
  .sec-h2{font-family:var(--serif);font-weight:700;font-size:72px;line-height:72px;color:var(--ink)}
  .sec-sub{font-family:var(--sans);font-weight:400;font-size:18px;line-height:28px;color:var(--grey)}

  /* ---------------- CREATIVE COMMUNITY ---------------- */
  .community .glow{width:800px;height:800px;background:var(--rose);opacity:.06;filter:blur(80px);right:-120px;top:-80px}
  .community .head{margin-bottom:48px}
  .community .sec-sub{max-width:448px;margin-top:16px}
  .cards{display:flex;gap:24px;align-items:flex-start}
  .pcard{flex:1;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:270/360}
  .pcard:nth-child(2){margin-top:80px}
  .pcard:nth-child(3){margin-top:32px}
  .pcard:nth-child(4){margin-top:112px}
  .pcard>img{width:100%;height:100%;object-fit:cover}
  .pcard.grad-bg{background:linear-gradient(180deg,var(--red),var(--rose))}
  .pcard .ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(9,9,11,.9) 0%,rgba(9,9,11,.2) 50%,rgba(9,9,11,0) 100%);opacity:.85}
  .pcard .meta{position:absolute;left:0;right:0;bottom:0;padding:20px;z-index:2}
  .pcard .meta .nm{font-family:var(--serif);font-weight:600;font-size:20px;line-height:28px;color:var(--ink)}
  .pcard .meta .rl{font-family:var(--sans);font-weight:400;font-size:14px;line-height:20px;color:var(--rose)}
  .pcard .meta .pl{font-family:var(--sans);font-weight:400;font-size:12px;line-height:16px;color:var(--ink)}
  /* per-discipline accent: rose / violet / gold / teal — breaks the all-orange wash */
  .pcard{transition:transform .35s ease,box-shadow .35s ease}
  .pcard:hover{transform:translateY(-6px)}
  .pcard.acc-rose{--acc:#ff4d88;box-shadow:0 26px 60px -30px rgba(255,77,136,.6)}
  .pcard.acc-violet{--acc:#8b5cf6;box-shadow:0 26px 60px -30px rgba(139,92,246,.6)}
  .pcard.acc-gold{--acc:#f59e0b;box-shadow:0 26px 60px -30px rgba(245,158,11,.55)}
  .pcard.acc-teal{--acc:#14b8a6;box-shadow:0 26px 60px -30px rgba(20,184,166,.55)}
  .pcard .meta .rl{color:var(--acc,var(--rose));display:flex;align-items:center;gap:7px}
  .pcard .meta .rl::before{content:"";width:7px;height:7px;border-radius:99px;background:var(--acc,var(--rose));box-shadow:0 0 10px 1px var(--acc,var(--rose))}

  /* ---------------- DISCOVER ---------------- */
  .discover{position:relative;padding:80px 56px;overflow:hidden}
  .discover .inner{max-width:1024px;margin:0 auto;position:relative;z-index:2}
  .discover .glow1{position:absolute;z-index:0;pointer-events:none;border-radius:9999px;width:600px;height:600px;background:var(--orange);opacity:.05;filter:blur(70px);right:0;top:-220px}
  .discover .glow2{position:absolute;z-index:0;pointer-events:none;border-radius:9999px;width:500px;height:500px;background:var(--peach);opacity:.04;filter:blur(60px);left:-80px;bottom:-120px}
  .discover .head{text-align:center;max-width:680px;margin:0 auto 28px;gap:14px}
  .discover .head .sec-sub{margin:0 auto}
  /* Discover (V3) — filter tabs + cards */
  .disc-card.gig{--acc:#ff4d88}.disc-card.event{--acc:#8b5cf6}.disc-card.job{--acc:#f59e0b}
  .disc-kick{font-family:var(--sans);font-weight:700;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--acc,var(--rose));display:inline-flex;align-items:center;gap:7px}
  .disc-kick::before{content:"";width:7px;height:7px;border-radius:99px;background:var(--acc,var(--rose));box-shadow:0 0 10px 1px var(--acc,var(--rose))}
  .disc-tabswrap{display:flex;justify-content:center;margin-bottom:36px}
  .disc-tabs{display:inline-flex;flex-wrap:wrap;gap:6px;background:rgba(17,17,19,.6);border:1px solid rgba(39,39,42,.5);border-radius:999px;padding:6px}
  .disc-tab{font-family:var(--sans);font-weight:500;font-size:14.5px;color:var(--grey);padding:11px 24px;border:0;background:none;border-radius:999px;cursor:pointer;transition:all .25s;white-space:nowrap;-webkit-tap-highlight-color:transparent}
  .disc-tab.on{background:var(--grad-btn);color:#1a0c04;font-weight:600;box-shadow:0 6px 18px -8px rgba(255,77,136,.5)}
  .disc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .disc-card{position:relative;background:rgba(17,17,19,.4);border:1px solid rgba(39,39,42,.45);border-radius:16px;padding:26px;transition:transform .3s,border-color .3s,box-shadow .3s;cursor:pointer;overflow:hidden;animation:discpop .35s ease}
  .disc-card::before{content:"";position:absolute;inset:0;background:radial-gradient(120% 120% at 0% 100%,color-mix(in srgb,var(--acc) 14%,transparent),transparent 55%);opacity:0;transition:opacity .3s;pointer-events:none}
  .disc-card:hover{transform:translateY(-5px);border-color:color-mix(in srgb,var(--acc) 45%,transparent);box-shadow:0 22px 55px -30px var(--acc)}
  .disc-card:hover::before{opacity:1}
  @keyframes discpop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .disc-card .ttl{font-family:var(--serif);font-weight:600;font-size:21px;line-height:1.15;color:var(--ink);margin:12px 0 8px;position:relative}
  .disc-card .meta{font-family:var(--sans);font-size:13px;color:var(--grey);margin-bottom:18px;position:relative}
  .disc-card .go{font-family:var(--sans);font-weight:500;font-size:13.5px;color:var(--ink);display:inline-flex;gap:7px;align-items:center;position:relative}
  .disc-card .go b{color:var(--acc);transition:transform .3s;display:inline-block}
  .disc-card:hover .go b{transform:translateX(4px)}
  .disc-card.hide{display:none}
  @media(max-width:1100px){.disc-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:560px){.disc-grid{grid-template-columns:1fr 1fr;gap:12px}.disc-card{padding:16px}.disc-card .ttl{font-size:16px;line-height:1.2;margin:10px 0 6px}.disc-card .meta{font-size:11.5px;margin-bottom:12px}.disc-card .go{font-size:12.5px}.disc-tab{padding:10px 16px;font-size:13.5px}}

  /* ---------------- QUOTE (white) ---------------- */
  .quote{position:relative;background:#fff;padding:150px 24px;display:flex;flex-direction:column;align-items:center;overflow:hidden}
  .quote .fade-top,.quote .fade-bot{position:absolute;left:0;right:0;height:188px;z-index:2;pointer-events:none}
  .quote .fade-top{top:0;background:linear-gradient(180deg,#09090b 0%,rgba(255,255,255,0) 100%)}
  .quote .fade-bot{bottom:0;background:linear-gradient(0deg,#09090b 0%,rgba(255,255,255,0) 100%)}
  .quote .stair{font-family:var(--serif);font-weight:700;color:#000;font-size:120px;line-height:1.0;text-align:left;max-width:1200px}
  .quote .stair .s1{margin-left:0}
  .quote .stair .s2{margin-left:106px}
  .quote .stair .s3{margin-left:239px}
  .quote .manifesto{margin-top:34px;font-family:var(--sans);font-weight:500;font-size:24px;line-height:32px;
    background:linear-gradient(180deg,#ef4444,#ff4d88);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}

  /* ---------------- VOICES ---------------- */
  .voices{position:relative;padding:80px 56px;text-align:center;overflow:hidden}
  .voices .glow{position:absolute;z-index:0;pointer-events:none;border-radius:9999px;width:800px;height:800px;background:var(--orange);opacity:.04;filter:blur(80px);left:50%;top:50%;transform:translate(-50%,-50%)}
  .voices .head{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:16px;margin-bottom:64px}
  .voices .sec-sub{max-width:585px}
  .tgrid{position:relative;z-index:2;max-width:896px;margin:0 auto;columns:2;column-gap:32px;text-align:left}
  .tcard{break-inside:avoid;margin-bottom:32px;background:#111113;backdrop-filter:blur(2px);border:1px solid rgba(39,39,42,.15);border-radius:16px;padding:31px}
  .tcard:nth-child(2){margin-top:48px}
  .tcard .qt{font-family:var(--sans);font-weight:400;font-size:18px;line-height:29.25px;color:rgba(245,245,245,.9);margin-bottom:24px}
  .tcard .who{display:flex;align-items:center;gap:12px}
  .tcard .who .av{width:40px;height:40px;border-radius:9999px;overflow:hidden;flex:none}
  .tcard .who .av img{width:100%;height:100%;object-fit:cover}
  .tcard .who .nm{font-family:var(--serif);font-weight:600;font-size:14px;line-height:20px;color:var(--ink)}
  .tcard .who .ty{font-family:var(--sans);font-weight:400;font-size:12px;line-height:16px;color:var(--rose)}

  /* ---------------- CTA + FOOTER (reconstructed) ---------------- */
  .final{position:relative;padding:120px 56px;text-align:center;overflow:hidden}
  .final .glow{width:800px;height:500px;background:var(--rose);opacity:.06;filter:blur(90px);left:50%;top:30%;transform:translate(-50%,-50%);border-radius:9999px;position:absolute;z-index:0}
  .final h2{font-family:var(--serif);font-weight:700;font-size:72px;line-height:78px;color:var(--ink);position:relative;z-index:2}
  .final p{font-family:var(--sans);font-weight:400;font-size:18px;line-height:28px;color:var(--grey);margin:18px auto 32px;max-width:560px;position:relative;z-index:2}
  .final .cta{display:flex;gap:16px;justify-content:center;position:relative;z-index:2}
  footer{border-top:1px solid rgba(245,245,245,.08);padding:40px 56px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;position:relative;z-index:2}
  footer .logo{font-family:var(--serif);font-weight:700;font-size:22px;background:var(--grad-text);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  footer .fl{display:flex;gap:28px;font-family:var(--sans);font-size:14px;color:var(--grey)}
  footer .fl a:hover{color:var(--ink)}
  footer .cp{font-family:var(--sans);font-size:13px;color:rgba(245,245,245,.36)}

  /* ---------------- MATCH (find talent / clients / work) ---------------- */
  .match{position:relative;padding:96px 56px 80px}
  .match .glow{position:absolute;z-index:0;border-radius:9999px;pointer-events:none;width:720px;height:520px;background:var(--orange);opacity:.05;filter:blur(80px);left:50%;top:-40px;transform:translateX(-50%)}
  .match .head{text-align:center;max-width:780px;margin:0 auto 56px}
  .match .sec-sub{max-width:600px;margin:18px auto 0}
  .mgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  .mcard{position:relative;background:rgba(17,17,19,.3);backdrop-filter:blur(2px);border:1px solid rgba(39,39,42,.25);border-radius:16px;padding:30px;overflow:hidden;transition:transform .3s,border-color .3s,background .3s}
  .mcard:hover{transform:translateY(-6px);border-color:rgba(255,77,136,.35);background:rgba(17,17,19,.5)}
  .mcard .ic{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;background:var(--grad-btn);margin-bottom:20px;box-shadow:0 8px 22px -8px rgba(255,77,136,.5)}
  .mcard .ic svg{width:23px;height:23px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .mcard .kick{font-family:var(--sans);font-weight:500;font-size:12px;letter-spacing:.6px;text-transform:uppercase;color:var(--rose);margin-bottom:8px}
  .mcard h3{font-family:var(--serif);font-weight:600;font-size:24px;line-height:30px;color:var(--ink);margin-bottom:10px}
  .mcard p{font-family:var(--sans);font-weight:400;font-size:15px;line-height:23px;color:var(--grey);margin-bottom:18px}
  .mcard .find{font-family:var(--sans);font-weight:500;font-size:14px;color:var(--ink);display:inline-flex;align-items:center;gap:7px}
  .mcard .find b{color:var(--rose);font-weight:500;transition:transform .3s;display:inline-block}
  .mcard:hover .find b{transform:translateX(4px)}
  /* ===== ROLE SECTION (Variation 3) — desktop hover panels / mobile scroll accordion ===== */
  .rv3-track{position:relative}
  .rv3-sticky{position:relative}
  .rv3-panels{display:flex;flex-direction:row;gap:14px;height:480px;margin-top:8px}
  .rv3-panel{position:relative;flex:1;border:0;padding:0;text-align:left;color:var(--ink);border-radius:18px;overflow:hidden;cursor:pointer;background:var(--grey16);transition:flex .5s cubic-bezier(.22,.61,.36,1);-webkit-tap-highlight-color:transparent}
  .rv3-panel>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;filter:grayscale(.2) brightness(.6);transition:filter .5s}
  .rv3-tint{position:absolute;inset:0;z-index:1;opacity:.5;mix-blend-mode:soft-light;pointer-events:none}
  .rv3-tint.client{background:linear-gradient(135deg,#f7c45a,#ff822e)}
  .rv3-tint.lead{background:linear-gradient(135deg,#ff4d88,#ff822e)}
  .rv3-tint.artist{background:linear-gradient(135deg,#ff4d88,#6d23b6)}
  .rv3-ov{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(to top,rgba(9,9,11,.93) 0%,rgba(9,9,11,.5) 50%,rgba(9,9,11,.26) 100%)}
  .rv3-chev{position:absolute;top:15px;right:15px;z-index:4;width:28px;height:28px;border-radius:99px;display:grid;place-items:center;background:rgba(9,9,11,.45);border:1px solid rgba(255,255,255,.28);transition:transform .45s ease}
  .rv3-chev svg{width:14px;height:14px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
  .rv3-rt{font-family:var(--serif);font-weight:600;font-style:italic;line-height:1.04;background:linear-gradient(120deg,#fff,#ffe3d3);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .rv3-closed{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:24px;display:flex;flex-direction:column;align-items:flex-start;opacity:1;transform:translateY(0);transition:opacity .34s ease,transform .5s cubic-bezier(.22,.61,.36,1)}
  .rv3-closed .ck{font-family:var(--sans);font-weight:700;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:rgba(255,233,217,.86);margin-bottom:7px}
  .rv3-closed .ch{font-family:var(--serif);font-weight:600;font-size:28px;line-height:1.04;color:#fff;white-space:nowrap}
  .rv3-open{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:26px;background:radial-gradient(135% 78% at 50% 54%,rgba(9,9,11,.5),transparent 76%);opacity:0;transform:translateY(16px);pointer-events:none;transition:opacity .42s ease .04s,transform .52s cubic-bezier(.22,.61,.36,1)}
  .rv3-open .pre{font-family:var(--sans);font-weight:500;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.82);margin-bottom:8px}
  .rv3-open .big{font-size:38px}
  .rv3-open .act{font-family:var(--serif);font-weight:500;font-size:19px;line-height:1.2;color:rgba(245,245,245,.96);margin-top:12px}
  .rv3-open .desc{font-family:var(--sans);font-size:14px;line-height:1.5;color:rgba(245,245,245,.86);max-width:300px;margin-top:11px}
  .rv3-open .go{display:inline-flex;align-items:center;gap:7px;font-family:var(--sans);font-weight:500;font-size:14px;color:#fff;margin-top:28px}
  .rv3-open .go b{color:#ffd9c2;font-weight:600}
  .rv3-progress,.rv3-cue{display:none}
  .rv3-dot{width:30px;height:4px;border-radius:99px;background:rgba(255,255,255,.16);overflow:hidden}
  .rv3-dot i{display:block;height:100%;width:100%;border-radius:99px;background:var(--grad-btn);transform:scaleX(0);transform-origin:left;transition:transform .4s ease}
  .rv3-dot.on i{transform:scaleX(1)}
  .rv3-cue svg{width:15px;height:15px;stroke:var(--rose);fill:none;stroke-width:2;animation:rv3bob 1.6s ease-in-out infinite}
  @keyframes rv3bob{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
  /* desktop: hover expands a lane into the centered hero */
  @media(hover:hover) and (min-width:760px){
    .rv3-panel:hover{flex:2.6}
    .rv3-panel:hover>img{filter:grayscale(0) brightness(.82)}
    .rv3-panel:hover .rv3-closed{opacity:0;transform:translateY(-12px);pointer-events:none}
    .rv3-panel:hover .rv3-open{opacity:1;transform:none;pointer-events:auto}
    .rv3-chev{display:none}
  }
  /* mobile: sticky, scroll-driven accordion */
  @media(max-width:759px){
    .rv3-track{height:280vh}
    .rv3-sticky{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;justify-content:center;gap:12px}
    .rv3sec .head{margin-bottom:16px!important}
    .rv3-panels{flex-direction:column;height:auto;gap:11px;margin-top:0}
    .rv3-panel{flex:none;height:104px;transition:height .55s cubic-bezier(.22,.61,.36,1)}
    .rv3-panel.open{height:348px}
    .rv3-panel>img{filter:grayscale(.12) brightness(.6)}
    .rv3-panel.open>img{filter:grayscale(0) brightness(.74)}
    .rv3-panel.open .rv3-closed{opacity:0;transform:translateY(-12px);pointer-events:none}
    .rv3-panel.open .rv3-open{opacity:1;transform:none;pointer-events:auto}
    .rv3-closed{padding:18px 20px}
    .rv3-closed .ch{font-size:25px;white-space:normal}
    .rv3-open{padding:20px 22px}
    .rv3-open .big{font-size:34px}
    .rv3-progress{display:flex;justify-content:center;gap:8px;margin-top:4px}
    .rv3-cue{display:flex;justify-content:center;align-items:center;gap:7px;margin-top:8px;color:var(--grey);font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.8}
  }

  /* ---------------- EVENTS (never stop growing — scrollable) ---------------- */
  .events{position:relative;padding:80px 0}
  .events .glow{position:absolute;z-index:0;border-radius:9999px;pointer-events:none;width:720px;height:600px;background:var(--rose);opacity:.05;filter:blur(80px);left:-120px;top:0}
  .events .head{max-width:1192px;margin:0 auto 40px;padding:0 56px;position:relative;z-index:2}
  .events .sec-sub{max-width:540px;margin-top:16px}
  .escroll-wrap{position:relative;z-index:2}
  .escroll{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;padding:6px 56px 18px;scrollbar-width:thin;scrollbar-color:rgba(255,77,136,.4) transparent}
  .escroll::-webkit-scrollbar{height:6px}
  .escroll::-webkit-scrollbar-thumb{background:rgba(255,77,136,.4);border-radius:99px}
  .escroll::-webkit-scrollbar-track{background:transparent}
  .ecard{flex:0 0 300px;scroll-snap-align:start;border-radius:16px;overflow:hidden;border:1px solid rgba(39,39,42,.25);background:rgba(17,17,19,.4);backdrop-filter:blur(2px);transition:transform .3s,border-color .3s}
  .ecard:hover{transform:translateY(-6px);border-color:rgba(255,77,136,.35)}
  .ecard .cover{height:148px;position:relative;display:flex;align-items:flex-end;padding:14px}
  .ecard .cover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(9,9,11,.45))}
  .ecard .cover .badge{position:relative;z-index:1;font-family:var(--sans);font-weight:700;font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:#fff;background:rgba(9,9,11,.5);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.2);padding:6px 12px;border-radius:99px}
  .ecard .body{padding:20px}
  .ecard .body h4{font-family:var(--serif);font-weight:600;font-size:20px;line-height:26px;color:var(--ink);margin-bottom:8px}
  .ecard .body .meta{font-family:var(--sans);font-weight:400;font-size:13px;line-height:18px;color:var(--grey)}
  .events .edge{position:absolute;top:0;bottom:18px;right:0;width:90px;background:linear-gradient(90deg,transparent,var(--bg));pointer-events:none;z-index:3}

  @media(max-width:1100px){
    .hero h1 .l1{font-size:64px}.hero h1 .l2{font-size:80px}
    .sec-h2{font-size:48px;line-height:1.05}
    .quote .stair{font-size:64px}.quote .stair .s2{margin-left:48px}.quote .stair .s3{margin-left:96px}
    .cards{flex-wrap:wrap;gap:18px;align-items:flex-start}
    .pcard{flex:1 1 calc(50% - 9px);aspect-ratio:270/360;margin-top:0!important}
    .pcard:nth-child(odd){transform:rotate(-2deg)}
    .pcard:nth-child(even){margin-top:62px!important;transform:rotate(2deg)}
    .opps{grid-template-columns:1fr}
    .tgrid{columns:1}
    .section,.discover,.voices,.final,.nav,footer,.match{padding-left:24px;padding-right:24px}
    .mgrid{grid-template-columns:1fr;gap:16px}
    /* role section (.rv3) handles its own responsive behaviour at the 760px breakpoint */
    .events .head{padding-left:24px;padding-right:24px}
    .escroll{padding-left:24px;padding-right:24px}
  }
  @media(max-width:560px){
    .hero h1 .l1{font-size:42px}.hero h1 .l2{font-size:52px}.hero h1{letter-spacing:-1px}
    .cards{flex-direction:column;align-items:stretch;gap:20px}
    .pcard{flex:0 0 auto;width:78%;aspect-ratio:270/350;margin-top:0!important}
    .pcard:nth-child(odd){margin-right:auto;transform:rotate(-2.5deg)}
    .pcard:nth-child(even){margin-left:auto;transform:rotate(2.5deg)}
    .quote .stair{font-size:40px}.quote .stair .s2{margin-left:24px}.quote .stair .s3{margin-left:48px}
  }
</style>

<!-- NAV -->
<nav class="nav">
  <div class="logo">NETSA</div>
  <a class="nav-cta" href="#" data-nav="join">Join Netsa</a>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="grid-bg"></div>
  <div class="glow g-rose"></div><div class="glow g-or1"></div><div class="glow g-or2"></div>
  <div class="blob"></div>
  <div class="hero-in">
    <h1><span class="l1">THE STAGE IS</span><span class="l2">REVOLUTIONIZED</span></h1>
    <p class="sub">Empowering India's performing artists with a transparent, direct, and professional ecosystem. No more WhatsApp calls, just your talent.</p>
    <div class="cta">
      <a class="btn btn-fill" href="#" data-cta="join">Join Netsa</a>
      <a class="btn btn-out" href="#" data-cta="gigs">Explore Gigs</a>
    </div>
    <div class="proof">
      <div class="avatars">
        <span class="av"><img src="/landing/imgContainer.jpg" alt=""></span>
        <span class="av"><img src="/landing/imgContainer1.jpg" alt=""></span>
        <span class="av"><img src="/landing/imgContainer2.jpg" alt=""></span>
        <span class="av"><img src="/landing/imgContainer3.jpg" alt=""></span>
      </div>
      <span class="lbl">26M+ Aspiring Artists in India</span>
    </div>
  </div>
</section>

<!-- MATCH: find talent / clients / work -->
<section class="match rv3sec">
  <div class="grid-bg"></div>
  <div class="glow"></div>
  <div class="wrap">
    <div class="rv3-track"><div class="rv3-sticky">
      <div class="head">
        <h2 class="sec-h2">Find talent. Find clients.<br><span class="gtext">Find work.</span></h2>
        <p class="sec-sub">Whichever side of the stage you're on, NETSA connects you to the other — all in one place.</p>
      </div>
      <div class="rv3-panels">
        <button class="rv3-panel" aria-expanded="false">
          <img src="/landing/v2-client.jpg" alt="">
          <span class="rv3-tint client"></span><span class="rv3-ov"></span>
          <span class="rv3-chev"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
          <span class="rv3-closed"><span class="ck">For Clients</span><span class="ch">Find your talent</span></span>
          <span class="rv3-open"><span class="pre">On NETSA for</span><span class="big rv3-rt">Clients</span><span class="act">Find your talent</span><span class="desc">Post your event and get matched with vetted creative leads and performers.</span><span class="go">Hire the stage <b>&rarr;</b></span></span>
        </button>
        <button class="rv3-panel" aria-expanded="false">
          <img src="/landing/imgSagarBora.jpg" alt="">
          <span class="rv3-tint lead"></span><span class="rv3-ov"></span>
          <span class="rv3-chev"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
          <span class="rv3-closed"><span class="ck">For Creative Leads</span><span class="ch">Find clients &amp; crew</span></span>
          <span class="rv3-open"><span class="pre">On NETSA for</span><span class="big rv3-rt">Creative Leads</span><span class="act">Find clients &amp; crew</span><span class="desc">Win work, then build and book your own team — both sides, one profile.</span><span class="go">Lead the show <b>&rarr;</b></span></span>
        </button>
        <button class="rv3-panel" aria-expanded="false">
          <img src="/landing/imgSagarBora2.jpg" alt="">
          <span class="rv3-tint artist"></span><span class="rv3-ov"></span>
          <span class="rv3-chev"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
          <span class="rv3-closed"><span class="ck">For Artists</span><span class="ch">Find your next gig</span></span>
          <span class="rv3-open"><span class="pre">On NETSA for</span><span class="big rv3-rt">Artists</span><span class="act">Find your next gig</span><span class="desc">Get discovered, apply to gigs that fit, and build your name.</span><span class="go">Take the stage <b>&rarr;</b></span></span>
        </button>
      </div>
      <div class="rv3-progress"><span class="rv3-dot"><i></i></span><span class="rv3-dot"><i></i></span><span class="rv3-dot"><i></i></span></div>
      <div class="rv3-cue"><span>scroll</span><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>
    </div></div>
  </div>
</section>

<!-- CREATIVE COMMUNITY -->
<section class="section community">
  <div class="grid-bg"></div>
  <div class="glow"></div>
  <div class="wrap">
    <div class="head">
      <h2 class="sec-h2">The <span class="gtext">Creative</span><br>Community</h2>
      <p class="sec-sub">Meet artists from every discipline, building an audience and sharing across the globe.</p>
    </div>
    <div class="cards">
      <div class="pcard acc-rose">
        <img src="/landing/v2-dancer.jpg" alt="Dancer">
        <div class="ov"></div>
        <div class="meta"><div class="nm">Dancer</div><div class="rl">Kathak &amp; contemporary</div><div class="pl">Pune</div></div>
      </div>
      <div class="pcard acc-violet">
        <img src="/landing/v2-musician.jpg" alt="Vocalist">
        <div class="ov"></div>
        <div class="meta"><div class="nm">Vocalist</div><div class="rl">Hindustani vocal</div><div class="pl">Mumbai</div></div>
      </div>
      <div class="pcard acc-gold">
        <img src="/landing/v2-vocalist.jpg" alt="Musician">
        <div class="ov"></div>
        <div class="meta"><div class="nm">Musician</div><div class="rl">Sitar &amp; tabla</div><div class="pl">Delhi</div></div>
      </div>
      <div class="pcard acc-teal">
        <img src="/landing/v2-actor.jpg" alt="Actor">
        <div class="ov"></div>
        <div class="meta"><div class="nm">Actor</div><div class="rl">Stage &amp; screen</div><div class="pl">Bengaluru</div></div>
      </div>
    </div>
  </div>
</section>

<!-- DISCOVER -->
<section class="discover">
  <div class="grid-bg"></div>
  <div class="glow glow1"></div><div class="glow glow2"></div>
  <div class="inner">
    <div class="head">
      <h2 class="sec-h2">Discover <span class="gtext">Opportunities</span></h2>
      <p class="sec-sub">Gigs, events and jobs — all in one place.</p>
    </div>
    <div class="disc-tabswrap"><div class="disc-tabs" role="tablist">
      <button class="disc-tab on" data-f="all">All</button>
      <button class="disc-tab" data-f="gig">Gigs</button>
      <button class="disc-tab" data-f="event">Events</button>
      <button class="disc-tab" data-f="job">Jobs</button>
    </div></div>
    <div class="disc-grid">
      <div class="disc-card gig" data-t="gig"><span class="disc-kick">Gig</span><div class="ttl">Live Band for a Sangeet</div><div class="meta">Jaipur · 18 Nov · ₹40,000</div><span class="go">Explore <b>&rarr;</b></span></div>
      <div class="disc-card event" data-t="event"><span class="disc-kick">Event</span><div class="ttl">Open Audition — Feature Film</div><div class="meta">Casting · Mumbai · 12 Nov</div><span class="go">Explore <b>&rarr;</b></span></div>
      <div class="disc-card job" data-t="job"><span class="disc-kick">Job</span><div class="ttl">Resident DJ — Fri &amp; Sat</div><div class="meta">Pune · Part-time</div><span class="go">Explore <b>&rarr;</b></span></div>
      <div class="disc-card gig" data-t="gig"><span class="disc-kick">Gig</span><div class="ttl">Emcee for a Product Launch</div><div class="meta">Mumbai · 22 Nov</div><span class="go">Explore <b>&rarr;</b></span></div>
      <div class="disc-card event" data-t="event"><span class="disc-kick">Event</span><div class="ttl">Kathak Masterclass</div><div class="meta">Workshop · Pune · 2 days</div><span class="go">Explore <b>&rarr;</b></span></div>
      <div class="disc-card job" data-t="job"><span class="disc-kick">Job</span><div class="ttl">Music Teacher (Full-time)</div><div class="meta">Mumbai · Full-time</div><span class="go">Explore <b>&rarr;</b></span></div>
    </div>
  </div>
</section>

<!-- EVENTS: never stop growing -->
<section class="events">
  <div class="grid-bg"></div>
  <div class="glow"></div>
  <div class="head">
    <h2 class="sec-h2">Never stop <span class="gtext">growing.</span></h2>
    <p class="sec-sub">Workshops, masterclasses, auditions, open mics and jams — performing-arts events to discover and show up to, between every gig.</p>
  </div>
  <div class="escroll-wrap">
    <div class="escroll">
      <div class="ecard"><div class="cover" style="background:linear-gradient(135deg,#ff4d88,#ff822e)"><span class="badge">Workshop</span></div><div class="body"><h4>Kathak masterclass</h4><div class="meta">Sat 10am · Pune · 12 spots left</div></div></div>
      <div class="ecard"><div class="cover" style="background:linear-gradient(135deg,#ef4444,#ff4d88)"><span class="badge">Audition</span></div><div class="body"><h4>Open audition — short film</h4><div class="meta">22 Nov · Mumbai</div></div></div>
      <div class="ecard"><div class="cover" style="background:linear-gradient(135deg,#ff822e,#ff976b)"><span class="badge">Open Mic</span></div><div class="body"><h4>Citywide open mic night</h4><div class="meta">Every Sunday · Pune · Free</div></div></div>
      <div class="ecard"><div class="cover" style="background:linear-gradient(135deg,#ff976b,#ff4d88)"><span class="badge">Jam</span></div><div class="body"><h4>Sunday jam session</h4><div class="meta">Weekly · Pune · Free</div></div></div>
      <div class="ecard"><div class="cover" style="background:linear-gradient(135deg,#ff4d88,#c41e3a)"><span class="badge">Workshop</span></div><div class="body"><h4>Vocal technique workshop</h4><div class="meta">Sat · Online</div></div></div>
      <div class="ecard"><div class="cover" style="background:linear-gradient(135deg,#ff822e,#ef4444)"><span class="badge">Masterclass</span></div><div class="body"><h4>Theatre intensive</h4><div class="meta">5 days · Pune</div></div></div>
    </div>
    <div class="edge"></div>
  </div>
</section>

<!-- QUOTE -->
<section class="quote">
  <div class="fade-top"></div>
  <div class="stair">
    <div class="s1">"PERFORMING</div>
    <div class="s2">ART IS</div>
    <div class="s2">NOT JUST</div>
    <div class="s3">HOBBY."</div>
  </div>
  <div class="manifesto">The NETSA Manifesto</div>
  <div class="fade-bot"></div>
</section>

<!-- VOICES -->
<section class="voices">
  <div class="grid-bg"></div>
  <div class="glow"></div>
  <div class="wrap" style="z-index:2">
    <div class="head">
      <h2 class="sec-h2">Voices from the<br><span class="gtext">Community</span></h2>
      <p class="sec-sub">Real stories from artists building their creative careers on NETSA.</p>
    </div>
    <div class="tgrid">
      <div class="tcard">
        <p class="qt">"NETSA helped me connect with filmmakers across the world and land my first international project."</p>
        <div class="who"><span class="av"><img src="/landing/imgMarcusCole.jpg" alt=""></span><div><div class="nm">Name</div><div class="ty">Artist Type</div></div></div>
      </div>
      <div class="tcard">
        <p class="qt">"I found three collaborative projects in my first week. The community here is incredibly supportive."</p>
        <div class="who"><span class="av"><img src="/landing/imgLenaRichter.jpg" alt=""></span><div><div class="nm">Name</div><div class="ty">Artist Type</div></div></div>
      </div>
      <div class="tcard">
        <p class="qt">"The opportunities on NETSA are real. I've worked with amazing artists I never would have met otherwise."</p>
        <div class="who"><span class="av"><img src="/landing/imgArjunMehta.jpg" alt=""></span><div><div class="nm">Name</div><div class="ty">Artist Type</div></div></div>
      </div>
      <div class="tcard">
        <p class="qt">"From open mics to paid gigs in a month. NETSA finally put my work in front of the right people."</p>
        <div class="who"><span class="av"><img src="/landing/imgYukiTanaka.jpg" alt=""></span><div><div class="nm">Name</div><div class="ty">Artist Type</div></div></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA + FOOTER (reconstructed from screenshot) -->
<section class="final">
  <div class="grid-bg"></div>
  <div class="glow"></div>
  <h2>Ready to take <span class="gtext">center stage?</span></h2>
  <p>Join a growing community of performing artists finding work, building reputation, and owning their craft.</p>
  <div class="cta">
    <a class="btn btn-fill" href="#" data-cta="join">Join Netsa</a>
    <a class="btn btn-out" href="#" data-cta="gigs">Explore Gigs</a>
  </div>
</section>

<footer>
  <div class="logo">NETSA</div>
  <div class="fl"><a href="#">For Artists</a><a href="#">Discover</a><a href="#">Community</a><a href="#">About</a></div>
  <div class="cp">© 2026 NETSA · Made for the Indian stage</div>
</footer>
`;

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,600;1,700&family=Space+Grotesk:wght@400;500;700&display=swap';

/**
 * Renders the marketing design on web.
 *
 * The markup is injected via `React.createElement('div', { dangerouslySetInnerHTML })`
 * — writing lowercase DOM JSX (`<div>`, `<style>`) would fail tsc in a React
 * Native project because those tags aren't in RN's JSX.IntrinsicElements.
 */
function WebLanding() {
  const router = useRouter();
  // Bridge: the role-section scroll-spy lives in the effect below (operating on
  // the dangerouslySetInnerHTML DOM). RN-Web's <ScrollView> scrolls an inner div
  // that does NOT emit native `scroll` events, so we drive compute() from the
  // ScrollView's own onScroll prop via this ref.
  const computeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // SSR/native guard: only run in a real browser.
    if (typeof document === 'undefined') return;

    // 1. Inject the Google Fonts <link> (guard against duplicate insertion).
    if (!document.querySelector('link[data-netsa-fonts]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = GOOGLE_FONTS_HREF;
      link.setAttribute('data-netsa-fonts', '');
      document.head.appendChild(link);
    }

    const cleanups: Array<() => void> = [];

    // Run after the dangerouslySetInnerHTML markup is committed to the DOM.
    const raf = requestAnimationFrame(() => {
      // 2. Role section (.rv3): scroll-driven accordion on mobile; desktop uses :hover.
      (function () {
        const sec = document.querySelector('.rv3sec');
        if (!sec) return;
        const panels = ([] as Element[]).slice.call(sec.querySelectorAll('.rv3-panel'));
        const dots = ([] as Element[]).slice.call(sec.querySelectorAll('.rv3-dot'));
        const track = sec.querySelector('.rv3-track') as HTMLElement | null;
        const sticky = sec.querySelector('.rv3-sticky') as HTMLElement | null;
        if (!track || !sticky) return;
        // RN-Web renders the landing inside a <ScrollView> (a div that scrolls),
        // NOT the window — find that scroll container so we can listen to it.
        function getScrollContainer(el: HTMLElement): HTMLElement | Window {
          let n: HTMLElement | null = el.parentElement;
          while (n) {
            const oy = window.getComputedStyle(n).overflowY;
            if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) return n;
            n = n.parentElement;
          }
          return window;
        }
        const scroller: HTMLElement | Window = getScrollContainer(track);
        const mq = window.matchMedia('(max-width:759px)');
        let cur = -1;
        let ticking = false;
        function setIdx(i: number) {
          if (i === cur) return;
          cur = i;
          panels.forEach(function (p, k) {
            const on = k === i;
            p.classList.toggle('open', on);
            p.setAttribute('aria-expanded', on ? 'true' : 'false');
          });
          dots.forEach(function (d, k) {
            d.classList.toggle('on', k <= i);
          });
          const cue = sec!.querySelector('.rv3-cue') as HTMLElement | null;
          if (cue) cue.style.opacity = i >= 2 ? '0' : '.8';
        }
        function compute() {
          if (!mq.matches) return;
          const total = track!.offsetHeight - sticky!.offsetHeight;
          const s = Math.min(Math.max(-track!.getBoundingClientRect().top, 0), total);
          setIdx(Math.min(2, Math.floor((total > 0 ? s / total : 0) * 3 + 0.0001)));
        }
        // Expose compute() so the <ScrollView onScroll> can drive it (RN-Web).
        computeRef.current = compute;
        function tick() {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(function () {
              compute();
              ticking = false;
            });
          }
        }
        function syncMode() {
          if (mq.matches) {
            cur = -1;
            compute();
          } else {
            cur = -1;
            panels.forEach(function (p) {
              p.classList.remove('open');
              p.setAttribute('aria-expanded', 'false');
            });
            dots.forEach(function (d) {
              d.classList.remove('on');
            });
          }
        }
        // Listen on the real scroll container; also capture window scrolls as a
        // fallback (scroll events don't bubble but DO fire in the capture phase).
        scroller.addEventListener('scroll', tick, { passive: true } as AddEventListenerOptions);
        window.addEventListener('scroll', tick, { passive: true, capture: true });
        window.addEventListener('resize', function () {
          syncMode();
          tick();
        });
        if (mq.addEventListener) mq.addEventListener('change', syncMode);
        else mq.addListener(syncMode);
        panels.forEach(function (p, i) {
          p.addEventListener('click', function () {
            if (!mq.matches) return;
            const total = track!.offsetHeight - sticky!.offsetHeight;
            const isWin = scroller === window;
            const base = isWin ? 0 : (scroller as HTMLElement).getBoundingClientRect().top;
            const cur = isWin ? window.pageYOffset : (scroller as HTMLElement).scrollTop;
            const top = cur + (track!.getBoundingClientRect().top - base) + ((i + 0.5) / 3) * total;
            (scroller as { scrollTo: (o: ScrollToOptions) => void }).scrollTo({ top, behavior: 'smooth' });
          });
        });
        syncMode();
        // Note: the IIFE registers scroll/resize/mq listeners for the page
        // lifetime (as in the original standalone HTML). They are idempotent
        // and harmless if WebLanding unmounts; we leave them in place.
      })();

      // 3. Wire CTA anchors → /(auth)/welcome.
      const wire = (selector: string) => {
        const handler = (e: Event) => {
          e.preventDefault();
          router.push('/(auth)/welcome');
        };
        document.querySelectorAll(selector).forEach((el) => {
          el.addEventListener('click', handler);
          cleanups.push(() => el.removeEventListener('click', handler));
        });
      };
      wire('[data-nav="join"]');
      wire('[data-cta="join"]');
      wire('[data-cta="gigs"]');

      // 4. Discover (.disc): filter tabs (scripts inside dangerouslySetInnerHTML
      //    don't execute, so the tab filtering is wired here).
      (function () {
        const tabs = ([] as Element[]).slice.call(document.querySelectorAll('.disc-tab'));
        if (!tabs.length) return;
        const cards = ([] as Element[]).slice.call(document.querySelectorAll('.disc-card'));
        tabs.forEach(function (t) {
          const h = function () {
            const f = (t as HTMLElement).dataset.f;
            tabs.forEach(function (x) { x.classList.toggle('on', x === t); });
            cards.forEach(function (c) {
              const vis = f === 'all' || (c as HTMLElement).dataset.t === f;
              c.classList.toggle('hide', !vis);
              if (vis) {
                (c as HTMLElement).style.animation = 'none';
                void (c as HTMLElement).offsetWidth;
                (c as HTMLElement).style.animation = 'discpop .35s ease';
              }
            });
          };
          t.addEventListener('click', h);
          cleanups.push(function () { t.removeEventListener('click', h); });
        });
      })();
    });

    return () => {
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
    };
    // router from expo-router is stable; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // RN-Web pins html/body to the viewport with hidden overflow, so the tall
  // landing needs its own scroll container.
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#09090b' }}
      scrollEventThrottle={16}
      onScroll={() => {
        if (computeRef.current) computeRef.current();
      }}
    >
      {React.createElement('div', { dangerouslySetInnerHTML: { __html: PAGE_HTML } })}
    </ScrollView>
  );
}
