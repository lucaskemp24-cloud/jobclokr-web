import AppLayout from "@/components/layout/AppLayout";

export default function ProjectsPage() {
  const projects = [
    {
      id: 1,
      name: "Office Remodel",
      customer: "Lucas Communications",
      status: "Active",
      employees: 3,
    },
    {
      id: 2,
      name: "Warehouse Lighting",
      customer: "ABC Electric",
      status: "Completed",
      employees: 5,
    },
    {
      id: 3,
      name: "Kitchen Remodel",
      customer: "Prime Plumbing",
      status: "Active",
      employees: 2,
    },
  ];

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Projects</h1>

        <button className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700">
          + New Project
        </button>
      </div>

      <input
        className="w-full p-3 rounded-lg border mb-8"
        placeholder="Search projects..."
      />

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-200">
            <tr>
              <th className="text-left p-4">Project</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Employees</th>
            </tr>
          </thead>

          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b hover:bg-slate-50">
                <td className="p-4">{project.name}</td>
                <td className="p-4">{project.customer}</td>
                <td className="p-4">{project.status}</td>
                <td className="p-4">{project.employees}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}