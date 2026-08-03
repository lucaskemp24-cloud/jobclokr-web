"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import AppLayout from "@/components/layout/AppLayout";
export default function CustomersPage() {
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([
    {
      id: 1,
      company: "Lucas Communications",
      contact: "Lucas Kemp",
      phone: "(555) 555-0101",
      projects: 12,
    },
    {
      id: 2,
      company: "ABC Electric",
      contact: "John Smith",
      phone: "(555) 555-0102",
      projects: 4,
    },
    {
      id: 3,
      company: "Prime Plumbing",
      contact: "Lisa Jones",
      phone: "(555) 555-0103",
      projects: 7,
    },
  ]);
const [company, setCompany] = useState("");
const [contact, setContact] = useState("");
const [phone, setPhone] = useState("");
const [nextId, setNextId] = useState(4);
const [editingCustomer, setEditingCustomer] = useState<number | null>(null);
const [isEditing, setIsEditing] = useState(false);
const saveCustomer = () => {
  if (!company || !contact || !phone) {
    alert("Please fill out all fields.");
    return;
  }
if (isEditing) {
  setCustomers(
    customers.map((customer) =>
      customer.id === editingCustomer
        ? {
            ...customer,
            company,
            contact,
            phone,
          }
        : customer
    )
  );

  setIsEditing(false);
  setEditingCustomer(null);
  setCompany("");
  setContact("");
  setPhone("");
  setShowModal(false);
 return;
}
  setCustomers([
    ...customers,
    {
      id: nextId,
      company,
      contact,
      phone,
      projects: 0,
    },
  ]);

  setNextId(nextId + 1);

  setCompany("");
  setContact("");
  setPhone("");

  setShowModal(false);
};

  return (
  <AppLayout>
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold">Customers</h1>

<button
  onClick={() => {
    alert("Button clicked!");
    setShowModal(true);
  }}
  className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
>
  + New Customer
</button>
    </div>

    <input
      className="w-full p-3 rounded-lg border mb-8"
      placeholder="Search customers..."
    />

    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-200">
  <tr>
    <th className="text-left p-4">Company</th>
    <th className="text-left p-4">Contact</th>
    <th className="text-left p-4">Phone</th>
    <th className="text-left p-4">Projects</th>
    <th className="text-left p-4">Actions</th>
  </tr>
</thead>

        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="border-b hover:bg-slate-50"
            >
              <td className="p-4">
  <a
    href={`/customers/${customer.id}`}
    className="text-blue-600 hover:underline font-medium"
  >
    {customer.company}
  </a>
</td>
              <td className="p-4">{customer.contact}</td>
              <td className="p-4">{customer.phone}</td>
              <td className="p-4">{customer.projects}</td>
              <td className="p-4">
  <button
  onClick={() => {
    setEditingCustomer(customer.id);
    setIsEditing(true);
    setCompany(customer.company);
    setContact(customer.contact);
    setPhone(customer.phone);
    setShowModal(true);
  }}
  className="text-blue-600 hover:underline"
>
  Edit
</button>
</td>
            </tr>
          ))}
        </tbody>
      </table>
     </div>
  <Modal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      title="New Customer"
    >
      <div className="space-y-4">
        <input
  className="w-full border rounded-lg p-3"
  placeholder="Company Name"
  value={company}
  onChange={(e) => setCompany(e.target.value)}
/>

        <input
  className="w-full border rounded-lg p-3"
  placeholder="Contact Name"
  value={contact}
  onChange={(e) => setContact(e.target.value)}
/>

        <input
  className="w-full border rounded-lg p-3"
  placeholder="Phone Number"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
/>

       <button
  onClick={saveCustomer}
  className="bg-blue-600 text-white px-4 py-3 rounded-lg w-full"
>
          Save Customer
        </button>
      </div>
    </Modal>

  </AppLayout>
);
}