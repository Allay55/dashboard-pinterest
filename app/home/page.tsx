"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
    <div className="min-h-screen bg-red-600 p-6 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">Mis Fotos (Pinterest Style)</h1>

      {loading ? (
        <p className="text-center text-lg">Cargando imágenes...</p>
      ) : photos.length === 0 ? (
        <p className="text-center text-lg">Aún no has subido fotos.</p>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map((foto) => (
            <div
              key={foto.id}
              className="break-inside-avoid rounded-xl overflow-hidden shadow-xl"
            >
              <img src={foto.url} className="w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}