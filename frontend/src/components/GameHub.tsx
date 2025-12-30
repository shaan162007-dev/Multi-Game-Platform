import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GameHub.css";  // This imports the CSS file

const games = [
  { name: "Tic-Tac-Toe", gradient: "from-red-400 to-red-600", route: "/tic-tac-toe" },
  { name: "Hand Cricket", gradient: "from-yellow-400 to-yellow-600", route: "/hand-cricket" },
  { name: "Ludo", gradient: "from-green-400 to-green-600", route: "/ludo" },
  { name: "Uno", gradient: "from-purple-400 to-purple-600", route: "/uno" },
  { name: "Snake & Apple", gradient: "from-pink-400 to-pink-600", route: "/snake-apple" },
  { name: "Snake & Ladder", gradient: "from-blue-400 to-blue-600", route: "/snake-ladder" },
  { name: "Math Game", gradient: "from-orange-400 to-orange-600", route: "/math-game" },
];

const GameHub = () => {
  const navigate = useNavigate();
  
  // Load theme from localStorage or default to dark
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("game-theme");
    return savedTheme ? savedTheme === "dark" : true;
  });

  // Save theme to localStorage and apply to document
  useEffect(() => {
    localStorage.setItem("game-theme", isDark ? "dark" : "light");
    
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [isDark]);

  // Simple navigation function
  const handleGameClick = (route: string) => {
    // Save theme before navigating
    localStorage.setItem("game-theme", isDark ? "dark" : "light");
    
    // Navigate to game
    navigate(route);
  };

  // Theme toggle function
  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-black" : "bg-gradient-to-b from-sky-300 via-cyan-200 to-blue-400"}
      transition-all duration-1000 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden`}
    >
      {/* Theme Toggle - Top Right */}
      <button
        onClick={handleThemeToggle}
        className="fixed top-4 right-4 z-50 p-3 rounded-xl bg-white/20 dark:bg-black/40 backdrop-blur-xl shadow-xl border border-white/30 hover:scale-110 transition-all duration-300 cursor-pointer"
      >
        <span className="text-2xl">{isDark ? "☀️" : "🌙"}</span>
      </button>

      {/* Header - Small like in the image */}
      <header className="text-center mb-6 z-10">
        <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${
          isDark
            ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-blue-300"
            : "text-gray-900"
        } drop-shadow-md`}><b>
          Multi-Game Platform
        </b></h1>
        <p className="text-sm md:text-base text-white/100 dark:text-black/80"><i>
          Choose your next game and let the fun begin!
        </i></p>
      </header>

      {/* Games Layout - Very small & equal size cards to fit perfectly */}
      <div className="w-full max-w-4xl space-y-6 md:space-y-8">
        {/* Row 1: 3 equal cards - FIXED CLICK ISSUE */}
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {games.slice(0, 3).map((game) => (
            <div
              key={game.name}
              className="group relative"
            >
              {/* Glowing Outer Effect */}
              <div className={`absolute -inset-3 rounded-2xl bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-700 pointer-events-none`} />

              {/* Main Card - Small & equal - CLICKABLE DIV - FIXED */}
              <div 
                onClick={() => handleGameClick(game.route)}
                className={`relative bg-gradient-to-br ${game.gradient} rounded-2xl p-1 shadow-xl cursor-pointer active:scale-95 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1`}
                style={{ 
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                <div className="bg-white/15 dark:bg-black/30 backdrop-blur-xl rounded-2xl h-32 md:h-40 flex items-center justify-center border-2 border-white/30 group-hover:border-white/60 transition-all duration-300">
                  <h3 className="text-lg md:text-xl font-bold text-white drop-shadow-lg text-center px-4 leading-tight">
                    {game.name}
                  </h3>
                </div>
              </div>

              {/* Inner Glow - Make sure it doesn't block clicks */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
                   style={{ 
                     boxShadow: "inset 0 0 40px rgba(255, 255, 255, 0.3)",
                     zIndex: 1 
                   }} />
            </div>
          ))}
        </div>

        {/* Row 2: 3 equal cards - FIXED CLICK ISSUE */}
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {games.slice(3, 6).map((game) => (
            <div
              key={game.name}
              className="group relative"
            >
              <div className={`absolute -inset-3 rounded-2xl bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-700 pointer-events-none`} />

              {/* Main Card - CLICKABLE DIV - FIXED */}
              <div 
                onClick={() => handleGameClick(game.route)}
                className={`relative bg-gradient-to-br ${game.gradient} rounded-2xl p-1 shadow-xl cursor-pointer active:scale-95 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1`}
                style={{ 
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 10
                }}
              >
                <div className="bg-white/15 dark:bg-black/30 backdrop-blur-xl rounded-2xl h-32 md:h-40 flex items-center justify-center border-2 border-white/30 group-hover:border-white/60 transition-all duration-300">
                  <h3 className="text-lg md:text-xl font-bold text-white drop-shadow-lg text-center px-4 leading-tight">
                    {game.name}
                  </h3>
                </div>
              </div>

              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
                   style={{ 
                     boxShadow: "inset 0 0 40px rgba(255, 255, 255, 0.3)",
                     zIndex: 1 
                   }} />
            </div>
          ))}
        </div>

        {/* Row 3: 1 centered card (Math Game) - same size as others - FIXED CLICK */}
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          <div /> {/* Empty */}
          <div className="group relative">
            <div className={`absolute -inset-3 rounded-2xl bg-gradient-to-br ${games[6].gradient} opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-700 pointer-events-none`} />

            {/* Main Card - CLICKABLE DIV - FIXED */}
            <div 
              onClick={() => handleGameClick(games[6].route)}
              className={`relative bg-gradient-to-br ${games[6].gradient} rounded-2xl p-1 shadow-xl cursor-pointer active:scale-95 transform transition-all duration-300 hover:scale-105 hover:-translate-y-1`}
              style={{ 
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 10
              }}
            >
              <div className="bg-white/15 dark:bg-black/30 backdrop-blur-xl rounded-2xl h-32 md:h-40 flex items-center justify-center border-2 border-white/30 group-hover:border-white/60 transition-all duration-300">
                <h3 className="text-lg md:text-xl font-bold text-white drop-shadow-lg text-center px-4 leading-tight">
                  {games[6].name}
                </h3>
              </div>
            </div>

            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
                 style={{ 
                   boxShadow: "inset 0 0 40px rgba(255, 255, 255, 0.3)",
                   zIndex: 1 
                 }} />
          </div>
          <div /> {/* Empty */}
        </div>
      </div>

      {/* Starry Night - Dark Theme */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                opacity: Math.random() * 0.8 + 0.2,
              }}
            />
          ))}
        </div>
      )}

      {/* Sunlight & Sea Waves - Light Theme */}
      {!isDark && (
        <>
          <div className="fixed top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-yellow-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="fixed top-20 right-20 w-60 h-60 bg-yellow-200/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="fixed bottom-0 left-0 right-0 pointer-events-none overflow-hidden">
           <div className="fixed bottom-0 left-0 right-0 pointer-events-none overflow-hidden">
  <svg viewBox="0 0 1440 320" className="w-full">
    {/* Deep water layer - darker */}
    <path
      fill="rgba(14, 165, 233, 0.15)"
      d="M0,256L48,245.3C96,235,192,213,288,197.3C384,181,480,171,576,181.3C672,192,768,224,864,229.3C960,235,1056,213,1152,202.7C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      className="animate-wave-secondary"
    />

    {/* Middle layer - main waves */}
    <path
      fill="rgba(56, 189, 248, 0.3)"
      d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,170.7C672,160,768,160,864,170.7C960,181,1056,203,1152,197.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      className="animate-wave-primary animate-wave-float"
    />

    {/* Surface foam / highlight layer */}
    <path
      fill="rgba(255, 255, 255, 0.15)"
      d="M0,224L48,218.7C96,213,192,203,288,202.7C384,203,480,213,576,208C672,203,768,181,864,181.3C960,181,1056,203,1152,213.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      className="animate-wave-primary"
      style={{ animationDelay: "2s" }}
    />
  </svg>
</div>
          </div>
        </>
      )}

      {/* Add inline CSS for click fix */}
      <style>{`
        /* Force pointer events for game cards */
        .cursor-pointer {
          cursor: pointer !important;
          pointer-events: auto !important;
        }
        
        /* Fix for Tailwind border-3 class issue */
        .border-2 {
          border-width: 2px !important;
        }
        
        /* Active state for better feedback */
        .active\:scale-95:active {
          transform: scale(0.95) !important;
        }
      `}</style>
    </div>
  );
};

export default GameHub;