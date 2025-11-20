"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UploadImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [message, setMessage] = useState("");

  // ⬇️ SOLUCIÓN RÁPIDA: insertar usuario en la tabla si no existe
  const ensureUserExists = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    // si ya existe, no hacemos nada
    if (data) return true;

    // si no existe → lo insertamos
    const { error: insertErr } = await supabase.from("usuarios").insert([
      {
        id: userId,
        email,
        nombre: null,
      },
    ]);

    if (insertErr) {
      console.log("Error insertando usuario:", insertErr);
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Selecciona una imagen primero.");
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setMessage("Debes iniciar sesión para subir imágenes.");
      return;
    }

    // ⚡ SOLUCIÓN: aseguramos que el usuario EXISTA en la tabla usuarios
    const ok = await ensureUserExists(user.id, user.email ?? "");
    if (!ok) {
      setMessage("No se pudo registrar al usuario en BD.");
      return;
    }

    // ⬇️ Subir imagen al bucket
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("imagenes")
      .upload(fileName, file);

    if (uploadError) {
      console.log(uploadError);
      setMessage("Error al subir imagen: " + uploadError.message);
      return;
    }

    // ⬇️ Obtener URL pública
    const { data: urlData } = await supabase.storage
      .from("imagenes")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // ⬇️ Guardar registro en la tabla fotos
    const { error: insertError } = await supabase.from("fotos").insert([
      {
        usuario_id: user.id,
        url: publicUrl,
        descripcion,
      },
    ]);

    if (insertError) {
      console.log(insertError);
      setMessage("Error guardando datos: " + insertError.message);
      return;
    }

    setMessage("Imagen subida correctamente 🎉");
    setFile(null);
    setDescripcion("");
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-xl font-bold mb-4 text-center">
        Subir Imagen
      </h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="border p-2 w-full mb-3 rounded"
      />

      <input
        type="text"
        placeholder="Descripción (opcional)"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        className="border p-2 w-full mb-3 rounded"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white p-2 w-full rounded"
      >
        Subir Imagen
      </button>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
