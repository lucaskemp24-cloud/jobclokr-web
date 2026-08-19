"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

type EmployeeRole =
  | "OWNER"
  | "OFFICE"
  | "FOREMAN"
  | "EMPLOYEE";

type CompanyEmployee = {
  id: number;
  companyId?: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  loginName: string | null;
  role: EmployeeRole;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt?: string;
};

type CompanyCustomer = {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
};

type CompanyProject = {
  id: number;
  name: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;

  customer: {
    id: number;
    name: string;
  };
};

type CompanySettings = {
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  defaultShiftStart: string;
  defaultShiftEnd: string;
  overtimeThreshold: number;
  lunchDuration: number;
  gpsTrackingEnabled: boolean;
  allowEmployeePunchEdits: boolean;
  requireClockOutNotes: boolean;
};

type CompanyData = {
  id: number;
  name: string;
  code: string;

  subscriptionStatus: string;

  stripeCustomerId:
    | string
    | null;

  stripeSubscriptionId:
    | string
    | null;

  subscriptionCurrentPeriodStart:
    | string
    | null;

  subscriptionCurrentPeriodEnd:
    | string
    | null;

  createdAt: string;
  updatedAt: string;

  counts: {
    employees: number;
    customers: number;
    projects: number;
  };

  settings:
    | CompanySettings
    | null;

  employees:
    CompanyEmployee[];

  customers:
    CompanyCustomer[];

  projects:
    CompanyProject[];
};

type PlatformAdminSession = {
  accountType:
    "PLATFORM_ADMIN";

  adminId: number;
  employeeId: null;
  companyId: null;

  name: string;

  role:
    "PlatformAdmin";

  isPlatformAdmin:
    true;
};

type SessionResponse = {
  authenticated: boolean;

  user:
    | PlatformAdminSession
    | null;
};

type CompanyEditForm = {
  name: string;
  code: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  defaultShiftStart: string;
  defaultShiftEnd: string;
  overtimeThreshold: string;
  lunchDuration: string;
};

const EMPTY_COMPANY_EDIT_FORM: CompanyEditForm = {
  name: "",
  code: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  defaultShiftStart: "07:00",
  defaultShiftEnd: "15:30",
  overtimeThreshold: "40",
  lunchDuration: "30",
};

type EmployeeForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loginName: string;
  password: string;
  role: EmployeeRole;
  active: boolean;
};

const EMPTY_EMPLOYEE_FORM:
  EmployeeForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  loginName: "",
  password: "",
  role: "EMPLOYEE",
  active: true,
};

function formatSubscriptionStatus(
  status: string
) {
  if (
    status ===
    "ACTIVE"
  ) {
    return "Active";
  }

  if (
    status ===
    "TRIALING"
  ) {
    return "Trial";
  }

  if (
    status ===
    "PAST_DUE"
  ) {
    return "Past Due";
  }

  if (
    status ===
    "CANCELED"
  ) {
    return "Canceled";
  }

  if (
    status ===
    "INCOMPLETE"
  ) {
    return "Incomplete";
  }

  return status;
}

