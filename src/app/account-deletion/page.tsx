export default function AccountDeletionPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-bold">
          JobClokr Account Deletion
        </h1>

        <p className="mb-4">
          JobClokr users may request deletion of their account and associated
          personal data.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">
          How to request account deletion
        </h2>

        <p className="mb-4">
          To request deletion of your JobClokr account, please contact your
          organization's JobClokr administrator or send an account deletion
          request to our support team.
        </p>

        <p className="mb-4">
          When submitting a request, include the email address associated with
          your JobClokr account so we can identify the correct account.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">
          What will be deleted
        </h2>

        <p className="mb-4">
          After a valid deletion request is processed, personal account
          information associated with the user will be deleted or anonymized
          where appropriate.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">
          Data that may be retained
        </h2>

        <p className="mb-4">
          Certain business records, including timekeeping or work records, may
          be retained when required for legitimate business, accounting, legal,
          security, or regulatory purposes. Where possible, retained records
          will no longer be associated with an active user account.
        </p>

        <h2 className="mb-3 mt-8 text-xl font-semibold">
          Need help?
        </h2>

        <p>
          Contact JobClokr support at{" "}
          <a
            href="mailto:support@jobclokr.com"
            className="text-blue-600 underline"
          >
            support@jobclokr.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}