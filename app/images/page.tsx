"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import "./Estilos.css";

export default function UploadImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [message, setMessage] = useState("");

  // Verifica que el usuario exista en la tabla "usuarios"
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

  // Maneja la subida de la imagen
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

    const fileExt = file.name.split(".").pop() ?? "png";
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;

    try {
      // Asegurar content-type correcto (opcional, supabase suele detectarlo)
      const contentType = file.type || `image/${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("imagenes")
        .upload(fileName, file, { upsert: true, contentType });

      if (uploadError) {
        console.log(uploadError);
        setMessage("Error al subir imagen: " + uploadError.message);
        return;
      }

      const { data: urlData } = await supabase.storage
        .from("imagenes")
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        console.log("Error obteniendo URL pública: respuesta vacía", urlData);
        setMessage("Error obteniendo URL pública.");
        return;
      }

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
    } catch (err: any) {
      console.error(err);
      setMessage("Ocurrió un error durante la subida.");
    }
  };

  return (
    <div className="upload-container">
      <h1 className="upload-title">Subir Imagen</h1>

      <div className="upload-form-wide">
        <div className="upload-columns-wide">
          <div className="upload-file-area">
            {/* Input que abre galería o explorador de archivos en móvil */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onClick={(e) => (e.currentTarget.value = "")}
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
        <Link href="/home" className="nav-icon">
          <img src="../hogar.png" alt="Inicio" />
        </Link>
        <Link href="/images" className="nav-cruz">+</Link>
        <Link href="/crudFoto" className="nav-icon">
          <img src="../busqueda.png" alt="Buscar" />
        </Link>
        <Link href="/perfil" className="nav-icon">
          <img src="../usuario.png" alt="Perfil" />
        </Link>
      </nav>
    </div>
  );
}