import { listProjects, getUnassignedCharacterCount } from '@/lib/actions';
import ProjectDashboard from '@/components/ProjectDashboard';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const projects = await listProjects();
  const unassignedCount = await getUnassignedCharacterCount();

  const serialized = projects.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <ProjectDashboard projects={serialized} unassignedCount={unassignedCount} />;
}
