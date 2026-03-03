import { useCallback, useMemo, useState } from "react";

const COLORS = ["Blue", "Red", "Green", "White"];
const COLOR_STYLES = {
  Blue: { bg: "bg-blue-600", ring: "ring-blue-400", label: "B", prob: 0.4 },
  Red: { bg: "bg-red-500", ring: "ring-red-400", label: "R", prob: 0.4 },
  Green: { bg: "bg-green-600", ring: "ring-green-400", label: "G", prob: 0.4 },
  White: { bg: "bg-gray-200", ring: "ring-gray-300", label: "W", prob: 0.1 },
};
const ROLL_PROBS = { Blue: 0.3, Red: 0.3, Green: 0.3, White: 0.1 };

function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

function rollSlot() {
  const r = Math.random();
  if (r < 0.3) return "Blue";
  if (r < 0.6) return "Red";
  if (r < 0.9) return "Green";
  return "White";
}

function computeStats(slots) {
  if (!slots || slots.some((s) => !s)) return null;
  const counts = {};
  for (const c of slots) counts[c] = (counts[c] || 0) + 1;
  const denom = Object.values(counts).reduce((acc, c) => acc * factorial(c), 1);
  const X = factorial(4) / denom;
  let slotProb = 1;
  for (const c of slots) slotProb *= COLOR_STYLES[c].prob;
  const anyOrderProb = X * slotProb;
  const exactOrderProb = slotProb;
  const p99Any = Math.ceil(Math.log(0.01) / Math.log(1 - anyOrderProb));
  const p99Exact = Math.ceil(Math.log(0.01) / Math.log(1 - exactOrderProb));
  const p99Order = Math.ceil(Math.log(0.01) / Math.log(1 - 1 / X));
  return {
    X,
    slots: [...slots],
    counts,
    slotProb,
    anyOrderProb,
    exactOrderProb,
    avgAny: 1 / anyOrderProb,
    avgExact: 1 / exactOrderProb,
    p99Any,
    p99Exact,
    p99Order,
  };
}

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(1);
}

