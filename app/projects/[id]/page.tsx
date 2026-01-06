"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ProjectImage = {
  id: string;
  reference?: string;
  asin?: string;
  index?: number;
  url?: string;
};

const IMAGES_PER_ROW = 6;

export default function ProjectGalleryPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [images, setImages] = useState<ProjectImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const res = await fetch(
          `/api/projects/images?projectId=${projectId}`
        );
        const data = await res.json();
        setImages(data.images || []);
      } catch (err) {
        console.error("Error cargando imágenes", err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [projectId]);

  if (loading) {
    return <p style={{ padding: 40 }}>Cargando imágenes…</p>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <button
        onClick={() => router.push("/projects")}
        style={{
          margin: 20,
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        ← Volver a proyectos
      </button>

      <h1
        style={{
          fontFamily: "DM Serif Display",
          fontSize: 34,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Imágenes del proyecto
      </h1>

      <p style={{ textAlign: "center", marginBottom: 20 }}>
        Total: {images.length}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${IMAGES_PER_ROW}, 1fr)`,
          gap: 18,
          padding: 36,
        }}
      >
        {images.map((img) => (
          <div
            key={img.id}
            style={{
              background: "#f2f2f2",
              borderRadius: 16,
              height: 240,
              overflow: "hidden",
            }}
          >
            {img.url && (
              <img
                src={img.url}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
