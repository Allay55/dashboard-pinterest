"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import "./Estilos.css";

export default function HomePage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);

    // Obtener usuario logueado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // 🔥 OBTENER TODAS LAS FOTOS DE TODOS LOS USUARIOS
    const { data, error } = await supabase
      .from("fotos")
      .select("id, url, descripcion, usuario_id, creado_en")
      .order("creado_en", { ascending: false });

    if (!error && data) setPhotos(data);

    setLoading(false);
  };

  return (
    <div className="home-container">
      {/* Menú de categorías */}
      <div className="categorias-menu">
        <button className="categoria-btn">Fondos</button>
        <button className="categoria-btn">Para ti</button>
        <button className="categoria-btn">Imágenes</button>
        <button className="categoria-btn">Favoritos</button>
      </div>

      {/* Galería estilo Pinterest */}
      {loading ? (
        <div className="mensaje-wrapper">
          <p className="mensaje-carga">Cargando imágenes...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="mensaje-wrapper">
          <p className="mensaje-carga">No hay fotos disponibles.</p>
        </div>
      ) : (
        <div className="pinterest-grid">
          {photos.map((foto) => (
            <div key={foto.id} className="grid-item">
              <img src={foto.url} alt="foto subida" className="imagen-item" />
            </div>
          ))}
        </div>
      )}

      {/* Navbar inferior */}
      <nav className="navbar-inferior">
        <Link href="/home" className="nav-icon">
          <img src="../hogar.png" alt="home" />
        </Link>

        <Link href="/images" className="nav-cruz">
          +
        </Link>

        <Link href="/crudFoto" className="nav-icon">
          <img src="../busqueda.png" alt="buscar" />
        </Link>

        <Link href="/perfil" className="nav-icon">
          <img src="../usuario.png" alt="perfil" />
        </Link>
      </nav>
    </div>
  );
}