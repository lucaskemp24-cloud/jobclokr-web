import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-12">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-slate-900">
              JobClokr Support
            </h1>

            <p className="mt-4 text-lg text-slate-600">
              Need help with JobClokr? We&apos;re here to help.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Getting Help
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                If you need assistance with your JobClokr account,
                time tracking, scheduling, projects, employees, or
                another feature, contact JobClokr Support.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Account & Login Help
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                If you&apos;re having trouble signing in, contact your
                company administrator or JobClokr Support for assistance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Contact Support
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Have a question or need assistance? Contact the JobClokr
                team and we&apos;ll help you get back to work.
              </p>
            </section>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-8 text-center">
            <Link
              href="/"
              className="inline-flex rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Return to JobClokr
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}