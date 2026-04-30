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

  function skipAll() {
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex-1">
            <StepProgress current={idx} total={STEPS.length} />
          </div>
          <button
            type="button"
            onClick={skipAll}
            className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink whitespace-nowrap underline-offset-2 hover:underline"
          >
            Saltar todo
          </button>
        </div>
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
