import React, { useEffect, useRef, useState } from "react";

/* ===================== TYPES & CONFIG ===================== */
type Color = "red" | "yellow" | "green" | "blue" | "neon_purple";
type Value =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "draw2"
  | "draw4"
  | "draw6"
  | "draw10"
  | "discard_all"; // treated as BLOCK (skip)

interface Card { id: string; color: Color; value: Value; }
interface Player {
  id: number;
  name: string;
  hand: Card[];
  isCPU: boolean;
  saidUno: boolean;
  isEliminated: boolean;
  unoTimer: number | null;
}

const MERCY_LIMIT = 25;
const UNO_GRACE_MS = 6000; // 6 seconds to SAY UNO
const COLORS: Color[] = ["red", "yellow", "green", "blue"];
const COLOR_MAP: Record<Color, string> = {
  red: "from-rose-600 to-red-900 shadow-red-500/50",
  yellow: "from-amber-300 to-yellow-500 shadow-yellow-400/50",
  green: "from-lime-400 to-emerald-600 shadow-lime-500/50",
  blue: "from-cyan-400 to-blue-700 shadow-cyan-500/50",
  neon_purple: "from-fuchsia-600 to-purple-900 shadow-fuchsia-600/60",
};

const CPU_NAMES = ["Raj","Shaleem","Bappa","Pandit","Arpan","Shachin","Ayush","Aditi","Anushka","Priya","Shreya","Deepika"];

