import React from "react";
import "./MathGame.css";

export default function MathGame() {
  // Array of floating math symbols and numbers
  const floatingElements = [
    "π", "∞", "√", "∫", "Σ", "sin", "cos", "tan", "log", "e^x",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
    "+", "-", "×", "÷", "=", "(", ")", "{", "}", "[",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a78bfa 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "'Poppins', system-ui, sans-serif",
        color: "white",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Floating Math Symbols Background - Safe within bounds */}
      {floatingElements.map((symbol, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            fontSize: `${Math.random() * 1.8 + 1.2}rem`,
            opacity: Math.random() * 0.4 + 0.15,
            color: "#e0e7ff",
            pointerEvents: "none",
            animation: `float ${Math.random() * 18 + 12}s linear infinite`,
            animationDelay: `${Math.random() * 10}s`,
            left: `${Math.random() * 90 + 5}vw`,  // Keep within 5%-95% width
            top: "-10vh",  // Start above screen
          }}
          className="float-animation"
        >
          {symbol}
        </div>
      ))}

      {/* Main Content - Centered and Responsive */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "90vw",
          width: "100%",
          padding: "1rem",
        }}
      >
        {/* Calculator Icon */}
        <div
          style={{
            fontSize: "clamp(5rem, 12vw, 8rem)",
            marginBottom: "1.5rem",
          }}
          className="pulse-glow"
        >
          🧮
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "clamp(3rem, 10vw, 5rem)",
            fontWeight: "900",
            margin: "0 0 1rem",
            background: "linear-gradient(90deg, #ffffff, #ddd6fe)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "1px",
            textShadow: "0 0 30px rgba(167, 139, 250, 0.6)",
          }}
        >
          MathGame
        </h1>

        {/* Coming Soon */}
        <p
          style={{
            fontSize: "clamp(2rem, 8vw, 3.5rem)",
            fontWeight: "800",
            margin: "1rem 0",
            color: "#fbbf24",
            textShadow: "0 0 20px rgba(251, 191, 36, 0.7)",
          }}
          className="bounce-animation"
        >
          COMING SOON...
        </p>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(1rem, 4vw, 1.6rem)",
            maxWidth: "700px",
            margin: "0 auto 2rem",
            opacity: 0.9,
            lineHeight: "1.7",
          }}
        >
          Sharpen your mind with exciting math puzzles, speed calculations, 
          trigonometry challenges, and brain-teasing equations! 🧠⚡
        </p>

        {/* Equation */}
        <p
          style={{
            fontSize: "clamp(1.2rem, 5vw, 2rem)",
            fontFamily: "monospace",
            opacity: 0.8,
            letterSpacing: "3px",
          }}
        >
          sin²θ + cos²θ = 1
        </p>
      </div>
    </div>
  );
}