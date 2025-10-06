// src/routes/BillingResult.tsx
export function BillingSuccess() {
  return (
    <div className="container mx-auto py-16">
      <h1 className="text-2xl font-bold">Thanks! 🎉</h1>
      <p className="text-muted-foreground">Your subscription setup is complete. It’ll activate once PayPal confirms.</p>
    </div>
  );
}

export function BillingCancel() {
  return (
    <div className="container mx-auto py-16">
      <h1 className="text-2xl font-bold">Payment canceled</h1>
      <p className="text-muted-foreground">No worries—try again whenever you’re ready.</p>
    </div>
  );
}
