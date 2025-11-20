"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1️⃣ Login con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("❌ Credenciales incorrectas.");
      return;
    }

    const user = data.user;
    if (!user) {
      setMessage("⚠ No se pudo iniciar sesión.");
      return;
    }

    // 2️⃣ Registrar acción de login
    await supabase.from("acciones_usuarios").insert([
      {
        usuario_id: user.id,
        accion: "login",
        detalle: { navegador: navigator.userAgent },
      },
    ]);

    setMessage("✅ Login exitoso");
  };

  return (
    <div className="max-w-sm mx-auto mt-10 p-6 border rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4 text-center">Inicio de sesión</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <button className="bg-blue-600 text-white p-2 rounded">Entrar</button>
      </form>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
