"use client";

import { TopBar } from "./top-bar";
import { TendersRail } from "./tenders-rail";
import { MainPanel } from "./main-panel";
import { ChatBar } from "./chat-bar";

export function Cockpit() {
  return (
    <div
      className="font-te-sans"
      style={{
        width: "100vw",
        height: "100vh",
        minHeight: 900,
        background: "var(--te-bg)",
        color: "var(--te-ink)",
        fontSize: 13,
        display: "grid",
        gridTemplateColumns: "248px 1fr",
        gridTemplateRows: "56px 1fr 52px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <TopBar />
      <TendersRail />
      <MainPanel />
      <ChatBar />
    </div>
  );
}
