"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import "./Estilos.css"; // Importación del CSS

export default function RegisterPage() {
  const [nombre, setNombre] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setMessage("❌ Error en registro: " + authError.message);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setMessage("⚠ No se pudo obtener el ID del usuario.");
      return;
    }

    const { error: insertError } = await supabase.from("usuarios").insert([
      {
        id: userId,
        email,
        password_hash: password, // ⚠ lo ideal: encriptar con bcrypt
        nombre,
      },
    ]);

    if (insertError) {
      setMessage(
        "⚠ Usuario autenticado pero no guardado en la tabla: " +
          insertError.message
      );
      return;
    }

    await supabase.from("acciones_usuarios").insert([
      {
        usuario_id: userId,
        accion: "registro",
        detalle: { email },
      },
    ]);

    setMessage("✅ Usuario registrado correctamente. Revisa tu correo.");
  };

  return (
    <div className="register-container">
      <h1 className="register-title">Crear nueva cuenta</h1>

      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="register-input"
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="register-input"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="register-input"
        />

        <button type="submit" className="register-button">
          Registrarse
        </button>
      </form>

      {message && <p className="register-message">{message}</p>}
    </div>
  );
}