import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { asc, count, eq } from "drizzle-orm";

const DAY = 24 * 60 * 60 * 1000;

function fromNow(days: number) {
  return new Date(Date.now() + days * DAY);
}

export async function ensureSeedData() {
  const [result] = await db.select({ value: count() }).from(projects);
  if (Number(result.value) > 0) return;

  const seededProjects = await db
    .insert(projects)
    .values([
      {
        name: "Website Redesign",
        description: "Refresh the marketing site and improve conversion.",
        color: "#6C5CE7",
        dueDate: fromNow(12),
      },
      {
        name: "Mobile App",
        description: "Ship the first customer-ready mobile experience.",
        color: "#00B894",
        dueDate: fromNow(28),
      },
      {
        name: "Brand Identity",
        description: "Create the visual system for our next chapter.",
        color: "#F6A83B",
        dueDate: fromNow(7),
      },
      {
        name: "Product Launch",
        description: "Coordinate launch messaging, assets, and channels.",
        color: "#E65C7B",
        dueDate: fromNow(36),
      },
    ])
    .returning();

  const [website, mobile, brand, launch] = seededProjects;

  await db.insert(tasks).values([
    {
      projectId: website.id,
      title: "Finalize homepage wireframes",
      description: "Review the latest responsive layouts with the product team.",
      status: "in-progress",
      priority: "high",
      assignee: "Alex Morgan",
      dueDate: fromNow(1),
    },
    {
      projectId: website.id,
      title: "Write new product copy",
      description: "Draft concise value propositions for the three main features.",
      status: "todo",
      priority: "medium",
      assignee: "Sofia Chen",
      dueDate: fromNow(3),
    },
    {
      projectId: website.id,
      title: "Audit current analytics",
      description: "Capture baseline funnel metrics before the new site ships.",
      status: "done",
      priority: "low",
      assignee: "Jamie Bell",
      dueDate: fromNow(-2),
    },
    {
      projectId: mobile.id,
      title: "Prototype onboarding flow",
      description: "Build a clickable prototype for moderated user testing.",
      status: "in-progress",
      priority: "high",
      assignee: "Maya Patel",
      dueDate: fromNow(2),
    },
    {
      projectId: mobile.id,
      title: "Set up push notifications",
      description: "Create notification preferences and permission states.",
      status: "todo",
      priority: "medium",
      assignee: "Noah Williams",
      dueDate: fromNow(8),
    },
    {
      projectId: brand.id,
      title: "Approve primary color palette",
      description: "Check accessibility contrast across the final palette.",
      status: "done",
      priority: "medium",
      assignee: "Sofia Chen",
      dueDate: fromNow(-1),
    },
    {
      projectId: brand.id,
      title: "Export social templates",
      description: "Prepare editable launch templates for marketing channels.",
      status: "in-progress",
      priority: "medium",
      assignee: "Alex Morgan",
      dueDate: fromNow(4),
    },
    {
      projectId: launch.id,
      title: "Build launch timeline",
      description: "Align milestones and handoffs across product and marketing.",
      status: "todo",
      priority: "high",
      assignee: "Jamie Bell",
      dueDate: fromNow(5),
    },
    {
      projectId: launch.id,
      title: "Prepare press kit",
      description: "Collect approved logos, screenshots, and company boilerplate.",
      status: "todo",
      priority: "low",
      assignee: "Maya Patel",
      dueDate: fromNow(11),
    },
  ]);
}

export async function getDashboardData() {
  await ensureSeedData();

  const allProjects = await db.select().from(projects).orderBy(asc(projects.id));
  const allTasks = await db.select().from(tasks).orderBy(asc(tasks.id));

  return {
    projects: allProjects.map((project) => ({
      ...project,
      dueDate: project.dueDate?.toISOString() ?? null,
      createdAt: project.createdAt.toISOString(),
    })),
    tasks: allTasks.map((task) => ({
      ...task,
      dueDate: task.dueDate?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    })),
  };
}

export async function projectExists(id: number) {
  const result = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return result.length > 0;
}
