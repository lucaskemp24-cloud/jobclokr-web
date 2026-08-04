"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  loadEmployees,
  getEmployeeName,
  type Employee,
} from "@/lib/employees";

import {
  loginEmployee,
  loadAuthUser,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  useEffect(() => {
    const user = loadAuthUser();

    if (user) {
      if (user.role === "Employee") {
        router.push("/employee-portal");
      } else {
        router.push("/");
      }
    }

    setEmployees(
      loadEmployees().filter(
        (employee) => employee.status === "Active"
      )
    );
  }, [router]);

  function handleLogin() {
    if (!selectedEmployee) {
      alert("Select an employee.");
      return;
    }

    const user = loginEmployee(Number(selectedEmployee));

    if (!user) {
      alert("Unable to login.");
      return;
    }

    if (user.role === "Employee") {
      router.push("/employee-portal");
    } else {
      router.push("/");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold mb-2">
          JobClokr
        </h1>

        <p className="text-gray-500 mb-8">
          Sign in
        </p>

        <label className="block mb-2 font-medium">
          Employee
        </label>

        <select
          value={selectedEmployee}
          onChange={(e) =>
            setSelectedEmployee(e.target.value)
          }
          className="w-full border rounded-lg p-3 mb-6"
        >
          <option value="">
            Select employee
          </option>

          {employees.map((employee) => (
            <option
              key={employee.id}
              value={employee.id}
            >
              {getEmployeeName(employee)}
            </option>
          ))}
        </select>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 font-semibold"
        >
          Sign In
        </button>
      </div>
    </main>
  );
}