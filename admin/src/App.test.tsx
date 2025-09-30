// Minimal test to verify Solid.js is working
import { Component } from "solid-js";

const AppTest: Component = () => {
  return (
    <div style={{
      "min-height": "100vh",
      "display": "flex",
      "align-items": "center",
      "justify-content": "center",
      "background-color": "#f5f5f5"
    }}>
      <div style={{
        "padding": "2rem",
        "background": "white",
        "border-radius": "8px",
        "box-shadow": "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ "color": "#333", "margin-bottom": "1rem" }}>
          BakeWind Admin - Test
        </h1>
        <p style={{ "color": "#666" }}>
          If you can see this, Solid.js is working!
        </p>
        <p style={{ "color": "#999", "font-size": "0.875rem", "margin-top": "1rem" }}>
          Running on port 3001
        </p>
      </div>
    </div>
  );
};

export default AppTest;