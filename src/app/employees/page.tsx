import AppLayout from "@/components/layout/AppLayout";

export default function EmployeesPage() {
  const employees = [
    {
      id: 1,
      name: "Mike Johnson",
      position: "Foreman",
      phone: "(555) 555-0101",
      status: "Clocked In",
    },
    {
      id: 2,
      name: "Sarah Davis",
      position: "Electrician",
      phone: "(555) 555-0102",
      status: "Off Duty",
    },
    {
      id: 3,
      name: "Chris Wilson",
      position: "Apprentice",
      phone: "(555) 555-0103",
      status: "Clocked In",
    },
  ];

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Employees</h1>

        <button className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700">
          + New Employee
        </button>
      </div>

      <input
        className="w-full p-3 rounded-lg border mb-8"
        placeholder="Search employees..."
      />

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-200">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Position</th>
              <th className="text-left p-4">Phone</th>
              <th className="text-left p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b hover:bg-slate-50">
                <td className="p-4">{employee.name}</td>
                <td className="p-4">{employee.position}</td>
                <td className="p-4">{employee.phone}</td>
                <td className="p-4">{employee.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}