.bots {
  --b-green: #00ff88;
  --b-red: #f4525f;
  --b-card: #111;
  --b-field: #141414;
  --b-line: #222;
  --b-dim: #a0a0a0;
  max-width: 1344px; margin: 0 auto; display: flex; flex-direction: column; gap: 38px; color: #fff;
}
.bots button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
.bots input, .bots select { font: inherit; color: inherit; }

.bots__note { margin: 0; padding: 14px 20px; border-radius: 12px; font-size: 17px; border: 1px solid; }
.bots__note.err { color: var(--b-red); background: color-mix(in srgb, var(--b-red) 10%, #000); border-color: color-mix(in srgb, var(--b-red) 40%, #000); }
.bots__note.ok { color: var(--b-green); background: color-mix(in srgb, var(--b-green) 10%, #000); border-color: color-mix(in srgb, var(--b-green) 40%, #000); }

/* ---- cards ---- */
.bots__card { background: var(--b-card); border: 1px solid var(--b-line); border-radius: 22px; overflow: hidden; }
.bots__pad { padding: 36px; overflow: visible; }
.bots__chead { display: flex; align-items: center; justify-content: center; gap: 18px; height: 116px; border-bottom: 1px solid var(--b-line); font-size: 30px; font-weight: 700; letter-spacing: -0.04em; text-transform: uppercase; }
.bots__chead svg { width: 32px; height: 32px; color: var(--b-green); }
.bots__cbody { padding: 36px; }
.bots__h2 { display: flex; align-items: center; gap: 14px; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.03em; }
.bots__h2 svg { width: 28px; height: 28px; color: var(--b-green); }
.bots__sub { margin: 10px 0 30px; color: var(--b-dim); font-size: 21px; }

/* ---- upload ---- */
.bots__drop { display: grid; justify-items: center; align-content: center; gap: 8px; min-height: 311px; padding: 30px; text-align: center; border: 2px dashed #383838; border-radius: 22px; background: transparent; cursor: pointer; transition: border-color .15s, background .15s; }
.bots__drop:hover, .bots__drop:focus-visible, .bots__drop.is-drag { border-color: var(--b-green); background: color-mix(in srgb, var(--b-green) 4%, transparent); outline: 0; }
.bots__drop-ic { display: grid; place-items: center; width: 84px; height: 84px; margin-bottom: 18px; border-radius: 50%; background: #222; color: #d6d6d6; }
.bots__drop-ic svg { width: 40px; height: 40px; }
.bots__drop strong { font-size: 24px; font-weight: 500; word-break: break-all; }
.bots__drop span:not(.bots__drop-ic) { color: var(--b-dim); font-size: 21px; }
.bots__drop small { margin-top: 14px; color: var(--b-dim); font-size: 17px; }
.bots__cta { display: flex; align-items: center; justify-content: center; gap: 16px; width: 100%; height: 72px; margin-top: 25px; border-radius: 8px; background: var(--b-green); color: #04130a; font-size: 21px; font-weight: 600; }
.bots__cta svg { width: 24px; height: 24px; }
.bots__cta:hover { filter: brightness(1.06); }
.bots__cta:disabled { opacity: .6; cursor: not-allowed; }

.bots__or { display: flex; align-items: center; gap: 48px; margin: -4px 0; color: var(--b-dim); font-size: 24px; }
.bots__or::before, .bots__or::after { content: ''; flex: 1; height: 2px; background: #2e2e2e; }

/* ---- passkey ---- */
.bots__pass { text-align: center; }
.bots__pass p { margin: 4px 0 0; color: var(--b-dim); font-size: 24px; }
.bots__pass small { display: block; margin-top: 24px; color: var(--b-dim); font-size: 17px; }
.bots__prow { display: flex; gap: 18px; margin-top: 28px; text-align: left; }
.bots__pin { flex: 1; min-width: 0; display: flex; align-items: center; gap: 16px; height: 72px; padding: 0 20px; border-radius: 10px; border: 1px solid #262626; background: var(--b-field); color: var(--b-dim); }
.bots__pin svg { width: 26px; height: 26px; }
.bots__pin:focus-within { border-color: color-mix(in srgb, var(--b-green) 50%, #262626); }
.bots__pin input { flex: 1; min-width: 0; height: 100%; background: none; border: 0; outline: 0; font-size: 21px; color: #fff; }
.bots__pin input::placeholder { color: var(--b-dim); }
.bots__psubmit { display: inline-flex; align-items: center; justify-content: center; gap: 16px; width: 308px; height: 72px; border-radius: 8px; background: var(--b-green); color: #04130a; font-size: 21px; font-weight: 600; }
.bots__psubmit svg { width: 24px; height: 24px; }
.bots__psubmit:disabled { opacity: .6; cursor: not-allowed; }
.bots__psubmit:not(:disabled):hover { filter: brightness(1.06); }

/* ---- settings ---- */
.bots__fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.bots__field { display: grid; gap: 16px; align-content: start; }
.bots__field > label { color: var(--b-dim); font-size: 21px; }
.bots__ctl { width: 100%; height: 66px; padding: 0 18px; border-radius: 10px; border: 1px solid #262626; background: var(--b-field); outline: 0; font-size: 21px; color: #fff; }
.bots__ctl:focus { border-color: color-mix(in srgb, var(--b-green) 50%, #262626); }
.bots__sel { position: relative; }
.bots__sel select { appearance: none; -webkit-appearance: none; padding-right: 54px; cursor: pointer; }
.bots__sel select option { background: #151515; color: #fff; }
.bots__sel svg, .bots__ctl > svg { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; color: var(--b-dim); pointer-events: none; }
.bots__pick { position: relative; }
.bots__pick .bots__ctl { display: flex; align-items: center; justify-content: space-between; text-align: left; cursor: pointer; }
.bots__pick .bots__ctl > svg { position: static; transform: none; }
.bots__ctl-val { display: inline-flex; align-items: center; gap: 16px; }
.bots__menu { position: absolute; z-index: 30; top: calc(100% + 8px); left: 0; right: 0; max-height: 320px; overflow-y: auto; padding: 8px; border-radius: 12px; border: 1px solid #2a2a2a; background: #151515; box-shadow: 0 14px 34px rgba(0, 0, 0, .6); }
.bots__menu button { display: flex; align-items: center; gap: 16px; width: 100%; height: 52px; padding: 0 12px; border-radius: 8px; font-size: 19px; text-align: left; }
.bots__menu button:hover { background: #1d1d1d; }
.bots__menu button.is-on { color: var(--b-green); }
.bots__flags { display: inline-flex; align-items: center; flex: none; }
.bots__flags img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background: #222; border: 3px solid var(--b-field); }
.bots__flags img + img { margin-left: -12px; }

/* ---- my bots ---- */
.bots__empty { margin: 26px 0 0; padding: 36px; text-align: center; color: var(--b-dim); font-size: 19px; border: 2px dashed #2a2a2a; border-radius: 16px; }
.bots__list { display: grid; gap: 18px; margin-top: 28px; }
.bots__item { display: grid; grid-template-columns: 62px minmax(0, 1fr) auto; column-gap: 18px; row-gap: 22px; align-items: start; padding: 24px; border: 1px solid #262626; border-radius: 16px; background: #121212; }
.bots__ico { display: grid; place-items: center; width: 62px; height: 62px; border-radius: 12px; border: 1px solid #242424; background: #1b1b1b; color: #d0d0d0; }
.bots__ico svg { width: 30px; height: 30px; }
.bots__info { min-width: 0; align-self: center; }
.bots__info h3 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.bots__info h3 small { margin-left: 8px; color: var(--b-dim); font-size: 18px; font-weight: 400; letter-spacing: 0; }
.bots__info p { margin: 6px 0 0; color: var(--b-dim); font-size: 22px; }
.bots__badges { display: flex; gap: 12px; }
.bots__badge { padding: 6px 14px; border-radius: 6px; border: 1px solid; font-size: 19px; white-space: nowrap; }
.bots__badge.blue { color: #60a5fa; background: rgba(59, 130, 246, .14); border-color: rgba(59, 130, 246, .55); }
.bots__badge.amber { color: #eab308; background: rgba(234, 179, 8, .12); border-color: rgba(234, 179, 8, .55); }
.bots__badge.green { color: var(--b-green); background: color-mix(in srgb, var(--b-green) 12%, #000); border-color: color-mix(in srgb, var(--b-green) 55%, #000); }
.bots__badge.red { color: var(--b-red); background: color-mix(in srgb, var(--b-red) 12%, #000); border-color: color-mix(in srgb, var(--b-red) 55%, #000); }
.bots__acts { grid-column: 1 / -1; display: flex; gap: 12px; }
.bots__btn { display: inline-flex; align-items: center; justify-content: center; gap: 12px; height: 48px; padding: 0 24px; border-radius: 8px; border: 1px solid transparent; font-size: 20px; font-weight: 500; }
.bots__btn svg { width: 22px; height: 22px; }
.bots__btn.start { background: var(--b-green); color: #04130a; min-width: 121px; }
.bots__btn.start:hover { filter: brightness(1.06); }
.bots__btn.stop { color: var(--b-red); background: color-mix(in srgb, var(--b-red) 12%, #000); border-color: color-mix(in srgb, var(--b-red) 45%, #000); }
.bots__btn.del { color: #d4d4d4; background: #141414; border-color: #2a2a2a; }
.bots__btn.del:hover { border-color: color-mix(in srgb, var(--b-red) 50%, #2a2a2a); color: var(--b-red); }

/* scale down on smaller screens so it still fits */
@media (max-width: 1100px) {
  .bots { gap: 28px; }
  .bots__chead { height: 88px; font-size: 22px; } .bots__chead svg { width: 24px; height: 24px; }
  .bots__cbody, .bots__pad { padding: 24px; }
  .bots__h2 { font-size: 22px; } .bots__sub { font-size: 17px; }
  .bots__drop { min-height: 240px; } .bots__drop strong { font-size: 19px; } .bots__drop span:not(.bots__drop-ic) { font-size: 16px; }
  .bots__cta, .bots__psubmit, .bots__pin { height: 56px; font-size: 17px; }
  .bots__pass p { font-size: 18px; }
  .bots__field > label { font-size: 16px; } .bots__ctl { height: 54px; font-size: 17px; }
  .bots__info h3 { font-size: 20px; } .bots__info p { font-size: 16px; } .bots__badge { font-size: 14px; }
  .bots__btn { height: 42px; font-size: 16px; }
}
@media (max-width: 800px) {
  .bots__fields { grid-template-columns: 1fr; }
  .bots__prow { flex-direction: column; }
  .bots__psubmit { width: 100%; }
  .bots__item { grid-template-columns: 56px minmax(0, 1fr); }
  .bots__badges { grid-column: 1 / -1; }
}
