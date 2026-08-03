import DashboardCard from "@/components/dashboard/DashboardCard";
import AppLayout from "@/components/layout/AppLayout";

export default function Home() {
  return (
    <AppLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Welcome back, Lucas.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-gray-500">Customers</h3>
          <p className="text-4xl font-bold mt-3">27</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-gray-500">Active Projects</h3>
          <p className="text-4xl font-bold mt-3">12</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-gray-500">Employees</h3>
          <p className="text-4xl font-bold mt-3">8</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-gray-500">Hours This Week</h3>
          <p className="text-4xl font-bold mt-3">214</p>
        </div>

      </div>
    </AppLayout>
  );
}