"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";

type DatabaseCustomer = {
  id: number;
  companyId: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type DatabaseProject = {
  id: number;
  name: string;
  status: string;
  customerId: number;
  customer: string;
};

function normalizeProject(
  value: unknown
): DatabaseProject | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const project =
    value as Record<string, unknown>;

  const id =
    Number(project.id);

  const customerId =
    Number(project.customerId);

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !Number.isInteger(customerId) ||
    customerId <= 0
  ) {
    return null;
  }

  return {
    id,
    name:
      String(
        project.name ?? ""
      ),
    status:
      String(
        project.status ?? ""
      ),
    customerId,
    customer:
      String(
        project.customer ?? ""
      ),
  };
}

export default function CustomersPage() {
  const { showToast } =
    useToast();

  const [
    customers,
    setCustomers,
  ] =
    useState<DatabaseCustomer[]>(
      []
    );

  const [
    projects,
    setProjects,
  ] =
    useState<DatabaseProject[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState("");

  const [
    showModal,
    setShowModal,
  ] =
    useState(false);

  const [
    editingCustomerId,
    setEditingCustomerId,
  ] =
    useState<number | null>(
      null
    );

  const [
    customerToDelete,
    setCustomerToDelete,
  ] =
    useState<DatabaseCustomer | null>(
      null
    );

  const [
    company,
    setCompany,
  ] =
    useState("");

  const [
    contact,
    setContact,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    address,
    setAddress,
  ] =
    useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [
          customersResponse,
          projectsResponse,
        ] =
          await Promise.all([
            fetch(
              "/api/customers",
              {
                method:
                  "GET",
                cache:
                  "no-store",
              }
            ),
            fetch(
              "/api/projects",
              {
                method:
                  "GET",
                cache:
                  "no-store",
              }
            ),
          ]);

        const customersData =
          await customersResponse.json();

        const projectsData =
          await projectsResponse.json();

        if (
          !customersResponse.ok
        ) {
          throw new Error(
            customersData.error ||
              "Unable to load customers."
          );
        }

        if (
          !projectsResponse.ok
        ) {
          throw new Error(
            projectsData.error ||
              "Unable to load projects."
          );
        }

        setCustomers(
          Array.isArray(
            customersData
          )
            ? customersData
            : []
        );

        const normalizedProjects =
          Array.isArray(
            projectsData
          )
            ? projectsData
                .map(
                  normalizeProject
                )
                .filter(
                  (
                    project
                  ): project is DatabaseProject =>
                    project !==
                    null
                )
            : [];

        setProjects(
          normalizedProjects
        );
      } catch (error) {
        console.error(
          "Customer/project load failed:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to load customer data from the database.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [showToast]);

  const filteredCustomers =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return customers.filter(
        (customer) => {
          return (
            customer.name
              .toLowerCase()
              .includes(search) ||
            (
              customer.contactName ??
              ""
            )
              .toLowerCase()
              .includes(search) ||
            (
              customer.phone ??
              ""
            )
              .toLowerCase()
              .includes(search) ||
            (
              customer.email ??
              ""
            )
              .toLowerCase()
              .includes(search) ||
            (
              customer.address ??
              ""
            )
              .toLowerCase()
              .includes(search)
          );
        }
      );
    }, [
      customers,
      searchTerm,
    ]);

  function resetForm() {
    setCompany("");
    setContact("");
    setPhone("");
    setEmail("");
    setAddress("");
    setEditingCustomerId(null);
  }

  function openNewCustomerModal() {
    resetForm();
    setShowModal(true);
  }

  function openEditCustomerModal(
    customer: DatabaseCustomer
  ) {
    setEditingCustomerId(
      customer.id
    );

    setCompany(
      customer.name
    );

    setContact(
      customer.contactName ??
        ""
    );

    setPhone(
      customer.phone ??
        ""
    );

    setEmail(
      customer.email ??
        ""
    );

    setAddress(
      customer.address ??
        ""
    );

    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    resetForm();
  }

  function getCustomerProjects(
    customerId: number
  ) {
    return projects.filter(
      (project) =>
        project.customerId ===
        customerId
    );
  }

  async function handleSaveCustomer() {
    const trimmedCompany =
      company.trim();

    const trimmedContact =
      contact.trim();

    const trimmedPhone =
      phone.trim();

    const trimmedEmail =
      email.trim();

    const trimmedAddress =
      address.trim();

    if (
      !trimmedCompany ||
      !trimmedContact ||
      !trimmedPhone
    ) {
      showToast(
        "Please enter the company, contact, and phone number.",
        "error"
      );

      return;
    }

    try {
      setSaving(true);

      const isEditing =
        editingCustomerId !==
        null;

      const response =
        await fetch(
          "/api/customers",
          {
            method:
              isEditing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  editingCustomerId,

                name:
                  trimmedCompany,

                contactName:
                  trimmedContact,

                phone:
                  trimmedPhone,

                email:
                  trimmedEmail,

                address:
                  trimmedAddress,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save customer."
        );
      }

      if (isEditing) {
        setCustomers(
          (
            currentCustomers
          ) =>
            currentCustomers.map(
              (customer) =>
                customer.id ===
                editingCustomerId
                  ? data
                  : customer
            )
        );

        setProjects(
          (
            currentProjects
          ) =>
            currentProjects.map(
              (project) =>
                project.customerId ===
                editingCustomerId
                  ? {
                      ...project,
                      customer:
                        trimmedCompany,
                    }
                  : project
            )
        );

        showToast(
          "Customer updated successfully.",
          "success"
        );
      } else {
        setCustomers(
          (
            currentCustomers
          ) => [
            ...currentCustomers,
            data,
          ]
        );

        showToast(
          "Customer created successfully.",
          "success"
        );
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error(
        "Customer save failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to save customer.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (
      !customerToDelete
    ) {
      return;
    }

    const customerProjects =
      getCustomerProjects(
        customerToDelete.id
      );

    if (
      customerProjects.length >
      0
    ) {
      showToast(
        "This customer still has projects. Close or permanently delete those projects first.",
        "error"
      );

      setCustomerToDelete(
        null
      );

      return;
    }

    try {
      setDeleting(true);

      const response =
        await fetch(
          `/api/customers?id=${customerToDelete.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete customer."
        );
      }

      const companyName =
        customerToDelete.name;

      setCustomers(
        (
          currentCustomers
        ) =>
          currentCustomers.filter(
            (customer) =>
              customer.id !==
              customerToDelete.id
          )
      );

      setCustomerToDelete(
        null
      );

      showToast(
        `${companyName} was deleted successfully.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Customer delete failed:",
        error
      );

      showToast(
        error instanceof Error
          ? error.message
          : "Unable to delete customer.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Customers
            </h1>

            <p className="mt-1 text-gray-500 dark:text-slate-400">
              Manage customers
              and their project
              history.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openNewCustomerModal
            }
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            + New Customer
          </button>
        </div>

        <input
          type="search"
          className="w-full rounded-lg border p-3"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value
            )
          }
        />

        <div className="overflow-hidden rounded-xl bg-white shadow dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-200 dark:bg-slate-800">
                <tr>
                  <th className="p-4 text-left">
                    Company
                  </th>

                  <th className="p-4 text-left">
                    Contact
                  </th>

                  <th className="p-4 text-left">
                    Phone
                  </th>

                  <th className="p-4 text-left">
                    Active Projects
                  </th>

                  <th className="p-4 text-left">
                    Closed Projects
                  </th>

                  <th className="p-4 text-left">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-gray-500 dark:text-slate-400"
                    >
                      Loading
                      customers...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredCustomers.map(
                    (customer) => {
                      const customerProjects =
                        getCustomerProjects(
                          customer.id
                        );

                      const activeCount =
                        customerProjects.filter(
                          (
                            project
                          ) =>
                            project.status !==
                            "Closed"
                        ).length;

                      const closedCount =
                        customerProjects.filter(
                          (
                            project
                          ) =>
                            project.status ===
                            "Closed"
                        ).length;

                      return (
                        <tr
                          key={
                            customer.id
                          }
                          className="border-t border-slate-200 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                        >
                          <td className="p-4">
                            <Link
                              href={`/customers/${customer.id}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {
                                customer.name
                              }
                            </Link>

                            {customer.address && (
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {
                                  customer.address
                                }
                              </p>
                            )}
                          </td>

                          <td className="p-4">
                            {customer.contactName ||
                              "—"}
                          </td>

                          <td className="p-4">
                            {customer.phone ||
                              "—"}
                          </td>

                          <td className="p-4">
                            {
                              activeCount
                            }
                          </td>

                          <td className="p-4">
                            {
                              closedCount
                            }
                          </td>

                          <td className="p-4">
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditCustomerModal(
                                    customer
                                  )
                                }
                                className="text-blue-600 hover:underline"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setCustomerToDelete(
                                    customer
                                  )
                                }
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}

                {!loading &&
                  filteredCustomers.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-gray-500 dark:text-slate-400"
                      >
                        No customers
                        found.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={
            editingCustomerId !==
            null
              ? "Edit Customer"
              : "New Customer"
          }
        >
          <div className="space-y-4">
            <input
              type="text"
              className="w-full rounded-lg border p-3"
              placeholder="Company Name"
              value={company}
              disabled={saving}
              onChange={(event) =>
                setCompany(
                  event.target
                    .value
                )
              }
            />

            <input
              type="text"
              className="w-full rounded-lg border p-3"
              placeholder="Contact Name"
              value={contact}
              disabled={saving}
              onChange={(event) =>
                setContact(
                  event.target
                    .value
                )
              }
            />

            <input
              type="tel"
              className="w-full rounded-lg border p-3"
              placeholder="Phone Number"
              value={phone}
              disabled={saving}
              onChange={(event) =>
                setPhone(
                  event.target
                    .value
                )
              }
            />

            <input
              type="email"
              className="w-full rounded-lg border p-3"
              placeholder="Email Address"
              value={email}
              disabled={saving}
              onChange={(event) =>
                setEmail(
                  event.target
                    .value
                )
              }
            />

            <input
              type="text"
              className="w-full rounded-lg border p-3"
              placeholder="Customer Address"
              value={address}
              disabled={saving}
              onChange={(event) =>
                setAddress(
                  event.target
                    .value
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                void handleSaveCustomer()
              }
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingCustomerId !==
                    null
                  ? "Update Customer"
                  : "Save Customer"}
            </button>
          </div>
        </Modal>

        <ConfirmDialog
          isOpen={
            customerToDelete !==
            null
          }
          title="Delete Customer?"
          message={
            customerToDelete
              ? `Delete ${customerToDelete.name}? Customers with project history cannot be deleted until their projects are removed.`
              : ""
          }
          confirmLabel={
            deleting
              ? "Deleting..."
              : "Delete Customer"
          }
          cancelLabel="Cancel"
          danger
          onConfirm={() =>
            void handleConfirmDelete()
          }
          onCancel={() => {
            if (!deleting) {
              setCustomerToDelete(
                null
              );
            }
          }}
        />
      </div>
    </AppLayout>
  );
}