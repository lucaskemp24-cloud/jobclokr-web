"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import {
  defaultEmployees,
  loadEmployees,
  saveEmployees,
  type Employee,
} from "@/lib/employees";

export default function EmployeesPage() {
  const [employees, setEmployees] =
    useState<Employee[]>(defaultEmployees);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] =
    useState<number | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("Technician");
  const [status, setStatus] =
    useState<"Active" | "Inactive">("Active");

  useEffect(() => {
    setEmployees(loadEmployees());
    setEmployeesLoaded(true);
  }, []);

  useEffect(() => {
    if (employeesLoaded) {
      saveEmployees(employees);
    }
  }, [employees, employeesLoaded]);

  const filteredEmployees = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return employees.filter((employee) => {
      const fullName =
        `${employee.firstName} ${employee.lastName}`.toLowerCase();

      return (
        fullName.includes(search) ||
        employee.email.toLowerCase().includes(search) ||
        employee.phone.toLowerCase().includes(search) ||
        employee.position.toLowerCase().includes(search) ||
        employee.status.toLowerCase().includes(search)
      );
    });
  }, [employees, searchTerm]);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPosition("Technician");
    setStatus("Active");
    setEditingEmployeeId(null);
  }

  function closeModal() {
    setShowEmployeeModal(false);
    resetForm();
  }

  function handleSaveEmployee() {
    if (!firstName.trim() || !lastName.trim()) {
      alert("Please enter the employee's first and last name.");
      return;
    }

    if (editingEmployeeId !== null) {
      setEmployees(
        employees.map((employee) =>
          employee.id === editingEmployeeId
            ? {
                ...employee,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                position,
                status,
              }
            : employee
        )
      );
    } else {
      setEmployees([
        ...employees,
        {
          id: Date.now(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          position,
          status,
        },
      ]);
    }

    closeModal();
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Employees</h1>
            <p className="mt-1 text-gray-500">
              Manage your company&apos;s employees.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowEmployeeModal(true);
            }}
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            + New Employee
          </button>
        </div>

        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-lg border p-3"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Total Employees</p>
            <p className="mt-2 text-4xl font-bold">
              {employees.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Active</p>
            <p className="mt-2 text-4xl font-bold">
              {
                employees.filter(
                  (employee) => employee.status === "Active"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="mt-2 text-4xl font-bold">
              {
                employees.filter(
                  (employee) => employee.status === "Inactive"
                ).length
              }
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-200">
                <tr>
                  <th className="p-4 text-left">Employee</th>
                  <th className="p-4 text-left">Position</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Phone</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-t">
                    <td className="p-4 font-medium">
                      {employee.firstName} {employee.lastName}
                    </td>

                    <td className="p-4">{employee.position}</td>
                    <td className="p-4">{employee.email || "—"}</td>
                    <td className="p-4">{employee.phone || "—"}</td>

                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm ${
                          employee.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {employee.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => {
                          setEditingEmployeeId(employee.id);
                          setFirstName(employee.firstName);
                          setLastName(employee.lastName);
                          setEmail(employee.email);
                          setPhone(employee.phone);
                          setPosition(employee.position);
                          setStatus(employee.status);
                          setShowEmployeeModal(true);
                        }}
                        className="mr-4 text-blue-600 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          const fullName =
                            `${employee.firstName} ${employee.lastName}`;

                          if (window.confirm(`Delete "${fullName}"?`)) {
                            setEmployees(
                              employees.filter(
                                (savedEmployee) =>
                                  savedEmployee.id !== employee.id
                              )
                            );
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-6 text-center text-gray-500"
                    >
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={showEmployeeModal}
          onClose={closeModal}
          title={
            editingEmployeeId !== null
              ? "Edit Employee"
              : "New Employee"
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(event) =>
                  setFirstName(event.target.value)
                }
                className="w-full rounded-lg border p-3"
              />

              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(event) =>
                  setLastName(event.target.value)
                }
                className="w-full rounded-lg border p-3"
              />
            </div>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <input
              type="tel"
              placeholder="Phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <select
              value={position}
              onChange={(event) =>
                setPosition(event.target.value)
              }
              className="w-full rounded-lg border p-3"
            >
              <option>Owner</option>
              <option>Foreman</option>
              <option>Technician</option>
              <option>Apprentice</option>
              <option>Office</option>
            </select>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as "Active" | "Inactive"
                )
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              onClick={handleSaveEmployee}
              className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700"
            >
              {editingEmployeeId !== null
                ? "Update Employee"
                : "Save Employee"}
            </button>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}