"use client";

import { useAuth } from "@clerk/nextjs";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

function ProBadge({ isSignedIn }: { isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const orderDetails = useQuery(api.polar.getProOrderDetails, isSignedIn ? {} : "skip");

  if (!orderDetails) return null;

  const purchaseDate = new Date(orderDetails.purchasedAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: orderDetails.currency.toUpperCase(),
  }).format(orderDetails.amount / 100);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-950/60"
      >
        PRO
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pro</DialogTitle>
            <DialogDescription>
              One-time purchase — lifetime access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
                <span className="text-muted-foreground font-medium">paid</span>
                <span className="font-mono text-foreground">{formattedAmount}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
                <span className="text-muted-foreground font-medium">date</span>
                <span className="font-mono text-foreground">{purchaseDate}</span>
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              Thank you for supporting NPZ Viewer. Your purchase helps keep the
              project running and funds future development.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AuthButton() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <ProBadge isSignedIn={!!isSignedIn} />
        <UserButton />
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <Button variant="outline" size="sm">
        Sign in
      </Button>
    </SignInButton>
  );
}
