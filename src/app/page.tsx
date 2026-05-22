import { listProjects, getUnassignedCharacterCount } from '@/lib/actions';
import ProjectDashboard from '@/components/ProjectDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const projects = await listProjects();
  const unassignedCount = await getUnassignedCharacterCount();

  const serialized = projects.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <ProjectDashboard projects={serialized} unassignedCount={unassignedCount} />;
}
