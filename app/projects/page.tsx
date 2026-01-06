"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ======================================================
   TIPOS
====================================================== */
type Project = {
  id: string;
  name: string;
  imagesCount: number;
};

export default function ProjectsPage() {
  const router = useRouter();

  /* ======================================================
     ESTADO PROYECTOS
  ====================================================== */
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "51155ece-583e-4b4c-a9de-dea373acaa2a", // ✅ ID CORRECTO
      name: "JATA ELECTRODOMÉSTICOS",
      imagesCount: 0,
    },
  ]);

  const [newProjectName, setNewProjectName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  /* ======================================================
     CRUD PROYECTOS (UI ONLY)
  ====================================================== */
  const createProject = () => {
    if (!newProjectName.trim()) return;

    setProjects((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newProjectName.trim(),
        imagesCount: 0,
      },
    ]);

    setNewProjectName("");
  };

  const saveProjectName = (id: string) => {
    if (!editingName.trim()) {
      setEditingProjectId(null);
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name: editingName.trim() } : p
      )
    );

    setEditingProjectId(null);
    setEditingName("");
  };

  const deleteProject = (id: string) => {
    const ok = confirm("¿Estás seguro que deseas eliminar el proyecto?");
    if (!ok) return;

    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  /* ======================================================
     UI
  ====================================================== */
  return (
    <div style={{ minHeight: "100vh", background: "#fff", padding: 40 }}>
      <h1
        style={{
          fontFamily: "DM Serif Display",
          fontSize: 34,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Proyectos
      </h1>

      <div
        style={{
          maxWidth: 420,
          margin: "0 auto 30px",
          display: "flex",
          gap: 10,
        }}
      >
        <input
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="Nombre del proyecto"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={createProject}
          className="btn-zoom"
          style={{
            background: "#ff6b6b",
            color: "#fff",
            borderRadius: 10,
            padding: "0 18px",
          }}
        >
          Crear
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => router.push(`/projects/${project.id}`)}
            className="btn-zoom"
            style={{
              background: "#ff6b6b",
              color: "#fff",
              borderRadius: 16,
              padding: 18,
              cursor: "pointer",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                display: "flex",
                gap: 8,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                onClick={() => {
                  setEditingProjectId(project.id);
                  setEditingName(project.name);
                }}
                style={{ cursor: "pointer" }}
              >
                ✏️
              </span>
              <span
                onClick={() => deleteProject(project.id)}
                style={{ cursor: "pointer" }}
              >
                ✕
              </span>
            </div>

            {editingProjectId === project.id ? (
              <input
                value={editingName}
                autoFocus
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => saveProjectName(project.id)}
                onKeyDown={(e) =>
                  e.key === "Enter" && saveProjectName(project.id)
                }
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            ) : (
              <h2
                style={{
                  fontFamily: "DM Serif Display",
                  fontSize: 20,
                  marginBottom: 6,
                }}
              >
                {project.name}
              </h2>
            )}

            <p style={{ fontSize: 13, opacity: 0.9 }}>
              {project.imagesCount} imágenes
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
