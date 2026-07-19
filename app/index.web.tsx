import React, { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import useAuthStore from '@/stores/authStore';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import Footer from '@/components/Footer';

/**
 * Root route `/` — WEB ONLY (`index.web.tsx`).
 *
 * Native keeps its React Native landing in `index.tsx`. On web, Expo Router
 * resolves `index.web.tsx` instead, so we render the marketing HTML design
 * (`DOCS/04-design/mockups/NETSA_figma_clone_v2photos.html`) pixel-perfect.
 *
 * Auth gate is identical to `index.tsx`:
 *   logged OUT → public web landing
 *   logged IN  → /(app)/dashboard
 * Flash-safe: waits for SecureStore rehydration (isHydrated) before deciding.
 */
// Register GSAP plugins once at module scope (guarded for SSR/static render).
if (typeof document !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!isHydrated) return <AppLoadingScreen />;

  if (accessToken) return <Redirect href="/(app)/dashboard" />;

  return <WebLanding />;
}

/**
 * The verbatim CSS + body markup from
 * `DOCS/04-design/mockups/NETSA_figma_clone_v2photos.html`.
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
  html{scroll-behavior:smooth;overflow-x:clip}
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
  .nav .logo{height:30px;width:auto;display:block}
  .nav .nav-cta{font-family:var(--sans);font-weight:500;font-size:15px;color:#fff;background:var(--grad-btn);padding:11px 22px;border-radius:9999px;box-shadow:0 0 40px 6px rgba(255,77,136,.18)}

  /* ---------------- HERO ---------------- */
  .hero{position:relative;min-height:840px;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:180px 24px 90px;isolation:isolate}
  /* fade the warm hero glow into the page bg at the bottom so there's no hard section line */
  .hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:clamp(110px,18vh,230px);background:linear-gradient(to bottom,transparent,var(--bg));z-index:1;pointer-events:none}
  .hero .glow{position:absolute;border-radius:9999px;z-index:0;pointer-events:none}
  .hero .g-rose{width:600px;height:600px;left:-60px;top:-180px;background:var(--rose);opacity:.05;filter:blur(75px)}
  .hero .g-or1{width:500px;height:500px;right:0;top:-120px;background:var(--orange);opacity:.06;filter:blur(65px)}
  .hero .g-or2{width:420px;height:420px;left:48%;top:30%;background:var(--peach);opacity:.04;filter:blur(60px)}
  .hero .blob{position:absolute;z-index:0;left:50%;top:55%;width:1180px;height:840px;transform:translate(-50%,-50%) rotate(-8deg);opacity:.8;pointer-events:none;filter:blur(44px);
    background:
      radial-gradient(closest-side at 52% 50%,rgba(255,26,102,.55),rgba(230,0,0,.28) 45%,transparent 72%),
      radial-gradient(closest-side at 40% 50%,rgba(255,117,26,.45),rgba(255,128,0,0) 70%),
      radial-gradient(closest-side at 33% 50%,rgba(255,130,77,.35),transparent 70%)}
  .hero-in{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:28px;max-width:1024px;text-align:center}
  .hero h1{font-family:var(--serif);letter-spacing:-3.2px;line-height:1.0}
  .hero h1 .l1{display:block;font-weight:400;font-size:clamp(28px,7.4vw,116px);color:var(--ink)}   /* TITLE bigger */
  .hero h1 .l2{display:block;font-weight:700;font-size:clamp(30px,9.6vw,150px);color:#fff}          /* TITLE bigger — fills width on mobile */
  .hero .sub{font-family:var(--sans);font-weight:400;font-size:clamp(12.5px,3.2vw,17px);line-height:1.5;color:rgba(245,245,245,.78);max-width:540px}  /* DESC smaller + subordinate */
  .hero .cta{display:flex;gap:clamp(8px,2.4vw,16px);align-items:center;justify-content:center;padding-top:16px;flex-wrap:nowrap}  /* CTAs side-by-side at every width */
  .btn{font-family:var(--sans);font-weight:500;font-size:clamp(13px,3.4vw,18px);line-height:1.2;border-radius:9999px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;transition:transform .2s,box-shadow .2s}
  .btn-fill{color:#fff;background:var(--grad-btn);padding:clamp(11px,2.7vw,16px) clamp(16px,4.4vw,32px);box-shadow:0 3px 2.75px rgba(0,0,0,.25),0 0 60px 20px rgba(255,77,136,.15)}
  .btn-fill:hover{transform:translateY(-2px)}
  .btn-out{color:var(--ink);background:rgba(0,0,0,.1);border:1px solid rgba(255,255,255,.5);padding:clamp(11px,2.7vw,16px) clamp(16px,4.4vw,33px)}
  .btn-out:hover{background:rgba(255,255,255,.06)}
  .proof{display:flex;align-items:center;gap:clamp(8px,2.2vw,12px);padding-top:8px}
  .avatars{display:flex}
  .avatars .av{width:clamp(34px,9vw,48px);height:clamp(34px,9vw,48px);border-radius:50%;border:2px solid #000;background:var(--grey16);overflow:hidden;margin-right:clamp(-16px,-3.4vw,-11px)}   /* avatars scale with device */
  .avatars .av:last-child{margin-right:0}
  .avatars .av img{width:100%;height:100%;object-fit:cover}
  .proof .lbl{font-family:var(--sans);font-weight:500;font-size:clamp(11.5px,3vw,14px);line-height:1.35;color:#fff}

  /* ---------------- shared section heads ---------------- */
  .section{position:relative;padding:64px 56px 80px}
  .section .glow{position:absolute;border-radius:9999px;z-index:0;pointer-events:none}
  .sec-h2{font-family:var(--serif);font-weight:700;font-size:72px;line-height:72px;color:var(--ink)}
  .sec-sub{font-family:var(--sans);font-weight:400;font-size:18px;line-height:28px;color:var(--grey)}

  /* ---------------- CREATIVE COMMUNITY ---------------- */
  .community .glow{width:800px;height:800px;background:var(--rose);opacity:.06;filter:blur(80px);right:-120px;top:-80px}
  .community .wrap{display:flex;gap:48px;align-items:flex-start;justify-content:space-between}
  .community .head{flex:0 1 440px;max-width:440px;position:sticky;top:90px;margin-bottom:0}
  .community .sec-sub{max-width:380px;margin-top:18px}
  /* ===== Creative Community — overlapping tilted zig-zag cascade ===== */
  .cc-stack{--cw:240px;--ch:320px;--ox:80px;--oy:110px;position:relative;flex:0 0 auto;width:calc(2*var(--cw) - var(--ox));height:calc(4*var(--ch) - 3*var(--oy));margin:0 auto}
  .cc-card{position:absolute;width:var(--cw);height:var(--ch);border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.1);box-shadow:0 34px 70px -24px rgba(0,0,0,.85);background:var(--grey16);transition:transform .35s cubic-bezier(.22,.61,.36,1),box-shadow .35s}
  .cc-card>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(.1) brightness(.82)}
  .cc-card .ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(9,9,11,.9) 0%,rgba(9,9,11,.3) 42%,rgba(9,9,11,0) 72%)}
  .cc-card .ring{position:absolute;inset:0;border-radius:18px;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--acc) 35%,transparent);pointer-events:none}
  .cc-card .meta{position:absolute;left:0;right:0;top:0;padding:18px 20px;z-index:2}
  .cc-card .rl{font-family:var(--sans);font-weight:700;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--acc,var(--rose));display:inline-flex;align-items:center;gap:7px;margin-bottom:8px}
  .cc-card .rl::before{content:"";width:7px;height:7px;border-radius:99px;background:var(--acc,var(--rose));box-shadow:0 0 10px 1px var(--acc,var(--rose))}
  .cc-card .nm{font-family:var(--serif);font-weight:600;font-size:24px;line-height:1.05;color:var(--ink)}
  .cc-card .pl{font-family:var(--sans);font-size:12.5px;color:rgba(245,245,245,.7);margin-top:5px}
  .cc-card.acc-rose{--acc:#ff4d88}.cc-card.acc-violet{--acc:#8b5cf6}.cc-card.acc-gold{--acc:#f59e0b}.cc-card.acc-teal{--acc:#14b8a6}
  .cc-card:nth-child(1){top:0;left:0;z-index:1;transform:rotate(4deg)}
  .cc-card:nth-child(2){top:calc(1*(var(--ch) - var(--oy)));left:calc(var(--cw) - var(--ox));z-index:2;transform:rotate(-4deg)}
  .cc-card:nth-child(3){top:calc(2*(var(--ch) - var(--oy)));left:0;z-index:3;transform:rotate(4deg)}
  .cc-card:nth-child(4){top:calc(3*(var(--ch) - var(--oy)));left:calc(var(--cw) - var(--ox));z-index:4;transform:rotate(-4deg)}
  .cc-card:hover{transform:rotate(0deg) translateY(-6px) scale(1.03);z-index:20;box-shadow:0 44px 90px -24px rgba(0,0,0,.9)}
  @media(max-width:900px){.community .wrap{flex-direction:column;gap:34px;justify-content:flex-start}.community .head{position:static;max-width:none;flex:none}}
  @media(max-width:480px){.cc-stack{--cw:165px;--ch:225px;--ox:52px;--oy:78px}.cc-card .nm{font-size:18px}.cc-card .meta{padding:14px}}

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
  .quote .stair{font-family:var(--serif);font-weight:700;color:#000;font-size:120px;line-height:1.0;text-align:center;max-width:1200px}
  .quote .stair .s1,.quote .stair .s2,.quote .stair .s3{margin-left:0}
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

  /* ---------------- MATCH (find talent / clients / work) ---------------- */
  .match{position:relative;padding:96px 56px 80px}
  .match .glow{position:absolute;z-index:0;border-radius:9999px;pointer-events:none;width:720px;height:520px;background:var(--orange);opacity:.05;filter:blur(80px);left:50%;top:-40px;transform:translateX(-50%)}
  .match .head{text-align:center;max-width:780px;margin:0 auto 16px}
  .match .sec-sub{max-width:600px;margin:0 auto 48px}
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
  /* ===== ROLE SPOTLIGHT — horizontal pinned spotlight (GSAP ScrollTrigger) ===== */
  .roles{position:relative;height:calc(100vh + 2200px)}
  .roles-inner{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;flex-direction:column;background:radial-gradient(120% 80% at 50% -10%,rgba(255,130,46,.08),transparent 60%)}
  .roles .head{position:relative;z-index:3;text-align:center;padding:72px 24px 0;flex:0 0 auto;max-width:820px;margin:0 auto}
  .roles .eye{display:block;font-family:var(--sans);font-weight:700;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--orange);margin-bottom:14px}
  .roles .sec-h2{font-size:clamp(32px,5.2vw,68px);line-height:1.04}
  .roles .sec-sub{color:var(--grey);max-width:600px;margin:14px auto 0;font-size:16px;line-height:1.5}
  .rview{position:relative;z-index:2;flex:1;min-height:0;display:flex;align-items:center;overflow:hidden}
  .rtrack{display:flex;gap:4vw;will-change:transform}
  .rcard{position:relative;flex:0 0 auto;width:min(54vw,640px);height:min(52vh,560px);border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,.09);background:var(--grey16);transform:scale(.82);opacity:.44;transition:transform .55s cubic-bezier(.22,.61,.36,1),opacity .55s,box-shadow .55s}
  .rcard.on{transform:scale(1);opacity:1;box-shadow:0 40px 120px rgba(0,0,0,.55)}
  .rcard .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.55) brightness(.5);transition:filter .55s}
  .rcard.on .bg{filter:saturate(1) brightness(.72)}
  .rcard .tint{position:absolute;inset:0;mix-blend-mode:soft-light;opacity:.5;pointer-events:none}
  .rcard.rc1 .tint{background:linear-gradient(135deg,#f7c45a,#ff822e)}
  .rcard.rc2 .tint{background:linear-gradient(135deg,#ff4d88,#ff822e)}
  .rcard.rc3 .tint{background:linear-gradient(135deg,#ff4d88,#6d23b6)}
  .rcard .veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,9,11,.12) 0%,rgba(9,9,11,.45) 46%,rgba(9,9,11,.88) 100%);pointer-events:none}
  .rcard .ct{position:absolute;inset:0;padding:clamp(22px,3vw,42px);display:flex;flex-direction:column;justify-content:flex-end;gap:6px;z-index:2}
  .rcard .role{font-family:var(--sans);font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,233,217,.9)}
  .rcard .lab{font-family:var(--serif);font-weight:700;font-size:clamp(28px,3.8vw,50px);line-height:1.02;color:#fff}
  .rcard .desc{font-family:var(--sans);font-size:14.5px;line-height:1.5;color:rgba(245,240,235,.86);max-width:26em;margin-top:8px}
  .rcard .go{margin-top:16px;font-family:var(--sans);font-weight:500;font-size:14px;color:#fff;display:inline-flex;align-items:center;gap:7px;cursor:pointer;align-self:flex-start}
  .rcard .go b{color:#ffd9c2;font-weight:600;transition:transform .3s;display:inline-block}
  .rcard.on .go b{transform:translateX(4px)}
  .rhud{position:absolute;left:0;right:0;bottom:24px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:13px;pointer-events:none}
  .rrail{display:flex;gap:10px}
  .rseg{width:48px;height:4px;border-radius:2px;background:rgba(255,255,255,.14);overflow:hidden}
  .rseg i{display:block;height:100%;width:0;background:var(--grad-btn);transition:width .35s}
  @media(max-width:760px){
    /* preserved from the prior role-section block: tighten hero on mobile */
    .hero{min-height:85vh;padding-top:132px;padding-bottom:44px}
    .roles .head{padding:46px 20px 0}
    .roles .sec-sub{font-size:14px}
    .rcard{width:80vw;height:46vh}
    .rcard .lab{font-size:clamp(26px,7vw,40px)}
  }
  @media(max-width:760px) and (max-height:720px){
    .roles .sec-h2{font-size:27px}
    .roles .head{padding-top:34px}
    .rcard{height:48vh}
  }
  @media (prefers-reduced-motion: reduce){
    .roles{height:auto;overflow:visible;padding-bottom:56px}
    .roles-inner{position:static;height:auto;overflow:visible;display:block}
    .rview{display:block;min-height:0}
    .rtrack{flex-direction:column;transform:none!important;gap:20px;padding:16px 24px 0;align-items:center;will-change:auto}
    .rcard{width:min(92vw,640px);height:54vh;min-height:320px;transform:none;opacity:1;box-shadow:0 30px 90px rgba(0,0,0,.5)}
    .rcard .bg{filter:saturate(1) brightness(.7)}
    .rhud{display:none}
  }

  /* ---------------- EVENTS (never stop growing — scrollable) ---------------- */
  .events{position:relative;padding:80px 0}
  .events .glow{position:absolute;z-index:0;border-radius:9999px;pointer-events:none;width:720px;height:600px;background:var(--rose);opacity:.05;filter:blur(80px);left:-120px;top:0}
  .events .head{max-width:1192px;margin:0 auto 40px;padding:0 56px;position:relative;z-index:2}
  .events .sec-sub{max-width:540px;margin-top:16px}
  .escroll-wrap{position:relative;z-index:2}
  .escroll{display:flex;align-items:flex-start;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;padding:6px 56px 18px;scrollbar-width:thin;scrollbar-color:rgba(255,77,136,.4) transparent}
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
    /* hero h1 scales via clamp() — no fixed override needed */
    .sec-h2{font-size:48px;line-height:1.05}
    .quote .stair{font-size:64px}
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
    .hero h1{letter-spacing:-1.5px}
    .cards{flex-direction:column;align-items:stretch;gap:20px}
    .pcard{flex:0 0 auto;width:78%;aspect-ratio:270/350;margin-top:0!important}
    .pcard:nth-child(odd){margin-right:auto;transform:rotate(-2.5deg)}
    .pcard:nth-child(even){margin-left:auto;transform:rotate(2.5deg)}
    .quote .stair{font-size:40px}
  }
  /* ---------------- WAITLIST MODAL ---------------- */
  .wl-overlay{position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;padding:24px}
  .wl-overlay.open{display:flex}
  .wl-scrim{position:absolute;inset:0;background:rgba(6,6,8,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  .wl-card{position:relative;z-index:2;width:min(560px,100%);max-height:92vh;overflow-y:auto;background:#141317;border:1px solid rgba(255,255,255,.09);border-radius:24px;padding:34px 34px 26px;box-shadow:0 40px 120px rgba(0,0,0,.6);opacity:0;transform:translateY(14px) scale(.98);transition:opacity .28s ease,transform .28s cubic-bezier(.22,.61,.36,1)}
  .wl-overlay.open .wl-card{opacity:1;transform:none}
  .wl-card::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(115deg,var(--orange),var(--rose))}
  .wl-glow{position:absolute;left:50%;top:-120px;width:520px;height:240px;transform:translateX(-50%);background:radial-gradient(closest-side,rgba(255,130,46,.32),transparent 70%);filter:blur(30px);pointer-events:none}
  .wl-x{position:absolute;top:18px;right:20px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:var(--grey);font-size:19px;line-height:1;cursor:pointer;z-index:3}
  .wl-x:hover{color:var(--ink);background:rgba(255,255,255,.07)}
  .wl-eye{position:relative;z-index:2;font-family:var(--sans);font-weight:700;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--orange);display:flex;align-items:center;gap:8px}
  .wl-dot{width:5px;height:5px;border-radius:50%;background:var(--orange);box-shadow:0 0 10px 1px var(--orange)}
  .wl-h{position:relative;z-index:2;font-family:var(--serif);font-weight:600;font-size:32px;line-height:1.05;margin:12px 0 8px;color:var(--ink)}
  .wl-sub{position:relative;z-index:2;color:var(--grey);font-size:14px;line-height:1.5;max-width:82%}
  .wl-label{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b6660;font-weight:500;margin:24px 0 11px}
  .wl-roles{display:grid;grid-template-columns:repeat(3,1fr);gap:11px}
  .wl-role{position:relative;text-align:left;background:#1b1a20;border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:14px 13px;cursor:pointer;transition:border-color .2s,background .2s}
  .wl-role:hover{border-color:rgba(255,255,255,.2)}
  .wl-role.wl-on{border-color:rgba(255,130,46,.75);background:linear-gradient(180deg,rgba(255,130,46,.12),rgba(255,77,136,.05))}
  .wl-rn{display:block;font-family:var(--sans);font-weight:600;font-size:14.5px;color:var(--ink)}
  .wl-rd{display:block;font-size:11.5px;line-height:1.35;color:var(--grey);margin-top:4px}
  .wl-tick{position:absolute;top:11px;right:11px;width:17px;height:17px;border-radius:50%;background:linear-gradient(115deg,var(--orange),var(--rose));color:#1a0d06;display:none;align-items:center;justify-content:center;font-size:10px}
  .wl-role.wl-on .wl-tick{display:flex}
  .wl-field{display:flex;align-items:center;background:#1b1a20;border:1px solid rgba(255,255,255,.1);border-radius:13px;height:52px;overflow:hidden;transition:border-color .2s}
  .wl-field:focus-within{border-color:rgba(255,130,46,.55)}
  .wl-cc{display:flex;align-items:center;padding:0 14px;height:100%;border-right:1px solid rgba(255,255,255,.1);color:#d7d2cc;font-size:15px;font-weight:500;white-space:nowrap}
  .wl-field input{flex:1;min-width:0;border:0;background:none;outline:none;color:#fff;font-size:15.5px;font-family:var(--sans);padding:0 15px}
  .wl-field input::placeholder{color:#55524d}
  .wl-cta{margin-top:15px;height:52px;width:100%;border:0;border-radius:13px;background:linear-gradient(115deg,var(--orange),var(--rose));color:#1a0d06;font-family:var(--sans);font-weight:700;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:filter .2s,transform .1s}
  .wl-cta:hover{filter:brightness(1.06)}.wl-cta:active{transform:scale(.99)}
  .wl-foot{margin-top:13px;text-align:center;font-size:12px;color:#6b6660}
  .wl-done{display:none;text-align:center;padding:10px 4px 6px}
  .wl-overlay.wl-confirmed .wl-form{display:none}
  .wl-overlay.wl-confirmed .wl-done{display:block}
  .wl-badge{width:70px;height:70px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;background:radial-gradient(closest-side,rgba(255,130,46,.28),rgba(255,77,136,.08));border:1px solid rgba(255,130,46,.4);color:var(--peach)}
  .wl-done .wl-h{text-align:center}.wl-done b{color:#e9c6b6;font-weight:600}
  .wl-again{margin-top:20px;background:none;border:0;color:var(--grey);font-size:13px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
  .wl-again:hover{color:var(--ink)}
  @media(prefers-reduced-motion:reduce){.wl-card{transition:none}}
  @media(max-width:520px){.wl-roles{grid-template-columns:1fr}.wl-card{padding:28px 22px 22px}.wl-h{font-size:27px}}
</style>

<!-- NAV -->
<nav class="nav">
  <img class="logo" src="/landing/netsa-logo-wordmark.png" alt="NETSA">

  <a class="nav-cta" href="#" data-nav="join">Join the waitlist</a>
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
      <a class="btn btn-fill" href="#" data-cta="join">Join the waitlist</a>
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

<!-- ROLE SPOTLIGHT: find talent / clients / work -->
<section class="roles rv3sec">
  <div class="roles-inner">
  <div class="grid-bg"></div>
  <div class="head">
    <span class="eye">Three sides, one stage</span>
    <h2 class="sec-h2">Find talent. Find clients. <span class="gtext">Find work.</span></h2>
    <p class="sec-sub">Whichever side of the stage you're on, NETSA connects you to the other — all in one place.</p>
  </div>
  <div class="rview">
    <div class="rtrack">
      <article class="rcard rc1 on" data-lab="Find your talent">
        <img class="bg" src="/landing/v2-client.jpg" alt="">
        <span class="tint"></span><span class="veil"></span>
        <div class="ct">
          <span class="role">For Clients</span>
          <span class="lab">Find your talent</span>
          <p class="desc">Post your event and get matched with vetted creative leads and performers.</p>
          <span class="go" data-cta="join">Hire the stage <b>&rarr;</b></span>
        </div>
      </article>
      <article class="rcard rc2" data-lab="Find clients &amp; crew">
        <img class="bg" src="/landing/imgSagarBora.jpg" alt="">
        <span class="tint"></span><span class="veil"></span>
        <div class="ct">
          <span class="role">For Creative Leads</span>
          <span class="lab">Find clients &amp; crew</span>
          <p class="desc">Win work, then build and book your own team — both sides, one profile.</p>
          <span class="go" data-cta="join">Lead the show <b>&rarr;</b></span>
        </div>
      </article>
      <article class="rcard rc3" data-lab="Find your next gig">
        <img class="bg" src="/landing/imgSagarBora2.jpg" alt="">
        <span class="tint"></span><span class="veil"></span>
        <div class="ct">
          <span class="role">For Artists</span>
          <span class="lab">Find your next gig</span>
          <p class="desc">Get discovered, apply to gigs that fit, and build your name.</p>
          <span class="go" data-cta="join">Take the stage <b>&rarr;</b></span>
        </div>
      </article>
    </div>
  </div>
  <div class="rhud">
    <div class="rrail"><span class="rseg"><i></i></span><span class="rseg"><i></i></span><span class="rseg"><i></i></span></div>
  </div>
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
    <div class="cc-stack">
      <div class="cc-card acc-rose">
        <img src="/landing/v2-dancer.jpg" alt="Dancer"><div class="ov"></div><div class="ring"></div>
        <div class="meta"><div class="rl">Dancer</div><div class="nm">Kathak &amp; contemporary</div><div class="pl">Pune</div></div>
      </div>
      <div class="cc-card acc-violet">
        <img src="/landing/v2-musician.jpg" alt="Vocalist"><div class="ov"></div><div class="ring"></div>
        <div class="meta"><div class="rl">Vocalist</div><div class="nm">Hindustani vocal</div><div class="pl">Mumbai</div></div>
      </div>
      <div class="cc-card acc-gold">
        <img src="/landing/v2-vocalist.jpg" alt="Musician"><div class="ov"></div><div class="ring"></div>
        <div class="meta"><div class="rl">Musician</div><div class="nm">Sitar &amp; tabla</div><div class="pl">Delhi</div></div>
      </div>
      <div class="cc-card acc-teal">
        <img src="/landing/v2-actor.jpg" alt="Actor"><div class="ov"></div><div class="ring"></div>
        <div class="meta"><div class="rl">Actor</div><div class="nm">Stage &amp; screen</div><div class="pl">Bengaluru</div></div>
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
    <a class="btn btn-fill" href="#" data-cta="join">Join the waitlist</a>
    <a class="btn btn-out" href="#" data-cta="gigs">Explore Gigs</a>
  </div>
</section>

<!-- WAITLIST MODAL -->
<div class="wl-overlay" id="wl">
  <div class="wl-scrim" data-wl-close></div>
  <div class="wl-card" role="dialog" aria-modal="true" aria-label="Join the waitlist">
    <div class="wl-glow"></div>
    <button class="wl-x" data-wl-close aria-label="Close">&times;</button>
    <div class="wl-form" id="wl-form">
      <div class="wl-eye"><span class="wl-dot"></span>Pre-launch · Pune</div>
      <h3 class="wl-h">Join the waitlist</h3>
      <p class="wl-sub">Pick your side of the stage and leave your number — we'll text you the moment doors open.</p>
      <div class="wl-label">You're joining as</div>
      <div class="wl-roles" id="wl-roles">
        <button class="wl-role wl-on" data-role="Artist"><span class="wl-tick">&#10003;</span><span class="wl-rn">Artist</span><span class="wl-rd">You perform. You want work.</span></button>
        <button class="wl-role" data-role="Creative Lead"><span class="wl-tick">&#10003;</span><span class="wl-rn">Creative Lead</span><span class="wl-rd">You hire artists &amp; take clients.</span></button>
        <button class="wl-role" data-role="Client"><span class="wl-tick">&#10003;</span><span class="wl-rn">Client</span><span class="wl-rd">You book talent for events.</span></button>
      </div>
      <div class="wl-label">Mobile number</div>
      <div class="wl-field"><span class="wl-cc">+91 &#9662;</span><input id="wl-phone" inputmode="numeric" maxlength="11" placeholder="98765 43210" /></div>
      <button class="wl-cta" id="wl-join">Join the waitlist <span>&rarr;</span></button>
      <div class="wl-foot">One text when we open. No spam, ever.</div>
    </div>
    <div class="wl-done" id="wl-done">
      <div class="wl-badge"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></div>
      <div class="wl-eye" style="justify-content:center">You're in</div>
      <h3 class="wl-h">See you in the wings.</h3>
      <p class="wl-sub" style="text-align:center;margin-left:auto;margin-right:auto;max-width:90%">We'll text <b id="wl-dphone"></b> the moment NETSA opens in Pune — as <span id="wl-drole"></span>.</p>
      <button class="wl-again" id="wl-again">&larr; edit my details</button>
    </div>
  </div>
</div>
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

    // Wire the injected markup — with retries + an idempotency guard so it survives
    // StrictMode's double-invoke and auth-driven re-renders (a lone rAF can be
    // cancelled before it ever fires, leaving the accordion + tabs unwired).
    let wired = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const setupInjected = () => {
      if (wired || !document.querySelector('.rv3sec')) return;
      wired = true;
      // 2. GSAP scroll motion — role spotlight (horizontal pinned) + manifesto
      //    word-brighten. RN-Web scrolls an inner <div>, not window, so ScrollTrigger
      //    is given that element as its `scroller`; ScrollTrigger then listens to that
      //    div's native scroll and drives the pin/scrub on its own rAF ticker.
      (function () {
        const rolesSec = document.querySelector('.roles') as HTMLElement | null;
        // nearest overflow:auto/scroll ancestor = the RN-Web ScrollView scroll container
        function getScrollContainer(el: HTMLElement): HTMLElement | Window {
          let n: HTMLElement | null = el.parentElement;
          while (n) {
            const oy = window.getComputedStyle(n).overflowY;
            if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) return n;
            n = n.parentElement;
          }
          return window;
        }
        const scrollerEl: HTMLElement | Window = rolesSec ? getScrollContainer(rolesSec) : window;
        const scroller: HTMLElement | undefined = scrollerEl === window ? undefined : (scrollerEl as HTMLElement);

        // Do NOT manually pump ScrollTrigger.update() from onScroll. With `scroller`
        // set, ScrollTrigger listens to the div's native scroll and eases the pin/scrub
        // on its own rAF ticker. A throttled manual update() applied the pin at the raw
        // (non-eased) scroll position every 16ms, fighting the scrub → visible flicker.
        // Leave computeRef null so <ScrollView onScroll> is a no-op.
        computeRef.current = null;

        const mm = gsap.matchMedia();

        mm.add('(prefers-reduced-motion: no-preference)', function () {
          const triggers: ScrollTrigger[] = [];
          const splits: SplitText[] = [];

          // ROLE SPOTLIGHT — pin the section; slide the track so each card centers,
          // lighting + scaling the active one; advance the rail + index counter.
          if (rolesSec) {
            const track = rolesSec.querySelector('.rtrack') as HTMLElement | null;
            const cards = Array.prototype.slice.call(rolesSec.querySelectorAll('.rcard')) as HTMLElement[];
            const segs = Array.prototype.slice.call(rolesSec.querySelectorAll('.rseg > i')) as HTMLElement[];
            if (track && cards.length > 1) {
              const N = cards.length;
              const metrics = function () {
                // clientWidth can momentarily read 0 during first layout / resize —
                // fall back so centering never captures a degenerate viewport width.
                const W = (scroller ? scroller.clientWidth : 0) || window.innerWidth || document.documentElement.clientWidth;
                const cw = cards[0].offsetWidth;
                return { x0: W / 2 - cw / 2, stride: cw + W * 0.04 };
              };
              const setA = function (i: number) {
                cards.forEach(function (c, k) { c.classList.toggle('on', k === i); });
                segs.forEach(function (s, k) { s.style.width = k <= i ? '100%' : '0'; });
              };
              setA(0);
              // Function-based endpoints + invalidateOnRefresh: both x values are
              // re-evaluated on every ScrollTrigger.refresh(), so the centering stays
              // correct across resize / late layout instead of freezing a stale width.
              const tw = gsap.fromTo(track,
                { x: function () { return metrics().x0; } },
                {
                  x: function () { const m = metrics(); return m.x0 - (N - 1) * m.stride; },
                  ease: 'none',
                  scrollTrigger: {
                    trigger: rolesSec,
                    scroller: scroller,
                    // No GSAP pin: the .roles-inner is held by native CSS position:sticky
                    // (rock-stable, zero per-frame JS). GSAP only scrubs the track's x, so
                    // ONLY the cards move — the section itself never shifts (no flicker).
                    start: 'top top',
                    end: '+=2200',
                    scrub: 1,
                    invalidateOnRefresh: true,
                    snap: { snapTo: cards.map(function (_c: HTMLElement, k: number) { return k / (N - 1); }), duration: { min: 0.2, max: 0.5 }, ease: 'power1.inOut' },
                    onUpdate: function (self: ScrollTrigger) { setA(Math.round(self.progress * (N - 1))); },
                  },
                });
              if (tw.scrollTrigger) triggers.push(tw.scrollTrigger);
            }
          }

          // MANIFESTO — split the stair into words, dim, then brighten across scroll.
          const stair = document.querySelector('.quote .stair') as HTMLElement | null;
          if (stair) {
            const sp = new SplitText(stair, { type: 'words' });
            splits.push(sp);
            gsap.set(sp.words, { opacity: 0.12 });
            const tw = gsap.to(sp.words, {
              opacity: 1,
              ease: 'none',
              stagger: 0.4,
              scrollTrigger: {
                trigger: document.querySelector('.quote') as HTMLElement,
                scroller: scroller,
                start: 'top 75%',
                end: 'center 55%',
                scrub: true,
              },
            });
            if (tw.scrollTrigger) triggers.push(tw.scrollTrigger);
          }

          ScrollTrigger.refresh();

          return function () {
            triggers.forEach(function (t) { t.kill(); });
            splits.forEach(function (s) { s.revert(); });
          };
        });

        // Reduced motion: CSS renders the cards as a static stack; just ensure the
        // manifesto stair stays fully lit (never split, never dimmed).
        mm.add('(prefers-reduced-motion: reduce)', function () {
          const stair = document.querySelector('.quote .stair') as HTMLElement | null;
          if (stair) gsap.set(stair, { opacity: 1 });
          return function () {};
        });

        // Fonts/images settle after first paint and shift measurements — refresh then.
        const onLoad = function () { ScrollTrigger.refresh(); };
        window.addEventListener('load', onLoad);
        const refreshTimers = [
          setTimeout(function () { ScrollTrigger.refresh(); }, 400),
          setTimeout(function () { ScrollTrigger.refresh(); }, 1200),
        ];

        cleanups.push(function () {
          window.removeEventListener('load', onLoad);
          refreshTimers.forEach(function (t) { clearTimeout(t); });
          mm.revert();
          computeRef.current = null;
        });
      })();

      // 3. Waitlist modal + CTA wiring. "join" CTAs open the waitlist modal;
      //    "gigs" still routes to /(auth)/welcome.
      let openWaitlist = (_role?: string | null) => {};
      const wlOverlay = document.getElementById('wl');
      if (wlOverlay) {
        const wlRoles = document.getElementById('wl-roles');
        const wlPhone = document.getElementById('wl-phone') as HTMLInputElement | null;
        const wlJoin = document.getElementById('wl-join');
        const wlAgain = document.getElementById('wl-again');
        const wlDphone = document.getElementById('wl-dphone');
        const wlDrole = document.getElementById('wl-drole');
        const ART: Record<string, string> = { Artist: 'an Artist', 'Creative Lead': 'a Creative Lead', Client: 'a Client' };
        let picked = 'Artist';
        const setRole = (r: string) => {
          picked = r;
          if (wlRoles) wlRoles.querySelectorAll('.wl-role').forEach((b) => (b as HTMLElement).classList.toggle('wl-on', (b as HTMLElement).dataset.role === r));
        };
        const closeWL = () => { wlOverlay.classList.remove('open'); document.removeEventListener('keydown', onKey); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeWL(); };
        openWaitlist = (role?: string | null) => {
          if (role) setRole(role);
          wlOverlay.classList.remove('wl-confirmed');
          wlOverlay.classList.add('open');
          document.addEventListener('keydown', onKey);
        };
        if (wlRoles) wlRoles.addEventListener('click', (e) => {
          const b = (e.target as HTMLElement).closest('.wl-role') as HTMLElement | null;
          if (b && b.dataset.role) setRole(b.dataset.role);
        });
        if (wlPhone) wlPhone.addEventListener('input', () => { wlPhone.value = wlPhone.value.replace(/[^0-9 ]/g, ''); });
        if (wlJoin && wlPhone) wlJoin.addEventListener('click', () => {
          const digits = wlPhone.value.replace(/\D/g, '');
          if (digits.length < 10) { wlPhone.focus(); return; }
          if (wlDphone) wlDphone.textContent = '+91 ' + wlPhone.value;
          if (wlDrole) wlDrole.textContent = ART[picked] || ('a ' + picked);
          // TODO: POST /waitlist { phone: '+91' + digits, role: picked } once the backend endpoint exists.
          wlOverlay.classList.add('wl-confirmed');
        });
        if (wlAgain) wlAgain.addEventListener('click', () => wlOverlay.classList.remove('wl-confirmed'));
        wlOverlay.querySelectorAll('[data-wl-close]').forEach((el) => el.addEventListener('click', closeWL));
        cleanups.push(() => document.removeEventListener('keydown', onKey));
      }
      const wireTo = (selector: string, handler: (e: Event) => void) => {
        document.querySelectorAll(selector).forEach((el) => {
          el.addEventListener('click', handler);
          cleanups.push(() => el.removeEventListener('click', handler));
        });
      };
      wireTo('[data-nav="join"]', (e) => { e.preventDefault(); openWaitlist(); });
      wireTo('[data-cta="join"]', (e) => {
        e.preventDefault();
        const card = (e.target as HTMLElement).closest('.rcard');
        openWaitlist(card ? (card.classList.contains('rc1') ? 'Client' : card.classList.contains('rc2') ? 'Creative Lead' : 'Artist') : null);
      });
      wireTo('[data-cta="gigs"]', (e) => { e.preventDefault(); router.push('/(auth)/welcome'); });

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
    };
    const raf = requestAnimationFrame(setupInjected);
    timers.push(setTimeout(setupInjected, 60), setTimeout(setupInjected, 240), setTimeout(setupInjected, 600));

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(function (t) { clearTimeout(t); });
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
      <Footer />
    </ScrollView>
  );
}
