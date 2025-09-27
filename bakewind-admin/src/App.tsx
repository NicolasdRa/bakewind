import { Router, Routes, Route } from "@solidjs/router";
import { Component } from "solid-js";

const App: Component = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" component={() => <div>BakeWind Admin Dashboard</div>} />
      </Routes>
    </Router>
  );
};

export default App;