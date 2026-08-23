import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>✅ MBG BERHASIL TAMPIL</h1>
      <p>React dan Vercel sudah berjalan.</p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
