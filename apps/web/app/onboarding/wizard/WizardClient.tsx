"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepProgress } from "../../../components/onboarding/StepProgress";
import { StepWelcome } from "../../../components/onboarding/StepWelcome";
import { StepMPD } from "../../../components/onboarding/StepMPD";
import { StepIntrospection } from "../../../components/onboarding/StepIntrospection";
import { StepReady } from "../../../components/onboarding/StepReady";

const STEPS = ["welcome", "mpd", "introspection", "ready"] as const;
type Step = (typeof STEPS)[number];

export function WizardClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const idx = STEPS.indexOf(step);

  function next() {
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1]);
      // Scroll al inicio en móvil
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      router.push("/");
      router.refresh();
    }
  }

  function back() {
    if (idx > 0) {
      setStep(STEPS[idx - 1]);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <StepProgress current={idx} total={STEPS.length} />
        <div className="mt-8">
          {step === "welcome" && <StepWelcome onNext={next} />}
          {step === "mpd" && <StepMPD onNext={next} onBack={back} />}
          {step === "introspection" && (
            <StepIntrospection onNext={next} onBack={back} />
          )}
          {step === "ready" && <StepReady onFinish={next} onBack={back} />}
        </div>
      </div>
    </main>
  );
}
