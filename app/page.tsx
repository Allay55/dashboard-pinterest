// app/page.tsx
"use client";

import LoginPage from "./login/page"; // importa tu login

export default function Home() {
  return <LoginPage />; // al iniciar, renderiza directamente el login
}
