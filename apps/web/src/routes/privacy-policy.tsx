import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-semibold">Privacy Policy</h1>
      <p className="mb-6 text-sm text-muted-foreground">Last updated: February 25, 2026</p>

      <div className="space-y-6 text-sm leading-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">1. What this app does</h2>
          <p>
            Collector aggregates public comment data from connected social platforms (Facebook,
            Instagram, YouTube, and TikTok) so users can review engagement in one place.
          </p>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">2. Data we process</h2>
          <p>
            We process platform-provided identifiers and comment data needed to return requested
            analytics results, such as comment text, comment ID, author display name, timestamps,
            like counts, and reply counts.
          </p>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">3. How data is used</h2>
          <p>
            Data is used only to fulfill user-initiated requests for comment retrieval and analysis
            inside Collector. We do not use this data to post content, run ads, or sell user data.
          </p>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">4. Sharing and disclosure</h2>
          <p>
            We do not sell personal data. Data is only shared with infrastructure providers required
            to operate the service and only for service delivery and security.
          </p>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">5. Retention and deletion</h2>
          <p>
            We retain data only as long as needed for operational and security purposes. Users may
            request deletion of data associated with their account or workspace.
          </p>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">6. Contact</h2>
          <p>
            For privacy questions or deletion requests, contact the app administrator for your
            Collector deployment.
          </p>
        </section>
      </div>
    </div>
  );
}
