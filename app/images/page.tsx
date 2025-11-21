"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import "./Estilos.css";

export default function UploadImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [message, setMessage] = useState("");

  const ensureUserExists = async (userId: string, email: string) => {
    const { data } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (data) return true;

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

    const ok = await ensureUserExists(user.id, user.email ?? "");
    if (!ok) {
      setMessage("No se pudo registrar al usuario en BD.");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("imagenes")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.log(uploadError);
      setMessage("Error al subir imagen: " + uploadError.message);
      return;
    }

    const { data: urlData } = await supabase.storage
      .from("imagenes")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

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
    <div className="upload-container">
      <h1 className="upload-title">Subir Imagen</h1>

      <div className="upload-form-wide">
        <div className="upload-columns-wide">
          <div className="upload-file-area">
            <input
              type="file"
              accept="image/*"
              capture="environment" // 👈 permite usar cámara en móviles
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="upload-input-file"
            />
          </div>

          <div className="upload-description-area">
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="upload-input-text"
            />
          </div>
        </div>

        <button onClick={handleUpload} className="upload-button">
          Subir Imagen
        </button>

        {message && <p className="upload-message">{message}</p>}
      </div>

      {/* Navbar inferior estilo Pinterest */}
      <nav className="navbar-inferior">
        <Link href="/home" className="nav-icon"><img src="../hogar.png" alt="Inicio" /></Link>
        <Link href="/images" className="nav-cruz">+</Link>
        <Link href="/search" className="nav-icon"><img src="../busqueda.png" alt="Buscar" /></Link>
        <Link href="/perfil" className="nav-icon"><img src="../usuario.png" alt="Perfil" /></Link>
      </nav>
    </div>
  );
}
