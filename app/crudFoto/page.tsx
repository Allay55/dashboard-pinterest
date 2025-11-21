"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import "./Estilos.css";

// Tipos
interface Usuario {
  id: string;
  email: string;
  password_hash: string;
  nombre: string | null;
  creado_en: string;
}

interface Foto {
  id: string;
  usuario_id: string;
  url: string;
  descripcion: string | null;
  creado_en: string;
}

interface Accion {
  id: string;
  usuario_id: string;
  accion: string;
  detalle: any;
  creado_en: string;
}

export default function AdminDashboard() {
  // ESTADOS
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [email, setEmail] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState("");

  // USUARIO PARA EDITAR DATOS
  const [usuarioSeleccionadoEditar, setUsuarioSeleccionadoEditar] = useState("");

  // USUARIO PARA SUBIR FOTO
  const [usuarioFoto, setUsuarioFoto] = useState("");

  // USUARIO PARA CAMBIAR CONTRASEÑA
  const [userPasswordID, setUserPasswordID] = useState("");

  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // CONTRASEÑA PROPIA
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  // CONTRASEÑA PARA OTRO USUARIO
  const [adminNuevaPass, setAdminNuevaPass] = useState("");
  const [adminConfirmPass, setAdminConfirmPass] = useState("");

  // Cargar datos
  const loadData = async () => {
    const { data: u } = await supabase.from("usuarios").select("*");
    const { data: f } = await supabase.from("fotos").select("*");
    const { data: a } = await supabase.from("acciones_usuarios").select("*");

    setUsuarios(u || []);
    setFotos(f || []);
    setAcciones(a || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ----------------------------------------------------
  //  EDITAR USUARIO
  // ----------------------------------------------------
  const handleEditarUsuario = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!usuarioSeleccionadoEditar)
      return setMessage("❌ Selecciona un usuario para editar");

    const { error } = await supabase
      .from("usuarios")
      .update({
        email,
        nombre: nombreUsuario,
      })
      .eq("id", usuarioSeleccionadoEditar);

    if (error) return setMessage("❌ Error editando usuario: " + error.message);

    setEmail("");
    setNombreUsuario("");
    setUsuarioSeleccionadoEditar("");

    setMessage("✅ Usuario editado correctamente");
    loadData();
  };

  // ----------------------------------------------------
  // CAMBIAR CONTRASEÑA PROPIA (auth)
  // ----------------------------------------------------
  const cambiarPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nuevaPassword || !confirmarPassword)
      return setMessage("❌ Completa ambos campos");

    if (nuevaPassword !== confirmarPassword)
      return setMessage("❌ Las contraseñas no coinciden");

    const { error } = await supabase.auth.updateUser({
      password: nuevaPassword,
    });

    if (error) return setMessage("❌ " + error.message);

    setNuevaPassword("");
    setConfirmarPassword("");

    setMessage("✅ Contraseña actualizada");
  };

  // ----------------------------------------------------
  // CAMBIAR CONTRASEÑA DE CUALQUIER USUARIO (ADMIN)
  // ----------------------------------------------------
  const cambiarPasswordDeUsuario = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!userPasswordID)
      return setMessage("❌ Selecciona un usuario");

    if (!adminNuevaPass || !adminConfirmPass)
      return setMessage("❌ Completa ambos campos");

    if (adminNuevaPass !== adminConfirmPass)
      return setMessage("❌ Las contraseñas no coinciden");

    const { error } = await supabase
      .from("usuarios")
      .update({ password_hash: adminNuevaPass })
      .eq("id", userPasswordID);

    if (error) return setMessage("❌ " + error.message);

    setAdminNuevaPass("");
    setAdminConfirmPass("");
    setUserPasswordID("");

    setMessage("✅ Contraseña del usuario actualizada");
    loadData();
  };

  // ----------------------------------------------------
  // ELIMINAR USUARIO
  // ----------------------------------------------------
  const eliminarUsuario = async (id: string) => {
    const { error } = await supabase.from("usuarios").delete().eq("id", id);
    if (error) return setMessage("❌ " + error.message);
    loadData();
  };

  // ----------------------------------------------------
  // SUBIR FOTO
  // ----------------------------------------------------
  const handleSubirFoto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) return setMessage("❌ Selecciona una imagen");
    if (!usuarioFoto)
      return setMessage("❌ Selecciona un usuario dueño de la foto");

    const filename = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("imagenes")
      .upload(filename, file);

    if (uploadError)
      return setMessage("❌ Error subiendo archivo: " + uploadError.message);

    const publicUrl =
      supabase.storage.from("imagenes").getPublicUrl(filename).data.publicUrl;

    const { error } = await supabase.from("fotos").insert([
      {
        url: publicUrl,
        descripcion,
        usuario_id: usuarioFoto,
      },
    ]);

    if (error) return setMessage("❌ Error registrando foto: " + error.message);

    setDescripcion("");
    setUsuarioFoto("");
    setFile(null);

    setMessage("✅ Foto subida correctamente");
    loadData();
  };

  const eliminarFoto = async (id: string, url: string) => {
    const fileName = url.split("/").pop()!;
    await supabase.storage.from("imagenes").remove([fileName]);
    await supabase.from("fotos").delete().eq("id", id);
    loadData();
  };

  // ----------------------------------------------------
  // CRUD ACCIONES
  // ----------------------------------------------------
  const eliminarAccion = async (id: string) => {
    await supabase.from("acciones_usuarios").delete().eq("id", id);
    loadData();
  };

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------
  return (
    <div className="p-6 pb-20 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard Admin</h1>

      {/* USUARIOS */}
      <h2 className="text-xl font-semibold">Editar Usuario</h2>

      <form
        onSubmit={handleEditarUsuario}
        className="flex flex-col gap-2 my-4 max-w-sm"
      >
        <select
          className="border p-2"
          value={usuarioSeleccionadoEditar}
          onChange={(e) => {
            setUsuarioSeleccionadoEditar(e.target.value);
            const u = usuarios.find((us) => us.id === e.target.value);
            if (u) {
              setEmail(u.email);
              setNombreUsuario(u.nombre ?? "");
            }
          }}
          required
        >
          <option value="">Seleccionar usuario</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>

        <input
          placeholder="Email"
          className="border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          placeholder="Nombre"
          className="border p-2"
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
        />

        <button className="bg-yellow-600 text-white p-2 rounded">
          Editar Usuario
        </button>
      </form>

      <ul>
        {usuarios.map((u) => (
          <li key={u.id} className="my-2">
            {u.email} — {u.nombre}
            <button
              className="ml-3 text-red-600"
              onClick={() => eliminarUsuario(u.id)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      {/* CAMBIAR CONTRASEÑA PROPIA */}
      <h2 className="text-xl font-semibold mt-10">Cambiar mi contraseña</h2>

      <form
        onSubmit={cambiarPassword}
        className="flex flex-col gap-2 my-4 max-w-sm"
      >
        <input
          type="password"
          placeholder="Nueva contraseña"
          className="border p-2"
          value={nuevaPassword}
          onChange={(e) => setNuevaPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          className="border p-2"
          value={confirmarPassword}
          onChange={(e) => setConfirmarPassword(e.target.value)}
        />

        <button className="bg-blue-600 text-white p-2 rounded">
          Cambiar contraseña
        </button>
      </form>

      {/* CAMBIAR CONTRASEÑA A OTRO USUARIO */}
      <h2 className="text-xl font-semibold mt-10">
        Cambiar contraseña de cualquier usuario
      </h2>

      <form
        onSubmit={cambiarPasswordDeUsuario}
        className="flex flex-col gap-2 my-4 max-w-sm"
      >
        <select
          className="border p-2"
          value={userPasswordID}
          onChange={(e) => setUserPasswordID(e.target.value)}
          required
        >
          <option value="">Seleccionar usuario</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>

        <input
          type="password"
          placeholder="Nueva contraseña"
          className="border p-2"
          value={adminNuevaPass}
          onChange={(e) => setAdminNuevaPass(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          className="border p-2"
          value={adminConfirmPass}
          onChange={(e) => setAdminConfirmPass(e.target.value)}
        />

        <button className="bg-purple-600 text-white p-2 rounded">
          Cambiar contraseña
        </button>
      </form>

      {/* SUBIR FOTO */}
      <h2 className="text-xl font-semibold mt-10">Agregar Foto</h2>

      <form
        onSubmit={handleSubirFoto}
        className="flex flex-col gap-2 my-4 max-w-sm"
      >
        <select
          className="border p-2"
          value={usuarioFoto}
          onChange={(e) => setUsuarioFoto(e.target.value)}
          required
        >
          <option value="">Seleccionar usuario</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />

        <input
          placeholder="Descripción"
          className="border p-2"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <button className="bg-green-600 text-white p-2 rounded">
          Subir Foto
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4">
        {fotos.map((f) => (
          <div key={f.id}>
            <Image src={f.url} width={200} height={200} alt="foto" />
            <p>{f.descripcion}</p>
            <button
              className="text-red-600"
              onClick={() => eliminarFoto(f.id, f.url)}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {/* ACCIONES */}
      <h2 className="text-xl font-semibold mt-10">Acciones Registradas</h2>

      <ul>
        {acciones.map((a) => (
          <li key={a.id} className="my-2">
            {a.accion} — usuario {a.usuario_id}
            <button
              className="ml-3 text-red-600"
              onClick={() => eliminarAccion(a.id)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      {/* NAVBAR INFERIOR */}
      <nav className="navbar-inferior">
        <Link href="/home" className="nav-icon">
          <img src="/hogar.png" alt="Inicio" />
        </Link>

        <Link href="/images" className="nav-cruz">+</Link>

        <Link href="/crudFoto" className="nav-icon">
          <img src="/busqueda.png" alt="Buscar" />
        </Link>

        <Link href="/perfil" className="nav-icon">
          <img src="/usuario.png" alt="Perfil" />
        </Link>
      </nav>

      {message && <p className="mt-6 text-center">{message}</p>}
    </div>
  );
}
