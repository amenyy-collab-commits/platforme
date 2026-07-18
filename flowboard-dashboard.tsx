"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckSquare2,
  ChevronDown,
  Circle,
  Clock3,
  Command,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Users2,
  X,
  Zap,
} from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

export type ProjectData = {
  id: number;
  name: string;
  description: string;
  color: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
};

export type TaskData = {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initialProjects: ProjectData[];
  initialTasks: TaskData[];
};

type NavKey = "overview" | "tasks" | "calendar" | "team";

const avatarColors = [
  "bg-[#e4ddff] text-[#6554c0]",
  "bg-[#d9f5ec] text-[#16886f]",
  "bg-[#ffe9d2] text-[#b66718]",
  "bg-[#ffe0e8] text-[#b64d69]",
  "bg-[#dcecff] text-[#3172b7]",
];

const assignees = [
  "Alex Morgan",
  "Sofia Chen",
  "Jamie Bell",
  "Maya Patel",
  "Noah Williams",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function nameColor(name: string) {
  const total = [...name].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  return avatarColors[total % avatarColors.length];
}

function formatDate(value: string | null, short = false) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-US", {
    month: short ? "short" : "long",
    day: "numeric",
  }).format(new Date(value));
}

function daysUntil(value: string | null) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(value).getTime() - today.getTime()) / 86_400_000);
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      className={`${small ? "h-7 w-7 text-[9px]" : "h-9 w-9 text-[11px]"} ${nameColor(name)} inline-grid shrink-0 place-items-center rounded-full font-bold ring-2 ring-white`}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[#6556e8] text-white shadow-[0_7px_20px_rgba(101,86,232,0.28)]">
        <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white/25" />
        <Zap className="relative h-[18px] w-[18px] fill-current" strokeWidth={2.4} />
      </div>
      <span className="text-[21px] font-extrabold tracking-[-0.04em] text-[#18212f]">flowboard</span>
    </div>
  );
}

