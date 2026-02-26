import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms-of-service")({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-semibold">Terms of Service</h1>
      <p className="mb-6 text-sm text-muted-foreground">Last updated: February 25, 2026</p>

      <div className="space-y-6 text-sm leading-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">1. Acceptance</h2>
          <p>
            By using Collector, you agree to these terms and to comply with platform rules for any
            connected services.
          </p>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">2. Permitted use</h2>
          <p>
            You may use Collector to retrieve and analyze authorized comment data. You may not use
            Collector to violate laws, platform policies, or third-party rights.
          </p>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">3. Account and access</h2>
          <p>
            You are responsible for your access tokens, configuration, and activity performed
            through your account and API credentials.
          </p>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">4. Service availability</h2>
          <p>
            Platform APIs may change or become unavailable. Collector may change, suspend, or limit
            functionality as needed for stability, security, or compliance.
          </p>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-2 text-base font-medium">5. Disclaimer and liability</h2>
          <p>
            Collector is provided "as is" without warranties. To the fullest extent allowed by law,
            the service provider is not liable for indirect or consequential damages.
          </p>
        </section>
      </div>
    </div>
  );
}
