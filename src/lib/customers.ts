export type Customer = {
  id: number;
  company: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
};

const CUSTOMER_STORAGE_KEY = "jobclokr-customers";

export const defaultCustomers: Customer[] = [
  {
    id: 1,
    company: "Lucas Communications",
    contact: "Lucas Kemp",
    phone: "(555) 555-0101",
    email: "lucas@example.com",
    address: "123 Main St",
  },
  {
    id: 2,
    company: "ABC Electric",
    contact: "John Smith",
    phone: "(555) 555-0102",
    email: "john@abcelectric.com",
    address: "456 Oak Avenue",
  },
  {
    id: 3,
    company: "Prime Plumbing",
    contact: "Lisa Jones",
    phone: "(555) 555-0103",
    email: "lisa@primeplumbing.com",
    address: "789 Pine Road",
  },
];

function normalizeCustomer(
  customer: Partial<Customer>,
  fallbackId: number
): Customer {
  return {
    id:
      typeof customer.id === "number"
        ? customer.id
        : fallbackId,
    company:
      typeof customer.company === "string"
        ? customer.company
        : "Unnamed Customer",
    contact:
      typeof customer.contact === "string"
        ? customer.contact
        : "",
    phone:
      typeof customer.phone === "string"
        ? customer.phone
        : "",
    email:
      typeof customer.email === "string"
        ? customer.email
        : "",
    address:
      typeof customer.address === "string"
        ? customer.address
        : "",
  };
}

export function loadCustomers(): Customer[] {
  if (typeof window === "undefined") {
    return defaultCustomers;
  }

  const savedCustomers =
    window.localStorage.getItem(CUSTOMER_STORAGE_KEY);

  if (!savedCustomers) {
    window.localStorage.setItem(
      CUSTOMER_STORAGE_KEY,
      JSON.stringify(defaultCustomers)
    );

    return defaultCustomers;
  }

  try {
    const parsedCustomers = JSON.parse(savedCustomers);

    if (!Array.isArray(parsedCustomers)) {
      return defaultCustomers;
    }

    const normalizedCustomers = parsedCustomers.map(
      (customer, index) =>
        normalizeCustomer(
          customer as Partial<Customer>,
          Date.now() + index
        )
    );

    window.localStorage.setItem(
      CUSTOMER_STORAGE_KEY,
      JSON.stringify(normalizedCustomers)
    );

    return normalizedCustomers;
  } catch {
    return defaultCustomers;
  }
}

export function saveCustomers(
  customers: Customer[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    CUSTOMER_STORAGE_KEY,
    JSON.stringify(customers)
  );
}

export function findCustomerById(
  customers: Customer[],
  customerId: number
) {
  return customers.find(
    (customer) => customer.id === customerId
  );
}