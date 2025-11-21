"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";   // 👈 Importa el router
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import "./Estilos.css";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();   // 👈 Inicializa el router

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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

    await supabase.from("acciones_usuarios").insert([
      {
        usuario_id: user.id,
        accion: "login",
        detalle: { navegador: navigator.userAgent },
      },
    ]);

    setMessage("✅ Login exitoso");

    // 👇 Redirige al home
    router.push("/home");
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Inicio de sesión</h1>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />

        <button type="submit" className="login-button">
          Entrar
        </button>
      </form>

      {message && <p className="login-message">{message}</p>}
      {/* Link para registrarse */}
      <p className="login-register-link">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="login-register-anchor">
          Regístrate aquí
        </Link>
      </p>
    </div>
  );
}
