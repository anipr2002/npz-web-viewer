"use client";

import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import RateLimitedCheckoutButton from "./RateLimitedCheckoutButton";
import { Lock } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
}

export default function PremiumGate({ children, feature }: PremiumGateProps) {
  const { isSignedIn } = useAuth();
  const premium = useQuery(
    api.polar.isPremium,
    isSignedIn ? {} : "skip"
  );

  // If user is premium or not signed in (show content freely for unauthenticated browsing, gate on action)
  // Actually: gate for non-premium users
  const isPremium = premium === true;

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[2px] opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
        <Lock className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {feature}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Unlock with Pro for a one-time payment
        </p>
        {isSignedIn ? (
          <RateLimitedCheckoutButton
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Unlock from $3.49
          </RateLimitedCheckoutButton>
        ) : (
          <p className="text-xs text-muted-foreground">
            Sign in to unlock this feature
          </p>
        )}
      </div>
    </div>
  );
}
