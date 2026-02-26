import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/compliance")({
  component: CompliancePage,
});

function CompliancePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-semibold">Product and Scope Explanation</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        This page explains how each product area works and how requested scopes are used.
      </p>

      <div className="space-y-6 text-sm leading-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-3 text-base font-medium">Products in this app</h2>
          <div className="space-y-3">
            <p>
              <strong>Collector Web App:</strong> A dashboard where users request comment scraping
              jobs by selecting a platform and providing a target ID.
            </p>
            <p>
              <strong>Collector API:</strong> A backend endpoint (`comments.scrapeComments`) that
              retrieves comments from supported platform APIs and returns normalized comment data for
              display/analysis in the web app.
            </p>
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-3 text-base font-medium">How the requested scope is used</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-2 font-medium">Scope</th>
                  <th className="px-2 py-2 font-medium">Where used</th>
                  <th className="px-2 py-2 font-medium">Why it is needed</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-2 py-2 font-mono">video.list</td>
                  <td className="px-2 py-2">TikTok integration in Collector API</td>
                  <td className="px-2 py-2">
                    Needed to access TikTok video resources used by the app to retrieve public
                    comment data tied to a provided video ID. The app uses this for read-only
                    retrieval and analysis workflows.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-3 text-base font-medium">Data handling scope</h2>
          <p>
            Collector reads platform data required to return comment results. It does not publish,
            modify, or delete third-party platform content through the requested scope.
          </p>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-3 text-base font-medium">Changes in this version</h2>
          <p className="mb-2">Revision date: February 25, 2026</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Added a public Privacy Policy page.</li>
            <li>Added a public Terms of Service page.</li>
            <li>
              Added this Product and Scope Explanation page with explicit `video.list` usage
              details.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