function StatBox({ label, value, sub, color = "text-white" }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 flex flex-col items-center text-center">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className={`font-bold text-lg leading-tight ${color}`}>{value}</div>
      {sub && <div className="text-gray-500 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

function SlotDisplay({ slots, small = false }) {
  return (
    <div className={`flex gap-${small ? 1 : 2} justify-center`}>
      {(slots || [null, null, null, null]).map((c, i) => (
        <div
          key={i}
          className={`${small ? "w-7 h-7 rounded-lg text-xs" : "w-10 h-10 rounded-xl text-sm"} flex items-center justify-center font-bold
          ${c ? COLOR_STYLES[c].bg : "bg-gray-800 border border-gray-700"}
          ${c === "White" ? "text-gray-800" : "text-white"}`}
        >
          {c ? COLOR_STYLES[c].label : "?"}
        </div>
      ))}
    </div>
  );
}

// ─── CALCULATOR TAB ───────────────────────────────────────────────────────────
function CalculatorTab() {
  const [slots, setSlots] = useState([null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState(null);

  const setSlotColor = (i, color) => {
    setSlots((s) => {
      const n = [...s];
      n[i] = color;
      return n;
    });
    setActiveSlot(null);
  };
  const clearSlot = (i) => {
    setSlots((s) => {
      const n = [...s];
      n[i] = null;
      return n;
    });
    setActiveSlot(null);
  };
  const reset = () => {
    setSlots([null, null, null, null]);
    setActiveSlot(null);
  };

  const result = useMemo(() => computeStats(slots), [slots]);
  const filled = slots.filter(Boolean).length;
  const comboLabel = result
    ? Object.entries(result.counts)
        .map(([c, n]) => `${n}${c[0]}`)
        .join(" ")
    : null;

  return (
    <div className="flex flex-col items-center">
      <p className="text-gray-400 text-sm mb-6">
        Click a slot, then pick its color. White = wildcard (p=0.1).
      </p>

      <div className="flex gap-3 mb-3">
        {slots.map((color, i) => (
          <button
            key={i}
            onClick={() => setActiveSlot(activeSlot === i ? null : i)}
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-150
              ${color ? `${COLOR_STYLES[color].bg} border-transparent` : "bg-gray-900 border-gray-700 text-gray-600"}
              ${activeSlot === i ? `ring-2 ${color ? COLOR_STYLES[color].ring : "ring-white"} scale-110` : "hover:scale-105"}`}
          >
            <span className="text-xs text-white/60 font-normal mb-0.5">
              Slot {i + 1}
            </span>
            <span
              className={`text-lg font-bold ${color === "White" ? "text-gray-800" : "text-white"}`}
            >
              {color ? COLOR_STYLES[color].label : "?"}
            </span>
          </button>
        ))}
      </div>
      <div className="flex gap-3 mb-5">
        {slots.map((color, i) => (
          <div
            key={i}
            className="w-16 text-center text-xs text-gray-500 truncate"
          >
            {color || "empty"}
          </div>
        ))}
      </div>

      <div
        className={`transition-all duration-200 mb-5 ${activeSlot !== null ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <p className="text-center text-xs text-gray-400 mb-2">
          {activeSlot !== null ? `Choose color for Slot ${activeSlot + 1}` : ""}
        </p>
        <div className="flex gap-2 justify-center">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() =>
                activeSlot !== null && setSlotColor(activeSlot, color)
              }
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition hover:scale-105
                ${slots[activeSlot] === color ? "border-white" : "border-gray-700"} bg-gray-900`}
            >
              <div
                className={`w-7 h-7 rounded-full ${COLOR_STYLES[color].bg} border border-white/10`}
              />
              <span className="text-xs text-gray-300">{color}</span>
              <span className="text-xs text-gray-500">
                {color === "White" ? "p=0.1" : "p=0.4"}
              </span>
            </button>
          ))}
          {activeSlot !== null && slots[activeSlot] && (
            <button
              onClick={() => clearSlot(activeSlot)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border border-gray-700 bg-gray-900 hover:scale-105 transition"
            >
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-lg">
                ×
              </div>
              <span className="text-xs text-gray-300">Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-400 mb-5">
        Slots filled:{" "}
        <span
          className={
            filled === 4
              ? "text-green-400 font-bold"
              : "text-yellow-400 font-bold"
          }
        >
          {filled} / 4
        </span>
        {filled < 4 && (
          <span className="ml-2">— click slots above to assign colors</span>
        )}
      </div>

      {result ? (
        <div className="w-full max-w-sm space-y-3">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 text-center">
            <SlotDisplay slots={result.slots} />
            <div className="text-yellow-300 text-sm font-semibold mt-2">
              {comboLabel}
            </div>
            <div className="text-gray-500 text-xs mt-1 font-mono">
              {result.X} arrangements ·{" "}
              {result.slots
                .map((c) => (c === "White" ? "0.1" : "0.4"))
                .join(" × ")}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm font-semibold text-green-300">
                Any Order — {comboLabel}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatBox label="Arrangements" value={result.X} />
              <StatBox
                label="Probability"
                value={(result.anyOrderProb * 100).toFixed(4) + "%"}
                color="text-green-400"
              />
              <StatBox
                label="1-in-X"
                value={"1 in " + fmt(1 / result.anyOrderProb)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBox
                label="Avg Rolls"
                value={fmt(result.avgAny)}
                sub="50% chance"
                color="text-yellow-300"
              />
              <StatBox
                label="99% Confidence"
                value={fmt(result.p99Any) + " rolls"}
                sub="99% chance"
                color="text-orange-300"
              />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-sm font-semibold text-yellow-300">
                Order-Roll — correct colors, wrong order
              </span>
            </div>
            <p className="text-gray-500 text-xs mb-3 ml-4">
              Uniform random reshuffle. Chance of exact order = 1/{result.X}.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatBox label="Arrangements" value={result.X} />
              <StatBox
                label="Probability"
                value={(100 / result.X).toFixed(4) + "%"}
                color="text-yellow-400"
              />
              <StatBox label="1-in-X" value={"1 in " + result.X} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBox
                label="Avg Order-Rolls"
                value={fmt(result.X)}
                sub="50% chance"
                color="text-yellow-300"
              />
              <StatBox
                label="99% Confidence"
                value={fmt(result.p99Order) + " rolls"}
                sub="99% chance"
                color="text-orange-300"
              />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-sm font-semibold text-purple-300">
                Exact Order —{" "}
                {result.slots.map((c) => COLOR_STYLES[c].label).join("-")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <StatBox label="Arrangements" value="1" />
              <StatBox
                label="Probability"
                value={(result.exactOrderProb * 100).toFixed(6) + "%"}
                color="text-purple-400"
              />
              <StatBox
                label="1-in-X"
                value={"1 in " + fmt(1 / result.exactOrderProb)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBox
                label="Avg Rolls"
                value={fmt(result.avgExact)}
                sub="50% chance"
                color="text-yellow-300"
              />
              <StatBox
                label="99% Confidence"
                value={fmt(result.p99Exact) + " rolls"}
                sub="99% chance"
                color="text-orange-300"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-600 text-sm italic">
          Fill all 4 slots to see results.
        </div>
      )}

      <button
        onClick={reset}
        className="mt-6 text-xs text-gray-500 hover:text-gray-300 underline transition"
      >
        Reset
      </button>
    </div>
  );
}

// ─── SIMULATOR TAB ────────────────────────────────────────────────────────────
const EMPTY = [null, null, null, null];

function SimulatorTab() {
  const [slots, setSlots] = useState(EMPTY);
  const [history, setHistory] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [animSlots, setAnimSlots] = useState(EMPTY);
  const [preset, setPreset] = useState(EMPTY);
  const [activePreset, setActivePreset] = useState(null);
  const [presetOpen, setPresetOpen] = useState(false);

  const totalRolls = history.length;
  const normalRolls = history.filter((h) => h.type === "roll").length;
  const orderRolls = history.filter((h) => h.type === "order").length;
  const hasColors = slots.every(Boolean);

  const push = (type, result) =>
    setHistory((h) =>
      [{ type, result, id: Date.now() + Math.random() }, ...h].slice(0, 50),
    );

  const animateRoll = useCallback((newSlots, type) => {
    setRolling(true);
    let ticks = 0;
    const max = 8;
    const interval = setInterval(() => {
      setAnimSlots([rollSlot(), rollSlot(), rollSlot(), rollSlot()]);
      ticks++;
      if (ticks >= max) {
        clearInterval(interval);
        setAnimSlots(newSlots);
        setSlots(newSlots);
        push(type, newSlots);
        setRolling(false);
      }
    }, 60);
  }, []);

  const doRoll = () => {
    if (rolling) return;
    const newSlots = [rollSlot(), rollSlot(), rollSlot(), rollSlot()];
    animateRoll(newSlots, "roll");
  };

  const doOrderRoll = () => {
    if (rolling || !hasColors) return;
    // Derange by shuffling indices, rejecting only if any index maps to itself
    let perm;
    do {
      perm = [0, 1, 2, 3];
      for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
      }
    } while (perm.some((p, i) => p === i));
    animateRoll(
      perm.map((p) => slots[p]),
      "order",
    );
  };

  const reset = () => {
    setSlots(EMPTY);
    setAnimSlots(EMPTY);
    setHistory([]);
  };

  const setPresetSlot = (i, color) => {
    setPreset((p) => {
      const n = [...p];
      n[i] = color;
      return n;
    });
    setActivePreset(null);
  };
  const clearPresetSlot = (i) => {
    setPreset((p) => {
      const n = [...p];
      n[i] = null;
      return n;
    });
    setActivePreset(null);
  };
  const applyPreset = () => {
    setSlots([...preset]);
    setAnimSlots([...preset]);
    setHistory([]);
    setPresetOpen(false);
  };
  const presetFilled = preset.every(Boolean);

  const displaySlots = rolling ? animSlots : slots;
  const stats = useMemo(
    () => computeStats(hasColors ? slots : null),
    [slots, hasColors],
  );

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Current slots */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full mb-4 text-center">
        <p className="text-gray-500 text-xs mb-3 uppercase tracking-widest">
          Current Roll
        </p>
        <div className="flex gap-3 justify-center mb-4">
          {displaySlots.map((c, i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-75
              ${c ? COLOR_STYLES[c].bg : "bg-gray-800 border-2 border-dashed border-gray-700"}
              ${rolling ? "scale-95 opacity-80" : "scale-100 opacity-100"}`}
            >
              <span className="text-xs text-white/50 font-normal">
                S{i + 1}
              </span>
              <span
                className={`text-lg font-bold ${c === "White" ? "text-gray-800" : "text-white"}`}
              >
                {c ? COLOR_STYLES[c].label : "?"}
              </span>
            </div>
          ))}
        </div>

        {/* Stats pill */}
        {stats && !rolling && (
          <div className="flex justify-center gap-2 flex-wrap mb-1">
            {Object.entries(stats.counts).map(([c, n]) => (
              <span
                key={c}
                className={`text-xs px-2 py-0.5 rounded-full font-semibold
                ${c === "White" ? "bg-gray-300 text-gray-800" : `${COLOR_STYLES[c].bg} text-white`}`}
              >
                {n}
                {c[0]}
              </span>
            ))}
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
              {stats.X} arrangements
            </span>
          </div>
        )}
        {!hasColors && !rolling && (
          <p className="text-gray-600 text-xs">Hit Roll to begin</p>
        )}
      </div>

      {/* Preset panel */}
      <div className="w-full mb-4">
        <button
          onClick={() => setPresetOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 hover:border-gray-500 text-sm text-gray-300 transition"
        >
          <span className="font-semibold">⚙️ Initial State</span>
          <div className="flex items-center gap-2">
            {presetFilled && <SlotDisplay slots={preset} small />}
            <span className="text-gray-500">{presetOpen ? "▲" : "▼"}</span>
          </div>
        </button>
        {presetOpen && (
          <div className="bg-gray-900 border border-t-0 border-gray-700 rounded-b-xl px-4 pb-4 pt-3">
            <p className="text-gray-500 text-xs mb-3">
              Define a starting combo, then apply it to begin simulation from
              that state.
            </p>
            <div className="flex gap-2 justify-center mb-3">
              {preset.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setActivePreset(activePreset === i ? null : i)}
                  className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center transition
                    ${color ? `${COLOR_STYLES[color].bg} border-transparent` : "bg-gray-800 border-gray-600 text-gray-600"}
                    ${activePreset === i ? `ring-2 ${color ? COLOR_STYLES[color].ring : "ring-white"} scale-110` : "hover:scale-105"}`}
                >
                  <span className="text-xs text-white/50">S{i + 1}</span>
                  <span
                    className={`text-sm font-bold ${color === "White" ? "text-gray-800" : "text-white"}`}
                  >
                    {color ? COLOR_STYLES[color].label : "?"}
                  </span>
                </button>
              ))}
            </div>
            {activePreset !== null && (
              <div className="flex gap-1.5 justify-center mb-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setPresetSlot(activePreset, color)}
                    className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border transition hover:scale-105
                      ${preset[activePreset] === color ? "border-white" : "border-gray-700"} bg-gray-800`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full ${COLOR_STYLES[color].bg}`}
                    />
                    <span className="text-xs text-gray-300">{color[0]}</span>
                  </button>
                ))}
                {preset[activePreset] && (
                  <button
                    onClick={() => clearPresetSlot(activePreset)}
                    className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-700 bg-gray-800 hover:scale-105 transition"
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-xs text-gray-300">
                      ×
                    </div>
                    <span className="text-xs text-gray-400">clr</span>
                  </button>
                )}
              </div>
            )}
            <button
              onClick={applyPreset}
              disabled={!presetFilled}
              className="w-full py-2 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-30 text-sm font-bold transition"
            >
              Apply as Starting State
            </button>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 w-full mb-5">
        <button
          onClick={doRoll}
          disabled={rolling}
          className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-600 disabled:opacity-40 font-bold text-sm transition active:scale-95"
        >
          🎲 Roll
        </button>
        <button
          onClick={doOrderRoll}
          disabled={rolling || !hasColors}
          className="flex-1 py-3 rounded-xl bg-yellow-700 hover:bg-yellow-600 disabled:opacity-40 font-bold text-sm transition active:scale-95"
        >
          🔀 Order-Roll
        </button>
        <button
          onClick={reset}
          disabled={rolling}
          className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-sm transition active:scale-95"
        >
          ↺
        </button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-2 w-full mb-5">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-center">
          <div className="text-gray-400 text-xs mb-1">Total</div>
          <div className="text-white font-bold text-xl">{totalRolls}</div>
        </div>
        <div className="bg-gray-900 border border-green-900 rounded-xl p-3 text-center">
          <div className="text-gray-400 text-xs mb-1">Rolls</div>
          <div className="text-green-400 font-bold text-xl">{normalRolls}</div>
        </div>
        <div className="bg-gray-900 border border-yellow-900 rounded-xl p-3 text-center">
          <div className="text-gray-400 text-xs mb-1">Order-Rolls</div>
          <div className="text-yellow-400 font-bold text-xl">{orderRolls}</div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="w-full">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">
            History (last 50)
          </p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {history.map((h, idx) => (
              <div
                key={h.id}
                className={`flex items-center gap-2 bg-gray-900 rounded-xl px-3 py-2 border
                ${h.type === "order" ? "border-yellow-900" : "border-gray-800"}`}
              >
                <span className="text-xs w-4 text-gray-600">
                  {totalRolls - idx}
                </span>
                <span
                  className={`text-xs font-semibold w-16 ${h.type === "order" ? "text-yellow-400" : "text-green-400"}`}
                >
                  {h.type === "order" ? "🔀 Order" : "🎲 Roll"}
                </span>
                <SlotDisplay slots={h.result} small />
                <span className="text-xs text-gray-600 ml-auto">
                  {Object.entries(
                    h.result.reduce(
                      (a, c) => ({ ...a, [c]: (a[c] || 0) + 1 }),
                      {},
                    ),
                  )
                    .map(([c, n]) => `${n}${c[0]}`)
                    .join(" ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("calculator");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-1 tracking-tight">
        4-Slot Color Permutation
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-8 mt-3">
        {[
          ["calculator", "📊 Calculator"],
          ["simulator", "🎲 Simulator"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition
              ${tab === id ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "calculator" ? <CalculatorTab /> : <SimulatorTab />}
    </div>
  );
}