/* ===================== CARD FACE (symbols + improved look) ===================== */
const CardFace = ({ card, size = "large" }: { card: Card; size?: "large" | "small" }) => {
  const big = size === "large";
  const fontSize = big ? "text-4xl" : "text-lg";
  const isBlock = card.value === "skip" || card.value === "discard_all";
  const isReverse = card.value === "reverse";
  const centerLabel = card.value.includes("draw") ? `+${card.value.replace(/\D/g,"")}` : isBlock ? "⦸" : isReverse ? "↺" : card.value;

  if (card.color === "neon_purple") {
    return (
      <div className={`relative rounded-2xl border-2 bg-gradient-to-br from-slate-900 to-black text-white flex items-center justify-center ${big ? "w-28 h-44" : "w-14 h-20"} shadow-xl`}>
        <div className="absolute left-3 top-3 w-12 h-6 rounded-md bg-white/6 flex items-center justify-center text-xs font-black">WILD</div>
        <div className={`font-black ${fontSize} drop-shadow-2xl`}>{centerLabel}</div>
        <div className="absolute bottom-2 left-2 right-2 h-6 rounded-md flex overflow-hidden gap-1">
          <div className="flex-1 bg-red-400/80" />
          <div className="flex-1 bg-yellow-300/80" />
          <div className="flex-1 bg-green-400/80" />
          <div className="flex-1 bg-blue-400/80" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl border-2 bg-gradient-to-br ${COLOR_MAP[card.color]} text-white flex flex-col items-center justify-between ${big ? "w-28 h-44" : "w-14 h-20"} shadow-md`}>
      <div className="w-full flex justify-between items-start p-2">
        <div className={`rounded ${big ? "w-8 h-4 text-xs" : "w-5 h-3 text-[10px]"} flex items-center justify-center bg-white/20 font-black`}>{card.color[0].toUpperCase()}</div>
        <div className="text-white/80 text-xs font-bold p-0.5">{card.value.includes("draw") ? `+${card.value.replace(/\D/g,"")}` : (isBlock ? "⦸" : isReverse ? "↺" : "")}</div>
      </div>
      <div className={`flex-1 flex items-center justify-center ${fontSize} font-black drop-shadow-lg`}>{centerLabel}</div>
      <div className="w-full flex justify-end p-2">
        <div className="text-white/70 text-xs font-bold">{isReverse ? "↺" : isBlock ? "⦸" : ""}</div>
      </div>
    </div>
  );
};

const CardUI = ({ card, onClick, isPlayable, size = "large", innerRef }: { card: Card; onClick?: () => void; isPlayable?: boolean; size?: "large" | "small"; innerRef?: (el: HTMLDivElement | null) => void }) => (
  <div ref={el => innerRef?.(el)} onClick={isPlayable ? onClick : undefined} className={`relative select-none transition-transform duration-300 ${isPlayable ? "cursor-pointer scale-105 -translate-y-6 shadow-[0_12px_30px_rgba(0,0,0,0.6)]" : "opacity-80"}`}>
    <CardFace card={card} size={size} />
    {isPlayable && <div className="absolute inset-0 rounded-2xl ring-4 ring-white/20 pointer-events-none animate-pulse" />}
  </div>
);

/* ===================== MAIN COMPONENT ===================== */
export default function UnoNoMercyFinal() {
  const [gameStarted, setGameStarted] = useState(false);
  const [cpuCount, setCpuCount] = useState(5);
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [activeColor, setActiveColor] = useState<Color>("red");
  const [drawStack, setDrawStack] = useState(0);
  const [winner, setWinner] = useState<Player | null>(null);
  const [notification, setNotification] = useState("");
  const [catchableId, setCatchableId] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);

  // REFS for animation origin/targets
  const discardRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const avatarRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({}); // cardId -> element (human hand primarily)

  // Flying card animations
  const [flying, setFlying] = useState<Array<{ key: string; card: Card; style: React.CSSProperties }>>([]);

  // Helpers
  const shuffle = (arr: Card[]) => arr.sort(() => Math.random() - 0.5);

  const drawFromDeck = (count: number, currentDeck: Card[], currentDiscard: Card[]) => {
    let deckCopy = [...currentDeck];
    let discardCopy = [...currentDiscard];
    const drawn: Card[] = [];

    while (drawn.length < count) {
      if (deckCopy.length === 0) {
        if (discardCopy.length <= 1) break;
        const top = discardCopy.pop()!;
        deckCopy = shuffle(discardCopy);
        discardCopy = [top];
      }
      const take = Math.min(count - drawn.length, deckCopy.length);
      drawn.push(...deckCopy.splice(0, take));
    }

    return { drawn, newDeck: deckCopy, newDiscard: discardCopy };
  };

  // Animate card moving from originRect -> targetRect
  const animateMove = (card: Card, originRect: DOMRect, targetRect: DOMRect, duration = 600) => {
    const key = `${card.id}-${Date.now()}`;
    const startLeft = originRect.left + originRect.width / 2;
    const startTop = originRect.top + originRect.height / 2;
    const endLeft = targetRect.left + targetRect.width / 2;
    const endTop = targetRect.top + targetRect.height / 2;

    const style: React.CSSProperties = {
      position: "fixed",
      left: startLeft,
      top: startTop,
      transform: `translate(-50%,-50%) scale(1)`,
      transition: `transform ${duration}ms cubic-bezier(.2,.9,.2,1), left ${duration}ms linear, top ${duration}ms linear, opacity ${duration}ms`,
      zIndex: 4000,
      pointerEvents: "none",
    };

    setFlying(prev => [...prev, { key, card, style }]);

    // schedule update to move to target
setTimeout(() => {
  setFlying(prev =>
    prev.map(f => {
      if (f.key !== key) return f;
      return {
        ...f,
        style: {
          ...f.style,
          left: endLeft,
          top: endTop,
          transform: `translate(-50%,-50%) scale(0.98) rotate(${(Math.random() - 0.5) * 15}deg)`,
          opacity: 0.98,
        },
      };
    })
  );
}, 20);

    // remove after animation
    setTimeout(() => {
      setFlying(prev => prev.filter(f => f.key !== key));
    }, duration + 50);
  };

  const startGame = () => {
    const d: Card[] = [];
    COLORS.forEach(c => {
      d.push({id:`n-${c}-0-${Math.random()}`, color:c, value:"0"});
      for (let i=1;i<=9;i++){ d.push({id:`n-${c}-${i}-${Math.random()}`, color:c, value: i.toString() as Value}); d.push({id:`n2-${c}-${i}-${Math.random()}`, color:c, value: i.toString() as Value}); }
      d.push({id:`s-${c}-${Math.random()}`, color:c, value:"skip"});
      d.push({id:`r-${c}-${Math.random()}`, color:c, value:"reverse"});
      d.push({id:`d2-${c}-${Math.random()}`, color:c, value:"draw2"});
      d.push({id:`x-${c}-${Math.random()}`, color:c, value:"discard_all"}); // colored block
    });
    for(let i=0;i<6;i++) d.push({id:`w-d4-${i}-${Math.random()}`, color:"neon_purple", value:"draw4"});
    for(let i=0;i<4;i++) d.push({id:`w-d6-${i}-${Math.random()}`, color:"neon_purple", value:"draw6"});
    for(let i=0;i<4;i++) d.push({id:`w-d10-${i}-${Math.random()}`, color:"neon_purple", value:"draw10"});
    for(let i=0;i<3;i++) d.push({id:`w-discard-${i}-${Math.random()}`, color:"neon_purple", value:"discard_all"});

    const shuffled = shuffle(d);
    const names = [...CPU_NAMES].sort(() => Math.random() - 0.5);
    const p: Player[] = [{ id:0, name:"YOU", hand: shuffled.splice(0,7), isCPU:false, saidUno:false, isEliminated:false, unoTimer:null }];
    const actualCpu = Math.min(Math.max(cpuCount,1),10);
    for (let i=1;i<=actualCpu;i++){
      p.push({ id:i, name: names[(i-1)%names.length], hand: shuffled.splice(0,7), isCPU:true, saidUno:false, isEliminated:false, unoTimer:null });
    }

    const firstDiscard = shuffled.pop()!;
    setDiscardPile([firstDiscard]);
    setDeck(shuffled);
    setPlayers(p);
    setGameStarted(true);
    setTurnIndex(0);
    setDirection(1);
    setActiveColor(firstDiscard.color === "neon_purple" ? "red" : firstDiscard.color);
    setDrawStack(firstDiscard.value.includes("draw") ? parseInt(firstDiscard.value.replace(/\D/g,"")) : 0);
    setWinner(null);
    setNotification("");
    setCatchableId(null);
    setShowLoseModal(false);
    setShowRules(false);
  };

  // Next active player relative to fromIdx
  const nextActiveIndex = (fromIdx: number, step = 1, playersList = players) => {
    let next = (fromIdx + step + playersList.length) % playersList.length;
    let attempts = 0;
    while (playersList[next].isEliminated && attempts < playersList.length) {
      next = (next + Math.sign(step) + playersList.length) % playersList.length;
      attempts++;
    }
    return next;
  };

  /* ===================== PLAY / DRAW LOGIC WITH ANIMATIONS ===================== */

  // Play animation + logic wrapper
  const handlePlayAction = (pIdx: number, card: Card, chosenColor?: Color) => {
    // origin: prefer card element for human, avatar for CPU; target: discard pile
    const originEl = pIdx === 0 ? (cardRefs.current[card.id] ?? avatarRefs.current[pIdx]) : (avatarRefs.current[pIdx] ?? cardRefs.current[card.id]);
    const targetEl = discardRef.current ?? undefined;

    if (originEl && targetEl) {
      const originRect = originEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      animateMove(card, originRect, targetRect, 520);
    }

    // then apply game logic
    applyPlay(pIdx, card, chosenColor);
  };

  const applyPlay = (pIdx: number, card: Card, chosenColor?: Color) => {
    const willReverse = card.value === "reverse";
    const willSkip = card.value === "skip" || card.value === "discard_all";
    const drawAmt = card.value.includes("draw") ? parseInt(card.value.replace(/\D/g,"")) || 0 : 0;

    const computedDirection = willReverse ? -direction : direction;
    const computedDrawStack = drawAmt > 0 ? drawStack + drawAmt : drawStack;

    if (willReverse) setDirection(computedDirection);
    if (drawAmt > 0) setDrawStack(computedDrawStack);

    setPlayers(prevPlayers => {
      const p = [...prevPlayers];
      if (p[pIdx].isEliminated) return p;

      p[pIdx].hand = p[pIdx].hand.filter(c => c.id !== card.id);

      if (p[pIdx].hand.length === 1) {
        p[pIdx].unoTimer = Date.now();
        p[pIdx].saidUno = false;
      } else {
        p[pIdx].unoTimer = null;
      }

      setDiscardPile(prev => [...prev, card]);
      const newColor: Color = card.color === "neon_purple" ? (chosenColor || "red") : card.color;
      setActiveColor(newColor);

      if (p[pIdx].hand.length === 0) {
        setWinner(p[pIdx]);
        setNotification(`${p[pIdx].name} WINS!`);
      }

      const nextStep = willSkip ? computedDirection * 2 : computedDirection;
      const updatedPlayers = p;
      setTimeout(() => {
        const ni = nextActiveIndex(pIdx, nextStep, updatedPlayers);
        setTurnIndex(ni);
      }, 420);

      if (p[pIdx].hand.length >= MERCY_LIMIT) {
        p[pIdx].isEliminated = true;
        setNotification(`L + RATIO: ${p[pIdx].name} ELIMINATED!`);
        if (pIdx === 0) setShowLoseModal(true);
      }

      return p;
    });
  };

  // DRAW action with animation for drawn cards
  const handleDrawAction = (pIdx: number) => {
    // animate from deckRef to player's avatar (always target avatar to avoid referencing not-yet-mounted card elements)
    const deckEl = deckRef.current;
    const targetEl = avatarRefs.current[pIdx] ?? deckEl ?? undefined;

    setPlayers(prevPlayers => {
      const p = [...prevPlayers];
      if (p[pIdx].isEliminated) return p;

      const amount = drawStack > 0 ? drawStack : 1;
      const { drawn, newDeck, newDiscard } = drawFromDeck(amount, deck, discardPile);

      setDeck(newDeck);
      setDiscardPile(newDiscard);

      // schedule animations for each drawn card from deck -> avatar/hand
      if (deckEl && targetEl) {
        drawn.forEach((card, i) => {
          setTimeout(() => {
            const originRect = deckEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();
            animateMove(card, originRect, targetRect, 500 + Math.min(200, i*80));
          }, i * 120);
        });
      }

      p[pIdx].hand = [...p[pIdx].hand, ...drawn];
      p[pIdx].saidUno = false;
      p[pIdx].unoTimer = null;

      if (p[pIdx].hand.length >= MERCY_LIMIT) {
        p[pIdx].isEliminated = true;
        setNotification(`L + RATIO: ${p[pIdx].name} ELIMINATED!`);
        if (pIdx === 0) setShowLoseModal(true);
      }

      setDrawStack(0);

      const next = nextActiveIndex(pIdx, direction, p);
      setTurnIndex(next);

      return p;
    });
  };

  // Snitch monitor: mark offending player for cort
  useEffect(() => {
    if (!gameStarted) return;
    const t = setInterval(() => {
      const now = Date.now();
      let offender: number | null = null;
      for (const pl of players) {
        if (!pl.isEliminated && pl.hand.length === 1 && !pl.saidUno && pl.unoTimer) {
          if (now - pl.unoTimer > UNO_GRACE_MS) {
            offender = pl.id;
            break;
          }
        }
      }
      setCatchableId(offender);
    }, 220);
    return () => clearInterval(t);
  }, [players, gameStarted]);

  // CPU brain: improved selection math and UNO behavior
  useEffect(() => {
    if (!gameStarted || winner) return;
    const cur = players[turnIndex];
    if (!cur || cur.isEliminated) return;

    // If someone else is catchable, CPU might snitch first (not themselves)
    if (cur.isCPU && catchableId !== null && catchableId !== cur.id && catchableId !== 0) {
      const snitchChance = 0.55;
      if (Math.random() < snitchChance) {
        const delay = 300 + Math.random() * 800;
        const t = setTimeout(() => handleSnitch(), delay);
        return () => clearTimeout(t);
      }
    }

    if (!cur.isCPU) return;

    // CPU response delay: linear decrement so larger hand -> slightly faster by ~1-per-card feel
    const baseDelay = 1100;
    const perCardDecrease = 28; // ~1 unit step as requested
    const minDelay = 300;
    const delay = Math.max(minDelay, baseDelay - cur.hand.length * perCardDecrease) + Math.random() * 400;

    const timer = setTimeout(() => {
      // CPU say UNO chance: ~66% say correctly, ~33% forget (approx 1 out of 3)
      setPlayers(prev => prev.map(pl => {
        if (pl.id === cur.id && pl.hand.length === 1) {
          const says = Math.random() < 0.66;
          return { ...pl, saidUno: says ? true : pl.saidUno, unoTimer: says ? null : (pl.unoTimer ?? Date.now()) };
        }
        return pl;
      }));

      const top = discardPile[discardPile.length - 1];

      // CPU move selection improvements:
      let move: Card | undefined;
      if (drawStack > 0) {
        const drawCandidates = cur.hand.filter(c => c.value.includes("draw"));
        drawCandidates.sort((a, b) => parseInt(b.value.replace(/\D/g,"")) - parseInt(a.value.replace(/\D/g,"")));
        move = drawCandidates[0];
      } else {
        const colorMatches = cur.hand.filter(c => c.color === activeColor);
        const valueMatches = cur.hand.filter(c => c.value === top.value);
        const wilds = cur.hand.filter(c => c.color === "neon_purple");
        const preferred = [...colorMatches].sort((a,b) => {
          const score = (card: Card) => (card.value.includes("draw") ? 30 : card.value === "reverse" ? 20 : card.value === "skip" ? 15 : 1);
          return score(b) - score(a);
        });
        move = preferred[0] || valueMatches[0] || wilds[0] || cur.hand.find(c => c.color === activeColor);
      }

      if (move) {
        let pickColor: Color | undefined;
        if (move.color === "neon_purple") {
          const counts: Record<Color, number> = { red: 0, yellow: 0, green: 0, blue: 0, neon_purple: 0 };
          cur.hand.forEach(hc => counts[hc.color]++);
          pickColor = (["red","yellow","green","blue"] as Color[]).sort((a,b) => counts[b] - counts[a])[0];
        }
        handlePlayAction(turnIndex, move, pickColor);
      } else {
        handleDrawAction(turnIndex);
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnIndex, gameStarted, drawStack, discardPile, activeColor, players, winner, catchableId]);

  // SNITCH action (human only; CPUs snitch as part of CPU logic)
  const handleSnitch = () => {
    if (catchableId === null) return;
    if (catchableId === 0) return; // cannot cort yourself

    setPlayers(prev => {
      const p = [...prev];
      const targetIdx = p.findIndex(pl => pl.id === catchableId);
      if (targetIdx === -1) return p;
      const amount = 2;
      const { drawn, newDeck, newDiscard } = drawFromDeck(amount, deck, discardPile);
      setDeck(newDeck);
      setDiscardPile(newDiscard);
      p[targetIdx].hand = [...p[targetIdx].hand, ...drawn];
      p[targetIdx].unoTimer = null;
      p[targetIdx].saidUno = false;

      if (p[targetIdx].hand.length >= MERCY_LIMIT) {
        p[targetIdx].isEliminated = true;
        setNotification(`SNITCHED! ${p[targetIdx].name} ELIMINATED!`);
        if (targetIdx === 0) setShowLoseModal(true);
      } else {
        setNotification(`SNITCHED! ${p[targetIdx].name} +${drawn.length}`);
      }

      setCatchableId(null);
      return p;
    });
  };

  // helper to check playability
  const isHumanCardPlayable = (c: Card) => {
    const top = discardPile[discardPile.length - 1];
    if (drawStack > 0) return c.value.includes("draw");
    return c.color === "neon_purple" || c.color === activeColor || c.value === top.value;
  };

  // When human presses SAY UNO, ensure catchable is cleared and unoTimer nulled
  const humanSayUno = () => {
    setPlayers(prev => {
      const p = [...prev];
      p[0].saidUno = true;
      p[0].unoTimer = null;
      return p;
    });
    setCatchableId(null);
    setNotification("SAFE!");
  };

  const handleReplay = () => window.location.reload();

  /* ===================== Overlays & Flying card renderers ===================== */
  const Confetti = ({ count = 36 }: { count?: number }) => {
    const colors = ["#FFD400","#FF6B6B","#6EE7B7","#60A5FA","#C084FC","#FDBA74"];
    return (
      <div className="pointer-events-none fixed inset-0 z-[2500]">
        {Array.from({ length: count }).map((_,i) => {
          const style: React.CSSProperties = {
            left: `${Math.random()*100}%`,
            top: `${-10 - Math.random()*10}%`,
            background: colors[i % colors.length],
            transform: `rotate(${Math.random()*360}deg)`,
            width: `${6 + Math.random()*12}px`,
            height: `${6 + Math.random()*12}px`,
            borderRadius: `${Math.random()>0.5 ? "50%":"6px"}`,
            animationDelay: `${Math.random()*0.7}s`,
            animationDuration: `${2 + Math.random()*2}s`,
          };
          return <div key={i} className="absolute animate-confetti-fall" style={style} />;
        })}
      </div>
    );
  };

  const WinOverlay = ({ winner }: { winner: Player }) => (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80">
      <Confetti />
      <div className="bg-gradient-to-br from-yellow-300 to-pink-400 rounded-3xl p-10 text-center shadow-2xl transform animate-win-bounce max-w-md w-full mx-4">
        <div className="text-[6rem] leading-none mb-2 animate-pulse">😄</div>
        <h1 className="text-4xl font-extrabold text-white mb-2">HYPE! YOU WON</h1>
        <p className="text-lg font-bold text-white/95 mb-6">{winner.name} cleared the arena</p>
        <div className="flex justify-center gap-4">
          <button onClick={handleReplay} className="px-8 py-3 bg-white font-black rounded-full shadow">REPLAY</button>
          <button onClick={() => setShowRules(true)} className="px-6 py-3 bg-white/10 border border-white/20 rounded-full font-bold">RULES</button>
        </div>
      </div>
    </div>
  );

  const LoseOverlay = () => (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/92">
      <div className="relative">
        <div className="flex flex-col items-center bg-[#0b0b0b] p-10 rounded-3xl border border-white/6 shadow-2xl transform animate-lose-glitch max-w-md">
          <div className="text-[7rem] leading-none mb-3 animate-pulse">💀</div>
          <h2 className="text-4xl font-black mb-2">YOU LOST</h2>
          <p className="text-white/80 mb-6 text-center">The arena was ruthless. This one didn't go your way — bounce back and wreck them next round.</p>
          <div className="flex gap-4">
            <button onClick={handleReplay} className="px-8 py-3 bg-lime-400 font-black rounded-xl">REPLAY</button>
            <button onClick={() => setShowRules(true)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black">RULES</button>
          </div>
        </div>
      </div>
    </div>
  );

  // small inline animations
  const inlineStyles = `
    @keyframes confetti-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity:1 } 100% { transform: translateY(110vh) rotate(360deg); opacity:0.95 } }
    .animate-confetti-fall { animation-name: confetti-fall; animation-timing-function: linear; animation-iteration-count: 1; }
    @keyframes lose-glitch { 0%{transform:none}20%{transform:translateX(-6px) skewX(-6deg)}40%{transform:translateX(6px) skewX(6deg)}60%{transform:translateX(-4px) skewX(-4deg)}100%{transform:none} }
    .animate-lose-glitch{ animation: lose-glitch 1s ease-in-out infinite; }
    @keyframes win-bounce { 0%{transform:scale(0.96)}50%{transform:scale(1.03)}100%{transform:scale(0.98)} }
    .animate-win-bounce{ animation: win-bounce 900ms ease-in-out infinite; }
  `;

  /* ===================== RENDER ===================== */
  if (!gameStarted) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10">
      <style>{inlineStyles}</style>
      <h1 className="text-8xl font-black text-white italic mb-10 tracking-tighter shadow-lime-500">UNO<span className="text-lime-400">NO MERCY</span></h1>
      <div className="bg-white/6 backdrop-blur-3xl p-10 rounded-3xl border border-white/10 w-full max-w-md text-center">
        <p className="text-white/60 mb-6 font-bold uppercase tracking-widest">Select CPU Players</p>
        <div className="flex justify-between text-2xl font-black mb-4">
          <span className="text-lime-400">{cpuCount}</span> <span>10</span>
        </div>
        <input type="range" min={1} max={10} value={cpuCount} onChange={(e)=>setCpuCount(+e.target.value)} className="w-full h-2 bg-white/10 rounded-full appearance-none accent-lime-400 mb-6" />
        <div className="flex gap-4">
          <button onClick={startGame} className="flex-1 py-4 bg-lime-400 text-black font-black text-2xl rounded-full shadow-[0_0_30px_rgba(163,230,53,0.3)]">PLAY NOW</button>
          <button onClick={()=>setShowRules(true)} className="px-6 py-4 bg-white/5 border border-white/10 text-white font-black rounded-full shadow-sm">RULES</button>
        </div>
      </div>

      {showRules && (
        <div className="fixed inset-0 bg-black/70 z-[2000] flex items-center justify-center p-6" onClick={()=>setShowRules(false)}>
          <div className="max-w-3xl bg-[#0b0b0b] p-8 rounded-2xl border border-white/10 text-left text-white/90 relative" onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setShowRules(false)} className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/6 flex items-center justify-center font-black text-sm">✕</button>
            <h2 className="text-3xl font-black mb-4">UNO NO MERCY — RULES</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>UNO NO MERCY is a fast, high-pressure variant of UNO. Get rid of all your cards to win — but beware: there is no mercy.</p>
              <ul className="list-disc ml-5">
                <li>Number cards match by color or value.</li>
                <li>Reverse flips play direction. Skip (Block) cancels the next player's turn (⦸).</li>
                <li>Reverse is shown as ↺ and flips play direction immediately.</li>
                <li>Draw cards (+2, +4, +6, +10) stack aggressively.</li>
                <li>Wild neon cards change the active color and can also be draw-wilds.</li>
                <li>When you drop to one card press "SAY UNO!" within {UNO_GRACE_MS/1000} seconds — opponents can "CORT" (snitch) you for +2 or elimination. You cannot cort yourself.</li>
                <li>If your hand grows beyond {MERCY_LIMIT} cards you are ELIMINATED from the match.</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button onClick={()=>setShowRules(false)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black">CLOSE</button>
              <button onClick={()=>{ setShowRules(false); startGame(); }} className="px-6 py-3 bg-lime-400 rounded-xl font-black text-black">START GAME</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
      <style>{inlineStyles}</style>

      {/* Flying animated cards */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[3900]">
        {flying.map(f => {
          return (
            <div key={f.key} style={f.style} className="rounded-md px-3 py-2 text-black font-extrabold bg-white/95 shadow-lg">
              {f.card.value.includes("draw") ? `+${f.card.value.replace(/\D/g,"")}` : (f.card.value === "discard_all" ? "⦸" : f.card.value)}
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-black/60 border-b border-white/5 z-50">
        <div className="flex gap-4 items-center">
          <div className={`px-6 py-2 rounded-xl bg-white/5 border border-white/10 font-black text-${activeColor}-400`}>COLOR: {activeColor.toUpperCase()}</div>
          <div className="px-6 py-2 rounded-xl bg-red-700 font-black shadow-[0_0_20px_rgba(255,0,0,0.14)]">STACK: +{drawStack}</div>
          <div className="px-4 py-2 rounded-lg bg-white/3 text-white/80 text-xs font-bold ml-2">Turn: {players[turnIndex]?.name}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-lime-400 font-black italic text-xl animate-pulse uppercase mr-4">{notification || "The Arena"}</div>
          <button onClick={() => setShowRules(true)} className="px-4 py-2 bg-white/5 border border-white/8 rounded-full text-sm font-black hover:bg-white/8">RULES</button>
        </div>
      </div>

      {/* Opponents + avatars */}
      <div className="flex flex-wrap justify-center gap-6 p-8 overflow-y-auto max-h-48 no-scrollbar">
        {players.map((p, i) => i !== 0 && (
          <div key={p.id} className={`relative flex flex-col items-center transition-all duration-500 ${turnIndex === i ? "scale-125 opacity-100":"opacity-40"} ${p.isEliminated ? "grayscale opacity-20" : ""}`}>
            <div
              ref={el => avatarRefs.current[p.id] = el}
              className="flex items-center gap-2 mb-2"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-sm shadow-md">
                {p.name.split(" ").map(n => n[0]).slice(0,2).join("")}
              </div>
              <span className="text-xs font-black text-white/60 uppercase">{p.name}</span>
            </div>

            <div className="w-14 h-20 bg-gradient-to-t from-slate-800 to-slate-900 rounded-xl border border-white/10 flex items-center justify-center font-black text-2xl shadow-xl relative">
              {p.hand.length}
              {p.hand.length === 1 && !p.saidUno && <div className="absolute inset-0 bg-red-600/20 animate-ping rounded-xl" />}
            </div>

            {p.isEliminated && <div className="absolute -bottom-3 text-2xl">💀</div>}
          </div>
        ))}
      </div>

      {/* Center Table */}
      <div className="flex-1 flex items-center justify-center gap-16 relative">
        {/* deck area (for draw animation origin) */}
        <div ref={deckRef} className="w-28 h-44 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-white font-black text-lg shadow-2xl">
          DECK
        </div>

        <div ref={discardRef}>
          <CardFace card={discardPile[discardPile.length - 1]} size="large" />
        </div>

        {/* CORT button for human only when someone else is eligible */}
        {catchableId !== null && catchableId !== 0 && (
          <button onClick={handleSnitch} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] bg-red-600 text-white px-14 py-6 rounded-2xl font-black text-4xl shadow-[0_0_80px_red] border-4 border-white animate-bounce italic">
            CORT!
          </button>
        )}
      </div>

      {/* Player Dashboard */}
      <div className="h-80 bg-white/5 backdrop-blur-3xl border-t border-white/10 p-10 flex flex-col items-center relative z-50">
        <div className="absolute -top-12 flex gap-6">
          <button onClick={() => turnIndex === 0 && handleDrawAction(0)} className="px-12 py-4 bg-white text-black font-black text-xl rounded-full shadow-2xl hover:bg-lime-400 transition transform active:scale-95">
            {drawStack > 0 ? `DRAW +${drawStack}` : "DRAW CARD"}
          </button>

          {players[0].hand.length === 1 && !players[0].saidUno && !players[0].isEliminated && (
            <button onClick={humanSayUno} className="px-12 py-4 bg-lime-400 text-black font-black text-xl rounded-full animate-pulse shadow-[0_0_30px_#A3E635]">SAY UNO!</button>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto w-full max-w-7xl justify-center items-end h-full px-20 pb-10 no-scrollbar">
          {players[0].hand.map((c, i) => (
            <div key={c.id} style={{ marginLeft: i === 0 ? 0 : -50 }} className="hover:z-50 transition-all">
              <CardUI
                card={c}
                innerRef={el => cardRefs.current[c.id] = el}
                isPlayable={turnIndex === 0 && isHumanCardPlayable(c) && !players[0].isEliminated}
                onClick={() => {
                  if (!(turnIndex === 0 && isHumanCardPlayable(c) && !players[0].isEliminated)) return;
                  let color = c.color;
                  if (c.color === "neon_purple") {
                    const pick = prompt("Pick color: R, Y, G, B")?.toLowerCase();
                    color = pick === "g" ? "green" : pick === "y" ? "yellow" : pick === "b" ? "blue" : "red";
                  }
                  handlePlayAction(0, c, color);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Overlays */}
      {winner && <WinOverlay winner={winner} />}
      {showLoseModal && <LoseOverlay />}

      {showRules && (
        <div className="fixed inset-0 bg-black/70 z-[2000] flex items-center justify-center p-6" onClick={() => setShowRules(false)}>
          <div className="max-w-3xl bg-[#0b0b0b] p-8 rounded-2xl border border-white/10 text-left text-white/90 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowRules(false)} className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/6 flex items-center justify-center font-black text-sm">✕</button>
            <h2 className="text-3xl font-black mb-4">UNO NO MERCY — RULES</h2>
            <div className="space-y-3 text-sm leading-relaxed">
              <p>UNO NO MERCY is a fast, high-pressure variant of UNO. Get rid of all your cards to win — but beware: there is no mercy.</p>
              <ul className="list-disc ml-5">
                <li>Number cards match by color or value.</li>
                <li>Reverse flips play direction. Skip (Block) cancels the next player's turn (⦸).</li>
                <li>Reverse is shown as ↺ and flips play direction immediately.</li>
                <li>Draw cards (+2, +4, +6, +10) stack aggressively.</li>
                <li>Wild neon cards change the active color and can also be draw-wilds.</li>
                <li>When you drop to one card press "SAY UNO!" within {UNO_GRACE_MS/1000} seconds — opponents can "CORT" (snitch) you for +2 or elimination. You cannot cort yourself.</li>
                <li>If your hand grows beyond {MERCY_LIMIT} cards you are ELIMINATED from the match.</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button onClick={() => setShowRules(false)} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black">CLOSE</button>
              <button onClick={() => { setShowRules(false); }} className="px-6 py-3 bg-lime-400 rounded-xl font-black text-black">GOT IT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}