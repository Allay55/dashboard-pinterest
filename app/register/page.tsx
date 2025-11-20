"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  // Estados tipados (igual que tu ejemplo)
  const [nombre, setNombre] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  // Función de registro
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1️⃣ Registrar usuario en Supabase Auth
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

    // 2️⃣ Insertar en tabla usuarios (tu tabla personalizada)
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

    // 3️⃣ Registrar acción
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
    <div className="max-w-sm mx-auto mt-10 p-6 border rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4 text-center">
        Crear nueva cuenta
      </h1>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        {/* Nombre */}
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="border p-2 rounded"
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 rounded"
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <button className="bg-blue-600 text-white p-2 rounded">
          Registrarse
        </button>
      </form>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
