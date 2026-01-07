"use client";

import { useEffect, useState, useCallback } from "react";
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

  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);

  /* ======================================================
     CARGA INICIAL (SOLO UNA VEZ)
  ====================================================== */
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/projects/list", { cache: "no-store" });
      const data = await res.json();

      if (!data.projects) {
        setProjects([]);
        return;
      }

      const withCounts = await Promise.all(
        data.projects.map(async (project: Project) => {
          try {
            const res = await fetch(
              `/api/projects/images?projectId=${project.id}`,
              { cache: "no-store" }
            );
            const imgs = await res.json();

            return {
              ...project,
              imagesCount: imgs.images?.length || 0,
            };
          } catch {
            return { ...project, imagesCount: 0 };
          }
        })
      );

      setProjects(withCounts);
    } catch (err) {
      console.error("Error cargando proyectos", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  /* ======================================================
     CREAR PROYECTO (OPTIMISTIC UI)
  ====================================================== */
  const createProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;

    // 1️⃣ Crear proyecto temporal en UI
    const tempId = crypto.randomUUID();
    const tempProject: Project = {
      id: tempId,
      name,
      imagesCount: 0,
    };

    setProjects((prev) => [tempProject, ...prev]);
    setNewProjectName("");

    try {
      // 2️⃣ Crear en backend
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!data.project) throw new Error("Error creando proyecto");

      // 3️⃣ Reemplazar temp por real
      setProjects((prev) =>
        prev.map((p) =>
          p.id === tempId ? { ...data.project, imagesCount: 0 } : p
        )
      );
    } catch (err) {
      console.error(err);
      // rollback
      setProjects((prev) => prev.filter((p) => p.id !== tempId));
      alert("Error creando proyecto");
    }
  };

  /* ======================================================
     RENOMBRAR (SOLO UI)
  ====================================================== */
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

  /* ======================================================
     ELIMINAR PROYECTO (OPTIMISTIC UI)
  ====================================================== */
  const deleteProject = async (id: string) => {
    const ok = confirm("¿Estás seguro que deseas eliminar el proyecto?");
    if (!ok) return;

    // 1️⃣ Quitar de UI al instante
    const backup = projects;
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch("/api/projects/delete-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      });

      const data = await res.json();
      if (!data.success) throw new Error("Error eliminando proyecto");
    } catch (err) {
      console.error(err);
      // rollback
      setProjects(backup);
      alert("Error eliminando proyecto");
    }
  };

  /* ======================================================
     UI
  ====================================================== */
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Cargando proyectos…
      </div>
    );
  }

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

      {projects.length === 0 && (
        <p style={{ textAlign: "center", opacity: 0.6 }}>
          No hay proyectos todavía
        </p>
      )}

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

