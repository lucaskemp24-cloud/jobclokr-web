import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const COMPANY_ID = 1;

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        companyId: COMPANY_ID,
      },

      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error(
      "Failed to load customers:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load customers.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const name =
      String(body.name ?? "").trim();

    const contactName =
      String(
        body.contactName ?? ""
      ).trim();

    const phone =
      String(body.phone ?? "").trim();

    const email =
      String(body.email ?? "").trim();

    const address =
      String(body.address ?? "").trim();

    if (
      !name ||
      !contactName ||
      !phone
    ) {
      return NextResponse.json(
        {
          error:
            "Company, contact, and phone number are required.",
        },
        {
          status: 400,
        }
      );
    }

    const duplicate =
      await prisma.customer.findFirst({
        where: {
          companyId: COMPANY_ID,

          name: {
            equals: name,
            mode: "insensitive",
          },
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "A customer with that company name already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const customer =
      await prisma.customer.create({
        data: {
          companyId:
            COMPANY_ID,

          name,

          contactName,

          phone,

          email:
            email || null,

          address:
            address || null,
        },
      });

    return NextResponse.json(
      customer,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create customer:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create customer.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const body =
      await request.json();

    const id =
      Number(body.id);

    const name =
      String(body.name ?? "").trim();

    const contactName =
      String(
        body.contactName ?? ""
      ).trim();

    const phone =
      String(body.phone ?? "").trim();

    const email =
      String(body.email ?? "").trim();

    const address =
      String(body.address ?? "").trim();

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid customer.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !name ||
      !contactName ||
      !phone
    ) {
      return NextResponse.json(
        {
          error:
            "Company, contact, and phone number are required.",
        },
        {
          status: 400,
        }
      );
    }

    const existingCustomer =
      await prisma.customer.findFirst({
        where: {
          id,
          companyId: COMPANY_ID,
        },
      });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          error:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    const duplicate =
      await prisma.customer.findFirst({
        where: {
          companyId: COMPANY_ID,

          id: {
            not: id,
          },

          name: {
            equals: name,
            mode: "insensitive",
          },
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "A customer with that company name already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const customer =
      await prisma.customer.update({
        where: {
          id,
        },

        data: {
          name,
          contactName,
          phone,

          email:
            email || null,

          address:
            address || null,
        },
      });

    return NextResponse.json(
      customer
    );
  } catch (error) {
    console.error(
      "Failed to update customer:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update customer.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const url =
      new URL(request.url);

    const id =
      Number(
        url.searchParams.get("id")
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid customer.",
        },
        {
          status: 400,
        }
      );
    }

    const customer =
      await prisma.customer.findFirst({
        where: {
          id,
          companyId: COMPANY_ID,
        },

        include: {
          _count: {
            select: {
              projects: true,
            },
          },
        },
      });

    if (!customer) {
      return NextResponse.json(
        {
          error:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      customer._count.projects > 0
    ) {
      return NextResponse.json(
        {
          error:
            "This customer still has projects and cannot be deleted.",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.customer.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete customer:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete customer.",
      },
      {
        status: 500,
      }
    );
  }
}