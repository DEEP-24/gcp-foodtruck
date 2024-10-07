import type { ActionFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import * as React from "react";
import { z } from "zod";
import { TailwindContainer } from "~/components/TailwindContainer";
import { Button } from "~/components/ui/button";
import DatePicker from "~/components/ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { db } from "~/lib/db.server";
import { requireUser } from "~/lib/session.server";
import { useUser } from "~/utils/hooks";
import { createPasswordHash, formatDate } from "~/utils/misc";
import { badRequest } from "~/utils/misc.server";
import { useFetcherCallback } from "~/utils/use-fetcher-callback";
import type { inferErrors } from "~/utils/validation";
import { validateAction } from "~/utils/validation";

const AddEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  foodTruckId: z.string().min(1, "Food truck is required"),
  phoneNo: z.string().min(1, "Phone number is required"),
  DOB: z.string().min(1, "Date of birth is required"),
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUser(request);

  const manager = await db.manager.findUnique({
    where: { userId: user.id },
    include: {
      foodTruck: {
        include: {
          staff: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return json({ employees: manager?.foodTruck?.staff ?? [], user });
};

interface ActionData {
  success: boolean;
  fieldErrors?: inferErrors<typeof AddEmployeeSchema>;
}

export const action: ActionFunction = async ({ request }) => {
  const { fields, fieldErrors } = await validateAction(request, AddEmployeeSchema);
  if (fieldErrors) {
    return badRequest<ActionData>({ success: false, fieldErrors });
  }

  await db.$transaction(async (tx) => {
    const profile = await tx.profile.create({
      data: {
        firstName: fields.firstName,
        lastName: fields.lastName,
        phoneNo: fields.phoneNo,
        dob: new Date(fields.DOB),
      },
    });

    await tx.user.create({
      data: {
        email: fields.email,
        passwordHash: await createPasswordHash(fields.password),
        role: "STAFF",
        profileId: profile.id,
        staff: {
          create: {
            foodTruckId: fields.foodTruckId,
          },
        },
      },
    });
  });

  return json({ success: true });
};

export default function ManageEmployees() {
  const fetcher = useFetcherCallback<ActionData>({
    onSuccess: () => {
      setModalOpen(false);
    },
  });

  const { employees, user } = useLoaderData<typeof loader>();

  const [modalOpen, setModalOpen] = React.useState(false);

  const [dob, setDob] = React.useState<Date | null>(null);

  const isSubmitting = fetcher.state !== "idle";

  return (
    <>
      <TailwindContainer className="lg:max-w-full">
        <div className="mt-2 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center justify-center">
              <h1 className="text-4xl font-semibold text-gray-900">Staff</h1>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-orange-500 text-white hover:bg-orange-400"
              >
                <span className="ml-2">Add</span>
              </Button>
            </div>
          </div>
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
                      >
                        Name
                      </th>

                      <th
                        scope="col"
                        className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
                      >
                        Phone No
                      </th>
                      <th
                        scope="col"
                        className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
                      >
                        DOB
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.user.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
                          {employee.user.profile?.firstName} {employee.user.profile?.lastName}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
                          {employee.user.email}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
                          {employee.user.profile?.phoneNo}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
                          {formatDate(employee.user.profile?.dob ?? "")}
                        </td>

                        <td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </TailwindContainer>

      <Dialog open={modalOpen} onOpenChange={() => setModalOpen(false)}>
        <DialogContent>
          <DialogHeader>Add Staff</DialogHeader>
          <fetcher.Form method="post">
            <fieldset
              disabled={isSubmitting}
              className="flex flex-col gap-4 items-center justify-center"
            >
              <input
                hidden
                name="foodTruckId"
                defaultValue={(user as any)?.manager?.foodTruckId ?? ""}
              />
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input type="text" name="firstName" required />
                {fetcher.data?.fieldErrors?.firstName && (
                  <div className="text-red-600">{fetcher.data.fieldErrors.firstName}</div>
                )}
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input type="text" name="lastName" required />
                {fetcher.data?.fieldErrors?.lastName && (
                  <div className="text-red-600">{fetcher.data.fieldErrors.lastName}</div>
                )}
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input name="email" type="email" required />
                {fetcher.data?.fieldErrors?.email && (
                  <div className="text-red-600">{fetcher.data.fieldErrors.email}</div>
                )}
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input type="password" name="password" required />
                {fetcher.data?.fieldErrors?.password && (
                  <div className="text-red-600">{fetcher.data.fieldErrors.password}</div>
                )}
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="phoneNo">Phone Number</Label>
                <Input name="phoneNo" type="tel" required />
                {fetcher.data?.fieldErrors?.phoneNo && (
                  <div className="text-red-600">{fetcher.data.fieldErrors.phoneNo}</div>
                )}
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label>Date of Birth</Label>
                <DatePicker
                  value={dob || undefined}
                  onChange={(date) => setDob(date || null)}
                  name="DOB"
                />
                <input type="hidden" name="DOB" value={dob ? dob.toISOString() : ""} />
                {fetcher.data?.fieldErrors?.DOB && (
                  <div className="text-red-600">{fetcher.data.fieldErrors.DOB}</div>
                )}
              </div>

              <DialogFooter>
                <div className="mt-1 flex items-center justify-end gap-4">
                  <DialogClose asChild>
                    <Button disabled={isSubmitting} variant="destructive">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Create</Button>
                </div>
              </DialogFooter>
            </fieldset>
          </fetcher.Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
