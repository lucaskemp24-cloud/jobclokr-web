import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white px-8 py-12 shadow-sm sm:px-14">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            JobClokr Support
          </h1>

          <p className="mt-4 text-xl text-slate-600">
            Need help with JobClokr? We're here to help.
          </p>
        </div>

        {/* Support Information */}
        <div className="mt-12 space-y-10">
          {/* Getting Help */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900">
              Getting Help
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              If you need assistance with your JobClokr account,
              time tracking, scheduling, projects, employees, or
              another feature, contact JobClokr Support.
            </p>
          </section>

          {/* Account & Login Help */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900">
              Account &amp; Login Help
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              If you're having trouble signing in, contact your
              company administrator or JobClokr Support for
              assistance.
            </p>
          </section>

          {/* Contact Support */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900">
              Contact Support
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Have a question or need assistance? Contact the
              JobClokr team and we'll help you get back to work.
            </p>

            <div className="mt-5">
              <p className="text-lg text-slate-700">
                <span className="font-semibold text-slate-900">
                  Email:{" "}
                </span>

                <a
                  href="mailto:support@jobclokr.com"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  support@jobclokr.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Return Button */}
        <div className="mt-12 border-t border-slate-200 pt-8 text-center">
          <Link
            href="/"
            className="inline-flex rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Return to JobClokr
          </Link>
        </div>
      </div>
    </main>
  );
}