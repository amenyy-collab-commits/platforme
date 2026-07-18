import FlowboardDashboard from "@/components/flowboard-dashboard";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { projects, tasks } = await getDashboardData();
  return <FlowboardDashboard initialProjects={projects} initialTasks={tasks} />;
}
