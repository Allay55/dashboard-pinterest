"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import "./Estilos.css";

export default function UploadImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

    const fileExt = file.name.split('.').pop() ?? 'png';
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('imagenes')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.log(uploadError);
        setMessage('Error al subir imagen: ' + uploadError.message);
        return;
      }

      const { data } = await supabase.storage.from('imagenes').getPublicUrl(fileName);

      if (!data || !data.publicUrl) {
        console.log('Error obteniendo URL pública:', data);
        setMessage('Error obteniendo URL pública.');
        return;
      }

      const publicUrl = data.publicUrl;

      const { error: insertError } = await supabase.from('fotos').insert([
        {
          usuario_id: user.id,
          url: publicUrl,
          descripcion,
        },
      ]);

      if (insertError) {
        console.log(insertError);
        setMessage('Error guardando datos: ' + insertError.message);
        return;
      }

      setMessage('Imagen subida correctamente 🎉');
      setFile(null);
      setDescripcion('');
      // limpiar input file si existe
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      setMessage('Ocurrió un error durante la subida.');
    }
  };

  return (
    <div className="upload-container">
      <h1 className="upload-title">Subir Imagen</h1>

      <div className="upload-form-wide">
        <div className="upload-columns-wide">
          {/* Input oculto */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            capture="environment"
            onClick={() => {
              // Permitir seleccionar la misma imagen otra vez
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          {/* Botón que abre el explorador/galería */}
          <button
            className="upload-select-button"
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = "";
              fileInputRef.current?.click();
            }}
          >
            Seleccionar Imagen
          </button>

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
        <Link href="/crudFoto" className="nav-icon"><img src="../busqueda.png" alt="Buscar" /></Link>
        <Link href="/perfil" className="nav-icon"><img src="../usuario.png" alt="Perfil" /></Link>
      </nav>
    </div>
  );
}