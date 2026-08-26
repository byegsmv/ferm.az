import DashboardClient from "./DashboardClient"; // turbopackIgnore: true

// Server component — resolves searchParams Promise for the client component
export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  return <DashboardClient searchParams={params} />;
}