function getSubscriptionClass(
  status: string
) {
  if (
    status === "ACTIVE" ||
    status === "TRIALING"
  ) {
    return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
  }

  if (
    status ===
    "PAST_DUE"
  ) {
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
  }

  if (
    status ===
    "CANCELED"
  ) {
    return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function formatRole(
  role: EmployeeRole
) {
  if (
    role ===
    "OWNER"
  ) {
    return "Owner";
  }

  if (
    role ===
    "OFFICE"
  ) {
    return "Office";
  }

  if (
    role ===
    "FOREMAN"
  ) {
    return "Foreman";
  }

  return "Employee";
}

function formatDate(
  value:
    | string
    | null
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleDateString();
}

function sortEmployees(
  employees:
    CompanyEmployee[]
) {
  return [
    ...employees,
  ].sort(
    (
      first,
      second
    ) => {
      const lastNameCompare =
        first.lastName.localeCompare(
          second.lastName
        );

      if (
        lastNameCompare !==
        0
      ) {
        return lastNameCompare;
      }

      return first.firstName.localeCompare(
        second.firstName
      );
    }
  );
}

export default function AdminCompanyPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const companyId =
    params.id;

  const [
    company,
    setCompany,
  ] =
    useState<
      CompanyData | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    subscriptionStatus,
    setSubscriptionStatus,
  ] =
    useState("");

  const [
    savingSubscription,
    setSavingSubscription,
  ] =
    useState(false);

  const [
    subscriptionMessage,
    setSubscriptionMessage,
  ] =
    useState("");

  const [
    subscriptionError,
    setSubscriptionError,
  ] =
    useState("");

  const [
    showEmployeeForm,
    setShowEmployeeForm,
  ] =
    useState(false);

  const [
    employeeForm,
    setEmployeeForm,
  ] =
    useState<EmployeeForm>(
      EMPTY_EMPLOYEE_FORM
    );

  const [
    savingEmployee,
    setSavingEmployee,
  ] =
    useState(false);

  const [
    employeeError,
    setEmployeeError,
  ] =
    useState("");

  const [
    employeeMessage,
    setEmployeeMessage,
  ] =
    useState("");

  const [
    showEditEmployeeForm,
    setShowEditEmployeeForm,
  ] =
    useState(false);

  const [
    editingEmployeeId,
    setEditingEmployeeId,
  ] =
    useState<number | null>(
      null
    );

  const [
    editEmployeeForm,
    setEditEmployeeForm,
  ] =
    useState<EmployeeForm>(
      EMPTY_EMPLOYEE_FORM
    );

  const [
    savingEditEmployee,
    setSavingEditEmployee,
  ] =
    useState(false);

  const [
    editEmployeeError,
    setEditEmployeeError,
  ] =
    useState("");

  const [
    employeeToDelete,
    setEmployeeToDelete,
  ] =
    useState<CompanyEmployee | null>(
      null
    );

  const [
    deletingEmployee,
    setDeletingEmployee,
  ] =
    useState(false);

  const [
    deleteEmployeeError,
    setDeleteEmployeeError,
  ] =
    useState("");

  const [
    showEditCompanyForm,
    setShowEditCompanyForm,
  ] =
    useState(false);

  const [
    editCompanyForm,
    setEditCompanyForm,
  ] =
    useState<CompanyEditForm>(
      EMPTY_COMPANY_EDIT_FORM
    );

  const [
    savingEditCompany,
    setSavingEditCompany,
  ] =
    useState(false);

  const [
    editCompanyError,
    setEditCompanyError,
  ] =
    useState("");

  const [
    companyMessage,
    setCompanyMessage,
  ] =
    useState("");

  const [
    showDeactivateCompanyForm,
    setShowDeactivateCompanyForm,
  ] = useState(false);

  const [
    deactivateConfirmation,
    setDeactivateConfirmation,
  ] = useState("");

  const [
    changingCompanyAccess,
    setChangingCompanyAccess,
  ] = useState(false);

  const [
    companyAccessError,
    setCompanyAccessError,
  ] = useState("");

  useEffect(() => {
    let cancelled =
      false;

    async function loadPage() {
      try {
        setLoading(
          true
        );

        setError(
          ""
        );

        const sessionResponse =
          await fetch(
            "/api/session",
            {
              cache:
                "no-store",
            }
          );

        if (
          !sessionResponse.ok
        ) {
          router.replace(
            "/login"
          );

          return;
        }

        const sessionData =
          (await sessionResponse.json()) as
            SessionResponse;

        if (
          !sessionData.authenticated ||
          !sessionData.user ||
          sessionData.user.accountType !==
            "PLATFORM_ADMIN"
        ) {
          router.replace(
            "/login"
          );

          return;
        }

        const companyResponse =
          await fetch(
            `/api/admin/companies/${companyId}`,
            {
              cache:
                "no-store",
            }
          );

        if (
          !companyResponse.ok
        ) {
          const data =
            await companyResponse.json();

          throw new Error(
            typeof data?.error ===
              "string"
              ? data.error
              : "Unable to load company."
          );
        }

        const companyData =
          (await companyResponse.json()) as
            CompanyData;

        if (
          !cancelled
        ) {
          setCompany(
            companyData
          );

          setSubscriptionStatus(
            companyData.subscriptionStatus
          );
        }
      } catch (
        loadError
      ) {
        console.error(
          "Admin company load failed:",
          loadError
        );

        if (
          !cancelled
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load company."
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void loadPage();

    return () => {
      cancelled =
        true;
    };
  }, [
    companyId,
    router,
  ]);

  async function saveSubscriptionStatus() {
    if (
      !company ||
      !subscriptionStatus
    ) {
      return;
    }

    try {
      setSavingSubscription(
        true
      );

      setSubscriptionMessage(
        ""
      );

      setSubscriptionError(
        ""
      );

      const response =
        await fetch(
          `/api/admin/companies/${company.id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                subscriptionStatus,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          typeof data?.error ===
            "string"
            ? data.error
            : "Unable to update subscription status."
        );
      }

      setCompany(
        (
          currentCompany
        ) => {
          if (
            !currentCompany
          ) {
            return currentCompany;
          }

          return {
            ...currentCompany,

            subscriptionStatus:
              data.subscriptionStatus,

            updatedAt:
              data.updatedAt,
          };
        }
      );

      setSubscriptionStatus(
        data.subscriptionStatus
      );

      setSubscriptionMessage(
        "Subscription status updated."
      );
    } catch (
      saveError
    ) {
      console.error(
        "Subscription status update failed:",
        saveError
      );

      setSubscriptionError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update subscription status."
      );
    } finally {
      setSavingSubscription(
        false
      );
    }
  }

  function openEmployeeForm() {
    setEmployeeForm({
      ...EMPTY_EMPLOYEE_FORM,
    });

    setEmployeeError(
      ""
    );

    setEmployeeMessage(
      ""
    );

    setShowEmployeeForm(
      true
    );
  }

  function closeEmployeeForm() {
    if (
      savingEmployee
    ) {
      return;
    }

    setShowEmployeeForm(
      false
    );

    setEmployeeError(
      ""
    );
  }

  function updateEmployeeForm<
    Key extends keyof EmployeeForm
  >(
    key: Key,
    value: EmployeeForm[Key]
  ) {
    setEmployeeForm(
      (
        current
      ) => ({
        ...current,
        [key]:
          value,
      })
    );

    setEmployeeError(
      ""
    );

    setEmployeeMessage(
      ""
    );
  }

  async function createEmployee() {
    if (!company) {
      return;
    }

    const firstName =
      employeeForm.firstName.trim();

    const lastName =
      employeeForm.lastName.trim();

    const loginName =
      employeeForm.loginName
        .trim()
        .toLowerCase();

    if (
      !firstName ||
      !lastName
    ) {
      setEmployeeError(
        "First and last name are required."
      );

      return;
    }

    if (
      loginName.length < 3
    ) {
      setEmployeeError(
        "Login name must be at least 3 characters."
      );

      return;
    }

    if (
      employeeForm.password.length <
      8
    ) {
      setEmployeeError(
        "Temporary password must be at least 8 characters."
      );

      return;
    }

    try {
      setSavingEmployee(
        true
      );

      setEmployeeError(
        ""
      );

      setEmployeeMessage(
        ""
      );

      const response =
        await fetch(
          `/api/admin/companies/${company.id}/employees`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                firstName,

                lastName,

                email:
                  employeeForm.email.trim(),

                phone:
                  employeeForm.phone.trim(),

                loginName,

                password:
                  employeeForm.password,

                role:
                  employeeForm.role,

                active:
                  employeeForm.active,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          typeof data?.error ===
            "string"
            ? data.error
            : "Unable to create employee."
        );
      }

      const newEmployee =
        data as CompanyEmployee;

      setCompany(
        (
          currentCompany
        ) => {
          if (
            !currentCompany
          ) {
            return currentCompany;
          }

          return {
            ...currentCompany,

            employees:
              sortEmployees([
                ...currentCompany.employees,
                newEmployee,
              ]),

            counts: {
              ...currentCompany.counts,

              employees:
                currentCompany.counts.employees +
                1,
            },
          };
        }
      );

      setEmployeeMessage(
        `${newEmployee.firstName} ${newEmployee.lastName} was added successfully.`
      );

      setEmployeeForm({
        ...EMPTY_EMPLOYEE_FORM,
      });

      setShowEmployeeForm(
        false
      );
    } catch (
      saveError
    ) {
      console.error(
        "Employee creation failed:",
        saveError
      );

      setEmployeeError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create employee."
      );
    } finally {
      setSavingEmployee(
        false
      );
    }
  }

  function openEditEmployeeForm(
    employee: CompanyEmployee
  ) {
    setEditingEmployeeId(
      employee.id
    );

    setEditEmployeeForm({
      firstName:
        employee.firstName,

      lastName:
        employee.lastName,

      email:
        employee.email ?? "",

      phone:
        employee.phone ?? "",

      loginName:
        employee.loginName ?? "",

      password: "",

      role:
        employee.role,

      active:
        employee.active,
    });

    setEditEmployeeError(
      ""
    );

    setEmployeeMessage(
      ""
    );

    setShowEditEmployeeForm(
      true
    );
  }

  function closeEditEmployeeForm() {
    if (
      savingEditEmployee
    ) {
      return;
    }

    setShowEditEmployeeForm(
      false
    );

    setEditingEmployeeId(
      null
    );

    setEditEmployeeError(
      ""
    );

    setEditEmployeeForm({
      ...EMPTY_EMPLOYEE_FORM,
    });
  }

  function updateEditEmployeeForm<
    Key extends keyof EmployeeForm
  >(
    key: Key,
    value: EmployeeForm[Key]
  ) {
    setEditEmployeeForm(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );

    setEditEmployeeError(
      ""
    );

    setEmployeeMessage(
      ""
    );
  }

  async function saveEditedEmployee() {
    if (
      !company ||
      !editingEmployeeId
    ) {
      return;
    }

    const firstName =
      editEmployeeForm.firstName.trim();

    const lastName =
      editEmployeeForm.lastName.trim();

    const loginName =
      editEmployeeForm.loginName
        .trim()
        .toLowerCase();

    if (
      !firstName ||
      !lastName
    ) {
      setEditEmployeeError(
        "First and last name are required."
      );

      return;
    }

    if (
      loginName.length < 3
    ) {
      setEditEmployeeError(
        "Login name must be at least 3 characters."
      );

      return;
    }

    if (
      editEmployeeForm.password &&
      editEmployeeForm.password.length < 8
    ) {
      setEditEmployeeError(
        "New temporary password must be at least 8 characters."
      );

      return;
    }

    try {
      setSavingEditEmployee(
        true
      );

      setEditEmployeeError(
        ""
      );

      setEmployeeMessage(
        ""
      );

      const response =
        await fetch(
          `/api/admin/companies/${company.id}/employees/${editingEmployeeId}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                firstName,

                lastName,

                email:
                  editEmployeeForm.email.trim(),

                phone:
                  editEmployeeForm.phone.trim(),

                loginName,

                role:
                  editEmployeeForm.role,

                active:
                  editEmployeeForm.active,

                password:
                  editEmployeeForm.password,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          typeof data?.error ===
            "string"
            ? data.error
            : "Unable to update employee."
        );
      }

      const updatedEmployee =
        data as CompanyEmployee;

      setCompany(
        (
          currentCompany
        ) => {
          if (
            !currentCompany
          ) {
            return currentCompany;
          }

          return {
            ...currentCompany,

            employees:
              sortEmployees(
                currentCompany.employees.map(
                  (
                    employee
                  ) =>
                    employee.id ===
                    updatedEmployee.id
                      ? updatedEmployee
                      : employee
                )
              ),
          };
        }
      );

      setEmployeeMessage(
        `${updatedEmployee.firstName} ${updatedEmployee.lastName} was updated successfully.`
      );

      setShowEditEmployeeForm(
        false
      );

      setEditingEmployeeId(
        null
      );

      setEditEmployeeForm({
        ...EMPTY_EMPLOYEE_FORM,
      });
    } catch (
      saveError
    ) {
      console.error(
        "Employee update failed:",
        saveError
      );

      setEditEmployeeError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update employee."
      );
    } finally {
      setSavingEditEmployee(
        false
      );
    }
  }

  function openDeleteEmployeeForm(
    employee: CompanyEmployee
  ) {
    setEmployeeToDelete(
      employee
    );

    setDeleteEmployeeError(
      ""
    );

    setEmployeeMessage(
      ""
    );
  }

  function closeDeleteEmployeeForm() {
    if (deletingEmployee) {
      return;
    }

    setEmployeeToDelete(
      null
    );

    setDeleteEmployeeError(
      ""
    );
  }

  async function deleteEmployee() {
    if (
      !company ||
      !employeeToDelete
    ) {
      return;
    }

    try {
      setDeletingEmployee(
        true
      );

      setDeleteEmployeeError(
        ""
      );

      setEmployeeMessage(
        ""
      );

      const response =
        await fetch(
          `/api/admin/companies/${company.id}/employees/${employeeToDelete.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error ===
            "string"
            ? data.error
            : "Unable to delete employee."
        );
      }

      const deletedEmployee =
        employeeToDelete;

      setCompany(
        (
          currentCompany
        ) => {
          if (
            !currentCompany
          ) {
            return currentCompany;
          }

          return {
            ...currentCompany,

            employees:
              currentCompany.employees.filter(
                (employee) =>
                  employee.id !==
                    deletedEmployee.id
              ),

            counts: {
              ...currentCompany.counts,

              employees:
                Math.max(
                  0,
                  currentCompany.counts.employees - 1
                ),
            },
          };
        }
      );

      setEmployeeMessage(
        `${deletedEmployee.firstName} ${deletedEmployee.lastName} was deleted successfully.`
      );

      setEmployeeToDelete(
        null
      );
    } catch (deleteError) {
      console.error(
        "Employee deletion failed:",
        deleteError
      );

      setDeleteEmployeeError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete employee."
      );
    } finally {
      setDeletingEmployee(
        false
      );
    }
  }

  function openEditCompanyForm() {
    if (!company) {
      return;
    }

    setEditCompanyForm({
      name:
        company.name,

      code:
        company.code,

      phone:
        company.settings?.phone ?? "",

      email:
        company.settings?.email ?? "",

      website:
        company.settings?.website ?? "",

      address:
        company.settings?.address ?? "",

      defaultShiftStart:
        company.settings?.defaultShiftStart ?? "07:00",

      defaultShiftEnd:
        company.settings?.defaultShiftEnd ?? "15:30",

      overtimeThreshold:
        String(
          company.settings?.overtimeThreshold ?? 40
        ),

      lunchDuration:
        String(
          company.settings?.lunchDuration ?? 30
        ),
    });

    setEditCompanyError(
      ""
    );

    setCompanyMessage(
      ""
    );

    setShowEditCompanyForm(
      true
    );
  }

  function closeEditCompanyForm() {
    if (
      savingEditCompany
    ) {
      return;
    }

    setShowEditCompanyForm(
      false
    );

    setEditCompanyError(
      ""
    );
  }

  function updateEditCompanyForm<
    Key extends keyof CompanyEditForm
  >(
    key: Key,
    value: CompanyEditForm[Key]
  ) {
    setEditCompanyForm(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );

    setEditCompanyError(
      ""
    );

    setCompanyMessage(
      ""
    );
  }

  async function saveEditedCompany() {
    if (!company) {
      return;
    }

    const name =
      editCompanyForm.name.trim();

    const code =
      editCompanyForm.code
        .trim()
        .toUpperCase();

    const overtimeThreshold =
      Number(
        editCompanyForm.overtimeThreshold
      );

    const lunchDuration =
      Number(
        editCompanyForm.lunchDuration
      );

    if (!name) {
      setEditCompanyError(
        "Company name is required."
      );

      return;
    }

    if (
      code.length < 3
    ) {
      setEditCompanyError(
        "Company code must be at least 3 characters."
      );

      return;
    }

    if (
      !/^[A-Z0-9_-]+$/.test(
        code
      )
    ) {
      setEditCompanyError(
        "Company code can only contain letters, numbers, hyphens, and underscores."
      );

      return;
    }

    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        editCompanyForm.defaultShiftStart
      ) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        editCompanyForm.defaultShiftEnd
      )
    ) {
      setEditCompanyError(
        "Shift times must use HH:MM format."
      );

      return;
    }

    if (
      !Number.isFinite(
        overtimeThreshold
      ) ||
      overtimeThreshold < 0 ||
      overtimeThreshold > 168
    ) {
      setEditCompanyError(
        "Overtime threshold must be between 0 and 168 hours."
      );

      return;
    }

    if (
      !Number.isInteger(
        lunchDuration
      ) ||
      lunchDuration < 0 ||
      lunchDuration > 480
    ) {
      setEditCompanyError(
        "Lunch duration must be a whole number between 0 and 480 minutes."
      );

      return;
    }

    try {
      setSavingEditCompany(
        true
      );

      setEditCompanyError(
        ""
      );

      setCompanyMessage(
        ""
      );

      const response =
        await fetch(
          `/api/admin/companies/${company.id}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,
                code,

                phone:
                  editCompanyForm.phone.trim(),

                email:
                  editCompanyForm.email.trim(),

                website:
                  editCompanyForm.website.trim(),

                address:
                  editCompanyForm.address.trim(),

                defaultShiftStart:
                  editCompanyForm.defaultShiftStart,

                defaultShiftEnd:
                  editCompanyForm.defaultShiftEnd,

                overtimeThreshold,
                lunchDuration,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          typeof data?.error ===
            "string"
            ? data.error
            : "Unable to update company."
        );
      }

      setCompany(
        (
          currentCompany
        ) => {
          if (
            !currentCompany
          ) {
            return currentCompany;
          }

          return {
            ...currentCompany,

            name:
              data.name,

            code:
              data.code,

            subscriptionStatus:
              data.subscriptionStatus,

            updatedAt:
              data.updatedAt,

            settings:
              data.settings,
          };
        }
      );

      setSubscriptionStatus(
        data.subscriptionStatus
      );

      setCompanyMessage(
        "Company details updated successfully."
      );

      setShowEditCompanyForm(
        false
      );
    } catch (
      saveError
    ) {
      console.error(
        "Company update failed:",
        saveError
      );

      setEditCompanyError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update company."
      );
    } finally {
      setSavingEditCompany(
        false
      );
    }
  }


  function openDeactivateCompanyForm() {
    setDeactivateConfirmation("");
    setCompanyAccessError("");
    setCompanyMessage("");
    setShowDeactivateCompanyForm(true);
  }

  function closeDeactivateCompanyForm() {
    if (changingCompanyAccess) {
      return;
    }

    setShowDeactivateCompanyForm(false);
    setDeactivateConfirmation("");
    setCompanyAccessError("");
  }

  async function changeCompanyAccess(
    nextStatus: "ACTIVE" | "CANCELED"
  ) {
    if (!company) {
      return;
    }

    if (
      nextStatus === "CANCELED" &&
      deactivateConfirmation.trim().toUpperCase() !==
        company.code.toUpperCase()
    ) {
      setCompanyAccessError(
        `Type ${company.code} exactly to confirm deactivation.`
      );
      return;
    }

    try {
      setChangingCompanyAccess(true);
      setCompanyAccessError("");
      setCompanyMessage("");
      setSubscriptionError("");
      setSubscriptionMessage("");

      const response = await fetch(
        `/api/admin/companies/${company.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionStatus: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Unable to update company access."
        );
      }

      setCompany((currentCompany) => {
        if (!currentCompany) {
          return currentCompany;
        }

        return {
          ...currentCompany,
          subscriptionStatus: data.subscriptionStatus,
          updatedAt: data.updatedAt,
        };
      });

      setSubscriptionStatus(data.subscriptionStatus);
      setShowDeactivateCompanyForm(false);
      setDeactivateConfirmation("");

      setCompanyMessage(
        nextStatus === "CANCELED"
          ? "Company deactivated. Company users can no longer sign in."
          : "Company reactivated successfully."
      );
    } catch (accessError) {
      console.error(
        "Company access update failed:",
        accessError
      );

      setCompanyAccessError(
        accessError instanceof Error
          ? accessError.message
          : "Unable to update company access."
      );
    } finally {
      setChangingCompanyAccess(false);
    }
  }

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="rounded-2xl bg-white px-8 py-6 shadow dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">
            Loading company...
          </p>
        </div>
      </main>
    );
  }

  if (
    error ||
    !company
  ) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow dark:bg-slate-900">
          <h1 className="text-2xl font-bold">
            Unable to load company
          </h1>

          <p className="mt-2 text-red-600">
            {error ||
              "Company not found."}
          </p>

          <Link
            href="/admin/companies"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Back to Companies
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div>
              <Link
                href="/admin"
                className="text-2xl font-bold text-slate-950 dark:text-white"
              >
                JobClokr
              </Link>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Platform Administration
              </p>
            </div>

            <Link
              href="/admin/companies"
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Back to Companies
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Company Management
              </p>

              <h1 className="mt-2 text-4xl font-bold text-slate-950 dark:text-white">
                {company.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-slate-200 px-3 py-1 font-mono text-sm dark:bg-slate-800">
                  {company.code}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${getSubscriptionClass(
                    company.subscriptionStatus
                  )}`}
                >
                  {formatSubscriptionStatus(
                    company.subscriptionStatus
                  )}
                </span>

                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Company ID{" "}
                  {company.id}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <button
                type="button"
                onClick={
                  openEditCompanyForm
                }
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Edit Company
              </button>

              <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="text-sm font-semibold text-blue-950 dark:text-blue-100">
                  Platform Admin View
                </p>

                <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                  Viewing this company without becoming one of its employees.
                </p>
              </div>
            </div>
          </div>

          {companyMessage ? (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
              {companyMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Employees
              </p>

              <p className="mt-2 text-4xl font-bold">
                {
                  company.counts
                    .employees
                }
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Customers
              </p>

              <p className="mt-2 text-4xl font-bold">
                {
                  company.counts
                    .customers
                }
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Projects
              </p>

              <p className="mt-2 text-4xl font-bold">
                {
                  company.counts
                    .projects
                }
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
              <h2 className="text-2xl font-bold">
                Company Details
              </h2>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Subscription
                  </p>

                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={
                        subscriptionStatus
                      }
                      onChange={(
                        event
                      ) => {
                        setSubscriptionStatus(
                          event.target.value
                        );

                        setSubscriptionMessage(
                          ""
                        );

                        setSubscriptionError(
                          ""
                        );
                      }}
                      disabled={
                        savingSubscription
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-900"
                    >
                      <option value="ACTIVE">
                        Active
                      </option>

                      <option value="TRIALING">
                        Trial
                      </option>

                      <option value="PAST_DUE">
                        Past Due
                      </option>

                      <option
                        value="CANCELED"
                        disabled
                      >
                        Canceled
                      </option>

                      <option value="INCOMPLETE">
                        Incomplete
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        void saveSubscriptionStatus()
                      }
                      disabled={
                        savingSubscription ||
                        subscriptionStatus ===
                          company.subscriptionStatus
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                    >
                      {savingSubscription
                        ? "Saving..."
                        : "Save Status"}
                    </button>
                  </div>

                  <div className="mt-3">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${getSubscriptionClass(
                        company.subscriptionStatus
                      )}`}
                    >
                      Current:{" "}
                      {formatSubscriptionStatus(
                        company.subscriptionStatus
                      )}
                    </span>
                  </div>

                  {subscriptionMessage ? (
                    <p className="mt-3 text-sm font-medium text-green-600 dark:text-green-400">
                      {
                        subscriptionMessage
                      }
                    </p>
                  ) : null}

                  {subscriptionError ? (
                    <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
                      {
                        subscriptionError
                      }
                    </p>
                  ) : null}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Billing Period
                  </p>

                  <p className="mt-1">
                    {formatDate(
                      company.subscriptionCurrentPeriodStart
                    )}{" "}
                    –{" "}
                    {formatDate(
                      company.subscriptionCurrentPeriodEnd
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Stripe Customer
                  </p>

                  <p className="mt-1 break-all">
                    {company.stripeCustomerId ||
                      "Not connected"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Stripe Subscription
                  </p>

                  <p className="mt-1 break-all">
                    {company.stripeSubscriptionId ||
                      "Not connected"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Created
                  </p>

                  <p className="mt-1">
                    {formatDate(
                      company.createdAt
                    )}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">
                  Company Settings
                </h2>

                <button
                  type="button"
                  onClick={
                    openEditCompanyForm
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Edit
                </button>
              </div>

              {company.settings ? (
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Phone
                    </p>

                    <p className="mt-1">
                      {company.settings.phone ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Email
                    </p>

                    <p className="mt-1">
                      {company.settings.email ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Website
                    </p>

                    <p className="mt-1 break-all">
                      {company.settings.website ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Address
                    </p>

                    <p className="mt-1">
                      {company.settings.address ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Default Shift
                    </p>

                    <p className="mt-1">
                      {
                        company.settings
                          .defaultShiftStart
                      }{" "}
                      –{" "}
                      {
                        company.settings
                          .defaultShiftEnd
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Overtime Threshold
                    </p>

                    <p className="mt-1">
                      {
                        company.settings
                          .overtimeThreshold
                      }{" "}
                      hours
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Lunch Duration
                    </p>

                    <p className="mt-1">
                      {
                        company.settings
                          .lunchDuration
                      }{" "}
                      minutes
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-slate-500 dark:text-slate-400">
                  No company settings have been created yet.
                </p>
              )}
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow dark:border-red-900 dark:bg-slate-900">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                  Company Access
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {company.subscriptionStatus === "CANCELED"
                    ? "Company Deactivated"
                    : "Deactivate Company"}
                </h2>

                <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
                  {company.subscriptionStatus === "CANCELED"
                    ? "This company is currently deactivated. Its data is preserved, but company users should not be able to sign in."
                    : "Deactivate this company to block company users from signing in while preserving employees, customers, projects, time entries, and company history."}
                </p>
              </div>

              {company.subscriptionStatus === "CANCELED" ? (
                <button
                  type="button"
                  onClick={() =>
                    void changeCompanyAccess("ACTIVE")
                  }
                  disabled={changingCompanyAccess}
                  className="shrink-0 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingCompanyAccess
                    ? "Reactivating..."
                    : "Reactivate Company"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openDeactivateCompanyForm}
                  disabled={changingCompanyAccess}
                  className="shrink-0 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Deactivate Company
                </button>
              )}
            </div>

            {companyAccessError &&
            company.subscriptionStatus === "CANCELED" ? (
              <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
                {companyAccessError}
              </p>
            ) : null}
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow dark:bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Employees
                </h2>

                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  Employees assigned to this company.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  openEmployeeForm
                }
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                + Add Employee
              </button>
            </div>

            {employeeMessage ? (
              <div className="border-b border-green-200 bg-green-50 px-6 py-4 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                {
                  employeeMessage
                }
              </div>
            ) : null}

            {company.employees.length ===
            0 ? (
              <p className="p-6 text-slate-500 dark:text-slate-400">
                No employees.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-4 text-left">
                        Employee
                      </th>

                      <th className="p-4 text-left">
                        Role
                      </th>

                      <th className="p-4 text-left">
                        Login
                      </th>

                      <th className="p-4 text-left">
                        Email
                      </th>

                      <th className="p-4 text-left">
                        Status
                      </th>

                      <th className="p-4 text-left">
                        Password
                      </th>

                      <th className="p-4 text-left">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {company.employees.map(
                      (
                        employee
                      ) => (
                        <tr
                          key={
                            employee.id
                          }
                          className="border-t border-slate-200 dark:border-slate-800"
                        >
                          <td className="p-4 font-semibold">
                            {
                              employee.firstName
                            }{" "}
                            {
                              employee.lastName
                            }
                          </td>

                          <td className="p-4">
                            {formatRole(
                              employee.role
                            )}
                          </td>

                          <td className="p-4">
                            {employee.loginName ||
                              "—"}
                          </td>

                          <td className="p-4">
                            {employee.email ||
                              "—"}
                          </td>

                          <td className="p-4">
                            <span
                              className={
                                employee.active
                                  ? "rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300"
                                  : "rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }
                            >
                              {employee.active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td className="p-4">
                            {employee.mustChangePassword ? (
                              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                                Change Required
                              </span>
                            ) : (
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                Set
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditEmployeeForm(
                                    employee
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                              >
                                Manage
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openDeleteEmployeeForm(
                                    employee
                                  )
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow dark:bg-slate-900">
            <div className="border-b border-slate-200 p-6 dark:border-slate-800">
              <h2 className="text-2xl font-bold">
                Projects
              </h2>

              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Projects belonging to this company.
              </p>
            </div>

            {company.projects.length ===
            0 ? (
              <p className="p-6 text-slate-500 dark:text-slate-400">
                No projects.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-4 text-left">
                        Project
                      </th>

                      <th className="p-4 text-left">
                        Customer
                      </th>

                      <th className="p-4 text-left">
                        Status
                      </th>

                      <th className="p-4 text-left">
                        Start
                      </th>

                      <th className="p-4 text-left">
                        Due
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {company.projects.map(
                      (
                        project
                      ) => (
                        <tr
                          key={
                            project.id
                          }
                          className="border-t border-slate-200 dark:border-slate-800"
                        >
                          <td className="p-4 font-semibold">
                            {
                              project.name
                            }
                          </td>

                          <td className="p-4">
                            {
                              project.customer
                                .name
                            }
                          </td>

                          <td className="p-4">
                            {
                              project.status
                            }
                          </td>

                          <td className="p-4">
                            {formatDate(
                              project.startDate
                            )}
                          </td>

                          <td className="p-4">
                            {formatDate(
                              project.dueDate
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {showDeactivateCompanyForm ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="border-b border-red-200 p-6 dark:border-red-900">
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
                Deactivate Company
              </h2>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                This will block company users from signing in. Company data will not be deleted.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                Employees, customers, projects, time entries, and company history will remain stored.
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Type <span className="font-mono font-bold">{company.code}</span> to confirm
                </label>

                <input
                  type="text"
                  value={deactivateConfirmation}
                  onChange={(event) => {
                    setDeactivateConfirmation(
                      event.target.value.toUpperCase()
                    );
                    setCompanyAccessError("");
                  }}
                  disabled={changingCompanyAccess}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  className="w-full rounded-lg border border-slate-300 p-3 font-mono uppercase outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-red-950"
                />
              </div>

              {companyAccessError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {companyAccessError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeactivateCompanyForm}
                  disabled={changingCompanyAccess}
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void changeCompanyAccess("CANCELED")
                  }
                  disabled={
                    changingCompanyAccess ||
                    deactivateConfirmation.trim().toUpperCase() !==
                      company.code.toUpperCase()
                  }
                  className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {changingCompanyAccess
                    ? "Deactivating..."
                    : "Deactivate Company"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showEditCompanyForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold">
                  Edit Company
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Update company information and default work settings.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeEditCompanyForm
                }
                disabled={
                  savingEditCompany
                }
                className="rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Company Name
                  </label>

                  <input
                    type="text"
                    value={
                      editCompanyForm.name
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditCompanyForm(
                        "name",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditCompany
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Company Code
                  </label>

                  <input
                    type="text"
                    value={
                      editCompanyForm.code
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditCompanyForm(
                        "code",
                        event.target.value.toUpperCase()
                      )
                    }
                    disabled={
                      savingEditCompany
                    }
                    autoCapitalize="characters"
                    autoCorrect="off"
                    className="w-full rounded-lg border border-slate-300 p-3 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Letters, numbers, hyphens, and underscores only.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={
                      editCompanyForm.phone
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditCompanyForm(
                        "phone",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditCompany
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      editCompanyForm.email
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditCompanyForm(
                        "email",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditCompany
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Website
                </label>

                <input
                  type="text"
                  value={
                    editCompanyForm.website
                  }
                  onChange={(
                    event
                  ) =>
                    updateEditCompanyForm(
                      "website",
                      event.target.value
                    )
                  }
                  disabled={
                    savingEditCompany
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Address
                </label>

                <textarea
                  value={
                    editCompanyForm.address
                  }
                  onChange={(
                    event
                  ) =>
                    updateEditCompanyForm(
                      "address",
                      event.target.value
                    )
                  }
                  disabled={
                    savingEditCompany
                  }
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Default Shift Start
                  </label>

                  <input
                    type="time"
                    value={
                      editCompanyForm.defaultShiftStart
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditCompanyForm(
                        "defaultShiftStart",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditCompany
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Default Shift End
                  </label>

                  <input
                    type="time"
                    value={
                      editCompanyForm.defaultShiftEnd
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditCompanyForm(
                        "defaultShiftEnd",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditCompany
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Overtime Threshold
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="168"
                    step="0.5"
                    value={
                      editCompanyForm.overtimeThreshold
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditCompanyForm(
                        "overtimeThreshold",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditCompany
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Hours per week before overtime.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Lunch Duration
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="480"
                    step="1"
                    value={
                      editCompanyForm.lunchDuration
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditCompanyForm(
                        "lunchDuration",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditCompany
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Minutes.
                  </p>
                </div>
              </div>

              {editCompanyError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {editCompanyError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeEditCompanyForm
                  }
                  disabled={
                    savingEditCompany
                  }
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void saveEditedCompany()
                  }
                  disabled={
                    savingEditCompany
                  }
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEditCompany
                    ? "Saving Changes..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showEmployeeForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold">
                  Add Employee
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Add an employee to{" "}
                  {company.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeEmployeeForm
                }
                disabled={
                  savingEmployee
                }
                className="rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    First Name
                  </label>

                  <input
                    type="text"
                    value={
                      employeeForm.firstName
                    }
                    onChange={(
                      event
                    ) =>
                      updateEmployeeForm(
                        "firstName",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEmployee
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Last Name
                  </label>

                  <input
                    type="text"
                    value={
                      employeeForm.lastName
                    }
                    onChange={(
                      event
                    ) =>
                      updateEmployeeForm(
                        "lastName",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEmployee
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      employeeForm.email
                    }
                    onChange={(
                      event
                    ) =>
                      updateEmployeeForm(
                        "email",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEmployee
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={
                      employeeForm.phone
                    }
                    onChange={(
                      event
                    ) =>
                      updateEmployeeForm(
                        "phone",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEmployee
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Login Name
                  </label>

                  <input
                    type="text"
                    value={
                      employeeForm.loginName
                    }
                    onChange={(
                      event
                    ) =>
                      updateEmployeeForm(
                        "loginName",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEmployee
                    }
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    At least 3 characters.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Temporary Password
                  </label>

                  <input
                    type="password"
                    value={
                      employeeForm.password
                    }
                    onChange={(
                      event
                    ) =>
                      updateEmployeeForm(
                        "password",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEmployee
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    At least 8 characters. Employee will change it after first login.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Role
                </label>

                <select
                  value={
                    employeeForm.role
                  }
                  onChange={(
                    event
                  ) =>
                    updateEmployeeForm(
                      "role",
                      event.target
                        .value as EmployeeRole
                    )
                  }
                  disabled={
                    savingEmployee
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="OWNER">
                    Owner
                  </option>

                  <option value="OFFICE">
                    Office
                  </option>

                  <option value="FOREMAN">
                    Foreman
                  </option>

                  <option value="EMPLOYEE">
                    Employee
                  </option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={
                    employeeForm.active
                  }
                  onChange={(
                    event
                  ) =>
                    updateEmployeeForm(
                      "active",
                      event.target.checked
                    )
                  }
                  disabled={
                    savingEmployee
                  }
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-semibold">
                    Active Employee
                  </p>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Active employees can sign in to JobClokr.
                  </p>
                </div>
              </label>

              {employeeError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {employeeError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeEmployeeForm
                  }
                  disabled={
                    savingEmployee
                  }
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void createEmployee()
                  }
                  disabled={
                    savingEmployee
                  }
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEmployee
                    ? "Adding Employee..."
                    : "Add Employee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showEditEmployeeForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold">
                  Manage Employee
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Update this employee account for{" "}
                  {company.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeEditEmployeeForm
                }
                disabled={
                  savingEditEmployee
                }
                className="rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    First Name
                  </label>

                  <input
                    type="text"
                    value={
                      editEmployeeForm.firstName
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditEmployeeForm(
                        "firstName",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditEmployee
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Last Name
                  </label>

                  <input
                    type="text"
                    value={
                      editEmployeeForm.lastName
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditEmployeeForm(
                        "lastName",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditEmployee
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      editEmployeeForm.email
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditEmployeeForm(
                        "email",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditEmployee
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={
                      editEmployeeForm.phone
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditEmployeeForm(
                        "phone",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditEmployee
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium">
                    Login Name
                  </label>

                  <input
                    type="text"
                    value={
                      editEmployeeForm.loginName
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditEmployeeForm(
                        "loginName",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditEmployee
                    }
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    At least 3 characters.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    New Temporary Password
                  </label>

                  <input
                    type="password"
                    value={
                      editEmployeeForm.password
                    }
                    onChange={(
                      event
                    ) =>
                      updateEditEmployeeForm(
                        "password",
                        event.target.value
                      )
                    }
                    disabled={
                      savingEditEmployee
                    }
                    className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Leave blank to keep the current password. Enter at least 8 characters to reset it.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Role
                </label>

                <select
                  value={
                    editEmployeeForm.role
                  }
                  onChange={(
                    event
                  ) =>
                    updateEditEmployeeForm(
                      "role",
                      event.target
                        .value as EmployeeRole
                    )
                  }
                  disabled={
                    savingEditEmployee
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="OWNER">
                    Owner
                  </option>

                  <option value="OFFICE">
                    Office
                  </option>

                  <option value="FOREMAN">
                    Foreman
                  </option>

                  <option value="EMPLOYEE">
                    Employee
                  </option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={
                    editEmployeeForm.active
                  }
                  onChange={(
                    event
                  ) =>
                    updateEditEmployeeForm(
                      "active",
                      event.target.checked
                    )
                  }
                  disabled={
                    savingEditEmployee
                  }
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-semibold">
                    Active Employee
                  </p>

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Turn this off to prevent this employee from signing in.
                  </p>
                </div>
              </label>

              {editEmployeeError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {
                    editEmployeeError
                  }
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeEditEmployeeForm
                  }
                  disabled={
                    savingEditEmployee
                  }
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void saveEditedEmployee()
                  }
                  disabled={
                    savingEditEmployee
                  }
                  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEditEmployee
                    ? "Saving Changes..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {employeeToDelete ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="border-b border-red-200 p-6 dark:border-red-900">
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
                Delete Employee
              </h2>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Permanently remove this employee from{" "}
                {company.name}.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                <p className="font-semibold text-red-800 dark:text-red-200">
                  {employeeToDelete.firstName}{" "}
                  {employeeToDelete.lastName}
                </p>

                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  This action cannot be undone.
                </p>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                Employees with job history cannot be
                permanently deleted. JobClokr will ask
                you to mark them Inactive instead.
              </p>

              {deleteEmployeeError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {deleteEmployeeError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDeleteEmployeeForm}
                  disabled={deletingEmployee}
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void deleteEmployee()
                  }
                  disabled={deletingEmployee}
                  className="rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingEmployee
                    ? "Deleting..."
                    : "Delete Employee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}