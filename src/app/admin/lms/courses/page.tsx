"use client";

import { useState } from "react";
import { Section } from "../../shared";

export const dynamic = "force-dynamic";

const TYPE_ICON = {
  video: "▶",
  text: "📄",
  file: "📁",
  quiz: "❓",
} as any;

type Lesson = {
  id: string;
  title: string;
  type: "video" | "text" | "file" | "quiz";
  duration?: string;
  youtubeId?: string;
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

type Course = {
  id: string;
  productId?: string;
  title: string;
  description: string;
  level: string;
  updatedAt: string;
  modules: Module[];
};

const initialCourses: Course[] = [
  {
    id: "cr1",
    productId: "p1",
    title: "Hermes Agent Course",
    description: "10 modul step-by-step membangun AI Agent untuk sales.",
    level: "Pemula - Pro",
    updatedAt: new Date().toISOString().slice(0, 10),
    modules: [
      {
        id: "m1",
        title: "Mindset & Pengenalan",
        lessons: [
          { id: "l1", title: "Mindset Using AI Agent", type: "video", duration: "12 menit", youtubeId: "M7lc1UVf-VE" },
          { id: "l2", title: "Intro ke AI Agent", type: "video", duration: "15 menit", youtubeId: "M7lc1UVf-VE" },
        ],
      },
    ],
  },
  {
    id: "cr2",
    productId: "p4",
    title: "Bundle Agent Kesehatan & Sales",
    description: "Hermes Health + Hermes Akuntansi lengkap.",
    level: "Menengah",
    updatedAt: new Date().toISOString().slice(0, 10),
    modules: [
      {
        id: "m4",
        title: "Hermes Health",
        lessons: [
          { id: "l11", title: "Pengingat & Pemantauan", type: "video", duration: "16 menit" },
        ],
      },
    ],
  },
];

function ModuleBlock({ course, onUpdate }: { course: Course; onUpdate: (c: Course) => void }) {
  const [open, setOpen] = useState<string | null>(course.modules[0]?.id ?? null);

  const addModule = () => {
    const newModule: Module = {
      id: `m_${Date.now()}`,
      title: "Modul Baru",
      lessons: [],
    };
    onUpdate({ ...course, modules: [...course.modules, newModule] });
  };

  const deleteModule = (moduleId: string) => {
    const updatedModules = course.modules.filter((m) => m.id !== moduleId);
    onUpdate({ ...course, modules: updatedModules });
    if (open === moduleId) setOpen(updatedModules[0]?.id ?? null);
  };

  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: `l_${Date.now()}`,
      title: "Lesson Baru",
      type: "video",
    };
    const updatedModules = course.modules.map((m) =>
      m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
    );
    onUpdate({ ...course, modules: updatedModules });
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    const updatedModules = course.modules.map((m) => {
      if (m.id !== moduleId) return m;
      return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) };
    });
    onUpdate({ ...course, modules: updatedModules });
  };

  const updateModuleTitle = (moduleId: string, title: string) => {
    const updatedModules = course.modules.map((m) => (m.id === moduleId ? { ...m, title } : m));
    onUpdate({ ...course, modules: updatedModules });
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    const updatedModules = course.modules.map((m) => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
      };
    });
    onUpdate({ ...course, modules: updatedModules });
  };

  return (
    <div className="space-y-[14px]">
      {course.modules.map((mod, mi) => (
        <div key={mod.id} className="border border-white/20 rounded-[12px] overflow-hidden bg-[#0A1D14]">
          <div
            className="w-full flex items-center gap-[12px] px-[18px] py-[16px] text-left cursor-pointer hover:bg-white/5"
            onClick={() => setOpen(open === mod.id ? null : mod.id)}
          >
            <span className="font-mono text-[11px] text-white/40">{String(mi + 1).padStart(2, "0")}</span>
            <input
              value={mod.title}
              onChange={(e) => updateModuleTitle(mod.id, e.target.value)}
              className="flex-1 bg-transparent text-white font-semibold text-[15px] border-b border-transparent hover:border-white/30 focus:border-[#00FF88] outline-none"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="font-mono text-[11.5px] text-white/40">{mod.lessons.length} lesson</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Hapus module ini?")) deleteModule(mod.id);
              }}
              className="ml-2 px-2 py-1 text-xs text-red-400 hover:bg-white/5 rounded"
            >
              Hapus
            </button>
          </div>
          {open === mod.id && (
            <div className="border-t border-white/10 px-[18px] py-[10px]">
              {mod.lessons.map((lesson) => (
                <div key={lesson.id} className="flex flex-col gap-2 py-[10px] border-b border-white/10 last:border-0">
                  <div className="flex items-center gap-[12px]">
                    <span className="text-[var(--color-green-dim)] flex-shrink-0">{TYPE_ICON[lesson.type] || "📄"}</span>
                    <input
                      value={lesson.title}
                      onChange={(e) => updateLesson(mod.id, lesson.id, { title: e.target.value })}
                      className="flex-1 bg-transparent text-white text-[14px] border-b border-transparent hover:border-white/30 focus:border-[#00FF88] outline-none"
                    />
                    <select
                      value={lesson.type}
                      onChange={(e) => updateLesson(mod.id, lesson.id, { type: e.target.value as any })}
                      className="bg-[#0A1D14] border border-white/20 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="video">video</option>
                      <option value="text">text</option>
                      <option value="file">file</option>
                      <option value="quiz">quiz</option>
                    </select>
                    <button
                      onClick={() => deleteLesson(mod.id, lesson.id)}
                      className="px-2 py-1 text-xs text-red-400 hover:bg-white/5 rounded"
                    >
                      Hapus
                    </button>
                  </div>
                  {lesson.type === "video" && (
                    <div className="flex gap-2 ml-8">
                      <input
                        placeholder="YouTube ID"
                        value={lesson.youtubeId || ""}
                        onChange={(e) => updateLesson(mod.id, lesson.id, { youtubeId: e.target.value })}
                        className="flex-1 bg-[#0A1D14] border border-white/20 rounded px-2 py-1 text-xs text-white"
                      />
                      <input
                        placeholder="Durasi"
                        value={lesson.duration || ""}
                        onChange={(e) => updateLesson(mod.id, lesson.id, { duration: e.target.value })}
                        className="w-24 bg-[#0A1D14] border border-white/20 rounded px-2 py-1 text-xs text-white"
                      />
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => addLesson(mod.id)}
                className="flex items-center gap-[8px] py-[12px] font-mono text-[12.5px] text-[#00FF88] hover:text-white cursor-pointer"
              >
                + Tambah Lesson
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addModule}
        className="w-full flex items-center justify-center gap-[8px] py-[14px] rounded-[12px] border border-dashed border-white/40 font-mono text-[13px] text-[#00FF88] hover:bg-white/5 cursor-pointer"
      >
        + Tambah Module
      </button>
    </div>
  );
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selected, setSelected] = useState(courses[0]?.id);

  const course = courses.find((c) => c.id === selected);

  const updateCourse = (updated: Course) => {
    setCourses(courses.map((c) => (c.id === updated.id ? updated : c)));
  };

  const addCourse = () => {
    const newCourse: Course = {
      id: `cr_${Date.now()}`,
      title: "Course Baru",
      description: "",
      level: "Pemula",
      updatedAt: new Date().toISOString().slice(0, 10),
      modules: [],
    };
    setCourses([...courses, newCourse]);
    setSelected(newCourse.id);
  };

  const deleteCourse = (courseId: string) => {
    if (!confirm("Hapus course ini?")) return;
    const filtered = courses.filter((c) => c.id !== courseId);
    setCourses(filtered);
    if (selected === courseId) {
      setSelected(filtered[0]?.id);
    }
  };

  return (
    <>
      <header className="scroll-mt-20 mb-6">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <p className="mt-0.5 text-sm text-white/45">Kelola courses, modules & lessons.</p>
      </header>
      <div className="flex gap-[10px] mb-[20px] flex-wrap">
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`px-[16px] py-[9px] rounded-full font-mono text-[12.5px] border cursor-pointer transition-colors ${
              selected === c.id
                ? "text-[#00FF88] border-[#00FF88] bg-[rgba(0,255,136,0.06)]"
                : "text-white/60 border-white/20 hover:text-white"
            }`}
          >
            {c.title}
          </button>
        ))}
        <button
          onClick={addCourse}
          className="px-[16px] py-[9px] rounded-full font-mono text-[12.5px] border border-[#00FF88] text-[#00FF88] hover:bg-[rgba(0,255,136,0.06)]"
        >
          + Tambah Course
        </button>
      </div>

      {course && (
        <div className="space-y-4">
          <div className="panel p-5 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="panel-title">Edit Course</h2>
              <button
                onClick={() => deleteCourse(course.id)}
                className="px-3 py-1.5 text-xs text-red-400 border border-red-400/30 rounded hover:bg-red-400/10"
              >
                Hapus Course
              </button>
            </div>
            <div>
              <label className="text-xs text-white/45">Judul Course</label>
              <input
                value={course.title}
                onChange={(e) => updateCourse({ ...course, title: e.target.value })}
                className="input-dark mt-1 w-full"
              />
            </div>
            <div>
              <label className="text-xs text-white/45">Deskripsi</label>
              <textarea
                value={course.description}
                onChange={(e) => updateCourse({ ...course, description: e.target.value })}
                className="input-dark mt-1 w-full h-20"
              />
            </div>
            <div>
              <label className="text-xs text-white/45">Level</label>
              <input
                value={course.level}
                onChange={(e) => updateCourse({ ...course, level: e.target.value })}
                className="input-dark mt-1 w-full"
              />
            </div>
          </div>
          <ModuleBlock course={course} onUpdate={updateCourse} />
        </div>
      )}
    </>
  );
}