function ModalShell({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#131927]/45 p-4 backdrop-blur-[3px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-in w-full max-w-[520px] overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_rgba(20,25,40,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#edf0f5] px-7 py-6">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#18212f]">{title}</h2>
            <p className="mt-1 text-sm text-[#7c8799]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-[#8b95a7] transition hover:bg-[#f1f3f7] hover:text-[#253044]"
            aria-label="Close dialog"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function FlowboardDashboard({ initialProjects, initialTasks }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeNav, setActiveNav] = useState<NavKey>("overview");
  const [selectedProject, setSelectedProject] = useState<number | "all">("all");
  const [taskStatus, setTaskStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [taskModal, setTaskModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const completed = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "in-progress").length;
  const dueSoon = tasks.filter((task) => {
    const days = daysUntil(task.dueDate);
    return task.status !== "done" && days !== null && days >= 0 && days <= 3;
  }).length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const filteredProjects = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term),
    );
  }, [projects, query]);

  const filteredTasks = useMemo(() => {
    const term = query.toLowerCase().trim();
    return tasks.filter((task) => {
      const project = projects.find((item) => item.id === task.projectId);
      const matchesQuery =
        !term ||
        task.title.toLowerCase().includes(term) ||
        task.assignee.toLowerCase().includes(term) ||
        project?.name.toLowerCase().includes(term);
      const matchesProject = selectedProject === "all" || task.projectId === selectedProject;
      const matchesStatus = taskStatus === "all" || task.status === taskStatus;
      return matchesQuery && matchesProject && matchesStatus;
    });
  }, [projects, query, selectedProject, taskStatus, tasks]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  function goTo(nav: NavKey) {
    setActiveNav(nav);
    setMobileNav(false);
    if (nav === "tasks") {
      window.setTimeout(() => document.getElementById("tasks")?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    if (nav === "calendar") showToast("Calendar view is synced with task deadlines.");
    if (nav === "team") showToast("Your workspace has 5 active members.");
  }

  function focusProject(id: number) {
    setSelectedProject(id);
    setActiveNav("tasks");
    window.setTimeout(() => document.getElementById("tasks")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function updateStatus(task: TaskData) {
    const nextStatus = task.status === "done" ? "todo" : "done";
    const previous = tasks;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)),
    );

    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!response.ok) {
      setTasks(previous);
      showToast("Could not update that task.");
      return;
    }
    showToast(nextStatus === "done" ? "Task marked complete." : "Task moved back to to-do.");
  }

  async function deleteTask(id: number) {
    const previous = tasks;
    setTasks((current) => current.filter((task) => task.id !== id));
    const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setTasks(previous);
      showToast("Could not remove that task.");
      return;
    }
    showToast("Task removed.");
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      showToast(result.error ?? "Could not create task.");
      return;
    }
    setTasks((current) => [...current, result as TaskData]);
    setTaskModal(false);
    showToast("Task created successfully.");
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      showToast(result.error ?? "Could not create project.");
      return;
    }
    setProjects((current) => [...current, result as ProjectData]);
    setProjectModal(false);
    showToast("Project created successfully.");
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#202a3a]">
      {mobileNav && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-[#172033]/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[246px] flex-col border-r border-[#e9edf3] bg-white transition-transform duration-300 lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[76px] items-center justify-between px-6">
          <Logo />
          <button className="text-[#9aa3b2] lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <button className="flex w-full items-center gap-3 rounded-xl border border-[#e8ebf1] p-2.5 text-left transition hover:bg-[#fafbfc]">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#efeaff] text-[#6556e8]">
              <Command className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] text-[#9aa3b1]">Workspace</span>
              <span className="block truncate text-[13px] font-semibold text-[#293346]">Acme Studio</span>
            </span>
            <ChevronDown className="h-4 w-4 text-[#9ba4b2]" />
          </button>
        </div>

        <nav className="mt-7 px-3" aria-label="Main navigation">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#b0b7c2]">Workspace</p>
          {[
            { key: "overview" as const, label: "Overview", icon: LayoutDashboard },
            { key: "tasks" as const, label: "My tasks", icon: CheckSquare2, count: tasks.filter((task) => task.status !== "done").length },
            { key: "calendar" as const, label: "Calendar", icon: CalendarDays },
            { key: "team" as const, label: "Team", icon: Users2 },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => goTo(key)}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${activeNav === key ? "bg-[#eeeaff] text-[#6556e8]" : "text-[#687386] hover:bg-[#f6f7fa] hover:text-[#2c3647]"}`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={activeNav === key ? 2.4 : 2} />
              <span className="flex-1 text-left">{label}</span>
              {count ? (
                <span className="grid min-w-5 place-items-center rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-[#6556e8]">{count}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="mt-7 min-h-0 flex-1 px-3">
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b0b7c2]">Projects</p>
            <button onClick={() => setProjectModal(true)} className="text-[#9da6b5] transition hover:text-[#6556e8]" aria-label="Add project">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[30vh] overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => focusProject(project.id)}
                className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition hover:bg-[#f6f7fa] ${selectedProject === project.id ? "bg-[#f6f4ff] text-[#5144c6]" : "text-[#667184]"}`}
              >
                <span className="h-2.5 w-2.5 rounded-[4px]" style={{ backgroundColor: project.color }} />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="m-4 rounded-2xl bg-[#f7f8fb] p-3.5">
          <div className="flex items-center gap-3">
            <Avatar name="Alex Morgan" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-[#2b3444]">Alex Morgan</p>
              <p className="truncate text-[11px] text-[#929aa8]">Product designer</p>
            </div>
            <button aria-label="Open settings" className="text-[#9aa3b2] transition hover:text-[#5d50d4]">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[246px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center border-b border-[#e9edf3] bg-white/95 px-4 backdrop-blur-lg sm:px-7 lg:px-9">
          <button onClick={() => setMobileNav(true)} className="mr-3 grid h-10 w-10 place-items-center rounded-xl text-[#687386] hover:bg-[#f2f4f7] lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative max-w-[460px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#9ca5b3]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects, tasks, or people..."
              className="h-10 w-full rounded-xl bg-[#f5f6f8] pl-10 pr-16 text-[13px] text-[#30394a] outline-none ring-[#dcd7ff] transition placeholder:text-[#9ca5b3] focus:bg-white focus:ring-2"
            />
            <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#e1e4ea] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#9aa3b1] sm:block">⌘ K</span>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button onClick={() => showToast("You’re all caught up!")} className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#e8ebf0] text-[#697487] transition hover:border-[#d8d2ff] hover:bg-[#f8f7ff] hover:text-[#6556e8]" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ec6684] ring-2 ring-white" />
            </button>
            <div className="hidden h-7 w-px bg-[#eaedf2] sm:block" />
            <button className="hidden items-center gap-2.5 sm:flex">
              <Avatar name="Alex Morgan" />
              <ChevronDown className="h-4 w-4 text-[#9aa3b1]" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
          <section className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-[#8c96a6]">
                <Sparkles className="h-3.5 w-3.5 text-[#f1aa44]" /> Monday, June 22
              </p>
              <h1 className="text-[28px] font-extrabold tracking-[-0.04em] text-[#18212f] sm:text-[32px]">
                Good morning, Alex <span className="inline-block origin-bottom-right animate-[wave_2.5s_ease-in-out_infinite]">👋</span>
              </h1>
              <p className="mt-1.5 text-[13px] text-[#7d8797] sm:text-sm">Here&apos;s what&apos;s happening with your projects today.</p>
            </div>
            <button onClick={() => setTaskModal(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6556e8] px-5 text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(101,86,232,0.24)] transition hover:-translate-y-0.5 hover:bg-[#5849db] hover:shadow-[0_14px_28px_rgba(101,86,232,0.3)] active:translate-y-0">
              <Plus className="h-[17px] w-[17px]" strokeWidth={2.6} /> New task
            </button>
          </section>

          <section className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4" aria-label="Workspace summary">
            {[
              { label: "Active projects", value: projects.length, note: "+1 this month", icon: FolderKanban, color: "#6556e8", bg: "#eeeaff" },
              { label: "Tasks in progress", value: inProgress, note: `${tasks.length - completed} tasks open`, icon: Clock3, color: "#e49229", bg: "#fff2df" },
              { label: "Completed tasks", value: completed, note: `${completionRate}% completion`, icon: CheckSquare2, color: "#169777", bg: "#ddf6ee" },
              { label: "Due this week", value: dueSoon, note: dueSoon ? "Needs your focus" : "All clear", icon: Target, color: "#d95776", bg: "#ffe5eb" },
            ].map(({ label, value, note, icon: Icon, color, bg }) => (
              <article key={label} className="group rounded-2xl border border-[#e9edf3] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#ddd9fa] hover:shadow-[0_12px_35px_rgba(41,49,69,0.07)] sm:p-5">
                <div className="mb-4 flex items-start justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: bg, color }}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#c1c7d0] transition group-hover:text-[#6556e8]" />
                </div>
                <p className="text-2xl font-extrabold tracking-[-0.04em] text-[#222c3b]">{value}</p>
                <div className="mt-1 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                  <p className="text-[11px] font-semibold text-[#697486] sm:text-[12px]">{label}</p>
                  <p className="hidden text-[10px] text-[#9aa3b2] sm:block">{note}</p>
                </div>
              </article>
            ))}
          </section>

          <div className="mb-7 grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.7fr)]">
            <section className="rounded-[20px] border border-[#e8ecf2] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-extrabold tracking-[-0.025em] text-[#222b3a]">Project overview</h2>
                  <p className="mt-0.5 text-[11px] text-[#929baa]">Track progress across your active work</p>
                </div>
                <button onClick={() => { setSelectedProject("all"); goTo("tasks"); }} className="flex items-center gap-1 text-[11px] font-bold text-[#6556e8] transition hover:gap-2">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {filteredProjects.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredProjects.slice(0, 4).map((project) => {
                    const projectTasks = tasks.filter((task) => task.projectId === project.id);
                    const done = projectTasks.filter((task) => task.status === "done").length;
                    const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
                    const people = [...new Set(projectTasks.map((task) => task.assignee))].slice(0, 3);
                    return (
                      <button key={project.id} onClick={() => focusProject(project.id)} className="group rounded-2xl border border-[#ebedf2] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#dcd7ff] hover:shadow-[0_10px_25px_rgba(43,50,70,0.06)] sm:p-[18px]">
                        <div className="flex items-start justify-between">
                          <span className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm" style={{ backgroundColor: project.color }}>
                            <FolderKanban className="h-[18px] w-[18px]" />
                          </span>
                          <MoreHorizontal className="h-[18px] w-[18px] text-[#abb3bf] transition group-hover:text-[#6556e8]" />
                        </div>
                        <h3 className="mt-4 truncate text-[14px] font-bold text-[#293244]">{project.name}</h3>
                        <p className="mt-1 line-clamp-1 text-[11px] text-[#8d96a5]">{project.description || "A new workspace project."}</p>
                        <div className="mt-4 flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-[#7a8495]">Progress</span>
                          <span className="font-bold text-[#455064]">{progress}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef0f4]">
                          <span className="block h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex -space-x-1.5">
                            {people.length ? people.map((person) => <Avatar key={person} name={person} small />) : <span className="text-[10px] text-[#a0a8b4]">No members</span>}
                          </div>
                          <span className="flex items-center gap-1 text-[10px] font-medium text-[#8791a1]">
                            <CalendarDays className="h-3 w-3" /> {formatDate(project.dueDate, true)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#dfe3ea] bg-[#fafbfc] text-center">
                  <div><Search className="mx-auto mb-2 h-5 w-5 text-[#adb5c1]" /><p className="text-xs font-semibold text-[#717c8e]">No projects match your search</p></div>
                </div>
              )}
            </section>

            <section className="relative overflow-hidden rounded-[20px] border border-[#e8ecf2] bg-white p-5 sm:p-6">
              <div className="absolute -right-14 -top-16 h-36 w-36 rounded-full bg-[#f0edff] blur-sm" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[17px] font-extrabold tracking-[-0.025em] text-[#222b3a]">Productivity</h2>
                    <p className="mt-0.5 text-[11px] text-[#929baa]">Task completion this week</p>
                  </div>
                  <button className="rounded-lg border border-[#eaedf2] px-2.5 py-1.5 text-[10px] font-semibold text-[#788395]">This week</button>
                </div>
                <div className="my-7 flex items-center justify-center">
                  <div className="relative grid h-[138px] w-[138px] place-items-center rounded-full" style={{ background: `conic-gradient(#6556e8 ${completionRate * 3.6}deg, #eeecfb 0deg)` }}>
                    <div className="grid h-[108px] w-[108px] place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_#f2f2f6]">
                      <div>
                        <p className="text-[27px] font-extrabold tracking-[-0.05em] text-[#263043]">{completionRate}%</p>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9ba4b1]">Completed</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-[#edf0f4] rounded-xl bg-[#f8f9fb] py-3 text-center">
                  <div><p className="text-sm font-extrabold text-[#303a4d]">{tasks.length}</p><p className="text-[9px] text-[#929ba9]">Total</p></div>
                  <div><p className="text-sm font-extrabold text-[#e49229]">{inProgress}</p><p className="text-[9px] text-[#929ba9]">Active</p></div>
                  <div><p className="text-sm font-extrabold text-[#189778]">{completed}</p><p className="text-[9px] text-[#929ba9]">Done</p></div>
                </div>
              </div>
            </section>
          </div>

          <section id="tasks" className="scroll-mt-24 overflow-hidden rounded-[20px] border border-[#e8ecf2] bg-white">
            <div className="flex flex-col justify-between gap-4 border-b border-[#edf0f4] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div>
                <h2 className="text-[17px] font-extrabold tracking-[-0.025em] text-[#222b3a]">My tasks</h2>
                <p className="mt-0.5 text-[11px] text-[#929baa]">Your assignments across every project</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#929baa]" />
                  <select value={taskStatus} onChange={(event) => setTaskStatus(event.target.value)} className="h-9 w-full appearance-none rounded-xl border border-[#e4e7ed] bg-white pl-9 pr-8 text-[11px] font-semibold text-[#657083] outline-none focus:border-[#aaa0f3] sm:w-auto">
                    <option value="all">All status</option>
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Completed</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#929baa]" />
                </div>
                {selectedProject !== "all" && (
                  <button onClick={() => setSelectedProject("all")} className="hidden h-9 items-center gap-1.5 rounded-xl bg-[#f0edff] px-3 text-[10px] font-bold text-[#6556e8] sm:flex">
                    {projects.find((project) => project.id === selectedProject)?.name}<X className="h-3 w-3" />
                  </button>
                )}
                <button onClick={() => setTaskModal(true)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#6556e8] text-white transition hover:bg-[#594bda]" aria-label="Add task">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#eff1f5]">
              {filteredTasks.length ? filteredTasks.slice(0, 8).map((task) => {
                const project = projects.find((item) => item.id === task.projectId);
                const days = daysUntil(task.dueDate);
                const overdue = days !== null && days < 0 && task.status !== "done";
                return (
                  <div key={task.id} className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#fafaff] sm:gap-4 sm:px-6">
                    <button onClick={() => updateStatus(task)} className={`grid h-[21px] w-[21px] shrink-0 place-items-center rounded-[7px] border transition ${task.status === "done" ? "border-[#6556e8] bg-[#6556e8] text-white" : "border-[#ccd2dc] bg-white text-transparent hover:border-[#6556e8] hover:text-[#6556e8]"}`} aria-label={task.status === "done" ? "Mark task incomplete" : "Mark task complete"}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[12px] font-bold sm:text-[13px] ${task.status === "done" ? "text-[#9aa3b1] line-through" : "text-[#354053]"}`}>{task.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-[#929ba9]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project?.color ?? "#aaa" }} />
                        <span className="truncate">{project?.name ?? "Unknown project"}</span>
                        <span className="text-[#d5d9df]">•</span>
                        <span className="hidden truncate sm:inline">{task.description || "No description"}</span>
                      </div>
                    </div>
                    <span className={`hidden rounded-lg px-2.5 py-1 text-[9px] font-bold capitalize sm:inline-block ${task.priority === "high" ? "bg-[#ffe8ed] text-[#cd5872]" : task.priority === "medium" ? "bg-[#fff2de] text-[#b97828]" : "bg-[#e5f6f1] text-[#258670]"}`}>
                      {task.priority}
                    </span>
                    <div className="hidden items-center gap-2 md:flex">
                      <Avatar name={task.assignee} small />
                      <span className="w-[78px] truncate text-[10px] font-semibold text-[#737e90]">{task.assignee.split(" ")[0]}</span>
                    </div>
                    <span className={`flex w-[70px] items-center justify-end gap-1 text-[10px] font-semibold ${overdue ? "text-[#d95473]" : "text-[#7f8999]"}`}>
                      <CalendarDays className="h-3 w-3" /> {formatDate(task.dueDate, true)}
                    </span>
                    <button onClick={() => deleteTask(task.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#c0c6cf] opacity-0 transition hover:bg-[#ffedf1] hover:text-[#d95473] group-hover:opacity-100 focus:opacity-100" aria-label={`Delete ${task.title}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              }) : (
                <div className="grid min-h-[190px] place-items-center text-center">
                  <div>
                    <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#f0edff] text-[#6556e8]"><CheckSquare2 className="h-5 w-5" /></span>
                    <p className="text-sm font-bold text-[#4a5568]">Nothing on this list</p>
                    <p className="mt-1 text-[11px] text-[#929baa]">Try another filter or create a new task.</p>
                  </div>
                </div>
              )}
            </div>
            {filteredTasks.length > 8 && (
              <button onClick={() => showToast(`${filteredTasks.length - 8} more tasks are available in the full task view.`)} className="flex w-full items-center justify-center gap-1.5 border-t border-[#edf0f4] py-3.5 text-[11px] font-bold text-[#6556e8] transition hover:bg-[#faf9ff]">
                View {filteredTasks.length - 8} more tasks <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </section>
        </main>
      </div>

      {taskModal && (
        <ModalShell title="Create a new task" description="Add an actionable item to your team workspace." onClose={() => setTaskModal(false)}>
          <form onSubmit={createTask} className="space-y-4 p-7">
            <label className="block">
              <span className="form-label">Task title</span>
              <input name="title" required maxLength={120} autoFocus className="form-input" placeholder="e.g. Review final homepage copy" />
            </label>
            <label className="block">
              <span className="form-label">Description</span>
              <textarea name="description" rows={3} maxLength={500} className="form-input resize-none py-3" placeholder="Add context, notes, or requirements..." />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="form-label">Project</span>
                <select name="projectId" defaultValue={selectedProject === "all" ? projects[0]?.id : selectedProject} className="form-input appearance-none" required>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="form-label">Priority</span>
                <select name="priority" defaultValue="medium" className="form-input appearance-none">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="form-label">Assignee</span>
                <select name="assignee" defaultValue="Alex Morgan" className="form-input appearance-none">
                  {assignees.map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="form-label">Due date</span>
                <input name="dueDate" type="date" className="form-input" />
              </label>
            </div>
            <input type="hidden" name="status" value="todo" />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setTaskModal(false)} className="h-11 rounded-xl border border-[#e1e5eb] px-5 text-[12px] font-bold text-[#697487] transition hover:bg-[#f7f8fa]">Cancel</button>
              <button disabled={saving} className="h-11 rounded-xl bg-[#6556e8] px-6 text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(101,86,232,0.2)] transition hover:bg-[#594bda] disabled:opacity-60">{saving ? "Creating..." : "Create task"}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {projectModal && (
        <ModalShell title="Create a project" description="Start a focused space for your team’s next initiative." onClose={() => setProjectModal(false)}>
          <form onSubmit={createProject} className="space-y-4 p-7">
            <label className="block"><span className="form-label">Project name</span><input name="name" required maxLength={80} autoFocus className="form-input" placeholder="e.g. Customer portal" /></label>
            <label className="block"><span className="form-label">Description</span><textarea name="description" rows={3} maxLength={300} className="form-input resize-none py-3" placeholder="What is this project aiming to achieve?" /></label>
            <label className="block"><span className="form-label">Target date</span><input name="dueDate" type="date" className="form-input" /></label>
            <fieldset>
              <legend className="form-label">Project color</legend>
              <div className="flex gap-3">
                {["#6C5CE7", "#00B894", "#F6A83B", "#E65C7B", "#3B82F6"].map((color, index) => (
                  <label key={color} className="cursor-pointer"><input type="radio" name="color" value={color} defaultChecked={index === 0} className="peer sr-only" /><span className="block h-8 w-8 rounded-xl ring-offset-2 transition peer-checked:ring-2" style={{ backgroundColor: color, color }} /></label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setProjectModal(false)} className="h-11 rounded-xl border border-[#e1e5eb] px-5 text-[12px] font-bold text-[#697487] transition hover:bg-[#f7f8fa]">Cancel</button>
              <button disabled={saving} className="h-11 rounded-xl bg-[#6556e8] px-6 text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(101,86,232,0.2)] transition hover:bg-[#594bda] disabled:opacity-60">{saving ? "Creating..." : "Create project"}</button>
            </div>
          </form>
        </ModalShell>
      )}

      {toast && (
        <div className="toast-in fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-xl bg-[#202938] px-4 py-3 text-[12px] font-semibold text-white shadow-[0_15px_40px_rgba(20,25,35,0.25)]">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[#7365ee]"><Check className="h-3 w-3" strokeWidth={3} /></span>{toast}
        </div>
      )}
    </div>
  );
}
