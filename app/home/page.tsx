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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("fotos")
      .select("id, url")
      .eq("usuario_id", user.id)
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
          <p className="mensaje-carga">Aún no has subido fotos.</p>
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

      {/* Navbar inferior estilo Pinterest */}
      <nav className="navbar-inferior">
        <Link href="/home" className="nav-icon"><img src="../hogar.png" alt="" /></Link>

        <Link href="/images" className="nav-cruz">+</Link>

        <Link href="/search" className="nav-icon"><img src="../busqueda.png" alt="" /></Link>

        <Link href="/perfil" className="nav-icon"><img src="../usuario.png" alt="" /></Link>
      </nav>
    </div>
  );
}
