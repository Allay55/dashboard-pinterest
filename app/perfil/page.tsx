"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./Estilos.css";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

export default function UsuarioPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nombre, setNombre] = useState<string>("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const fetchUsuario = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMensaje("⚠️ No hay usuario logueado");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre, email")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ Error al cargar usuario:", error.message);
        setMensaje("❌ No se encontró el usuario");
        setUsuario(null);
      } else if (data) {
        setUsuario(data as Usuario);
        setNombre((data as Usuario).nombre);
        setMensaje(null);
      }
    } catch (err) {
      console.error("❌ Error inesperado al cargar usuario:", err);
      setMensaje("❌ Error inesperado al cargar datos");
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!usuario) return;

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ nombre })
        .eq("id", usuario.id);

      if (error) {
        setMensaje("❌ Error al actualizar: " + error.message);
      } else {
        setMensaje("✅ Datos actualizados correctamente");
        await fetchUsuario();
      }
    } catch (err) {
      console.error("❌ Error inesperado al actualizar:", err);
      setMensaje("❌ Error inesperado al actualizar");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    fetchUsuario();
  }, []);

  if (loading) return <p className="text-center">⏳ Cargando...</p>;

  return (
    <>
      <div className="perfil-container">
        <h1 className="perfil-title">Mi Perfil</h1>

        {usuario ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              required
              className="perfil-input"
            />

            <input
              type="email"
              value={usuario.email}
              readOnly
              className="perfil-input readonly"
            />

            <button type="submit" className="perfil-button">
              Guardar cambios
            </button>
          </form>
        ) : (
          <p className="perfil-message">{mensaje}</p>
        )}

        {mensaje && <p className="perfil-message">{mensaje}</p>}

        <button onClick={handleLogout} className="perfil-logout">
          Cerrar sesión
        </button>
      </div>

      {/* ✅ Navbar inferior estilo Pinterest */}
      <nav className="navbar-inferior">
        <Link href="/home" className="nav-icon">
          <img src="../hogar.png" alt="Inicio" />
        </Link>

        <Link href="/images" className="nav-cruz">+</Link>

        <Link href="/search" className="nav-icon">
          <img src="../busqueda.png" alt="Buscar" />
        </Link>

        <Link href="/perfil" className="nav-icon">
          <img src="../usuario.png" alt="Perfil" />
        </Link>
      </nav>
    </>
  );
}
