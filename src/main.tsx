import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/geist";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./index.css";
import App from "./App.tsx";
import StatsPage from "./stats-page.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {location.pathname === "/stats" ? <StatsPage /> : <App />}
    {/* Vercel Web Analytics: page views, no cookies. */}
    <Analytics />
  </StrictMode>,
);
