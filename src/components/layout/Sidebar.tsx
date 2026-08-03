  import Link from "next/link";

  export default function Sidebar() {
    return (
      <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
        <h1 className="text-3xl font-bold text-blue-500 mb-10">
          JobClokr
        </h1>

        <nav>
          <ul className="space-y-2">

            <li>
              <Link
                href="/"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800"
              >
                📊 Dashboard
              </Link>
            </li>

            <li>
              <Link
                href="/customers"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800"
              >
                👥 Customers
              </Link>
            </li>

            <li>
              <Link
                href="/projects"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800"
              >
                📁 Projects
              </Link>
            </li>

            <li>
              <Link
                href="/employees"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800"
              >
                👷 Employees
              </Link>
            </li>

            <li>
              <Link
                href="/schedule"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800"
              >
                📅 Schedule
              </Link>
            </li>

            <li>
              <Link
                href="/time"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800"
              >
                ⏰ Time
              </Link>
            </li>

            <li>
              <Link
                href="/reports"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800"
              >
                📈 Reports
              </Link>
            </li>

            <li>
              <Link
                href="/settings"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800"
              >
                ⚙️ Settings
              </Link>
            </li>

          </ul>
        </nav>
      </aside>
    );
  }