"use client";
import { useMemo, useState } from "react";
import { Plus, PiggyBank, Pencil, Trash2, CheckCircle2, Trophy, Calendar } from "lucide-react";
import { clsx } from "clsx";
import {
  useSavingsGoals,
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
  useSavingsContributions,
  useCreateContribution,
} from "../../../../hooks/useSavings";
import { SavingsGoalModal } from "../../../../components/ahorro/SavingsGoalModal";
import { ContributeModal } from "../../../../components/ahorro/ContributeModal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { progressForAllGoals, type GoalProgress } from "../../../../lib/savings/projection";
import { formatMoney } from "../../../../lib/finance";
import type { SavingsGoal, CreateGoalInput } from "@estoicismo/supabase";

export function SavingsClient() {
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const { data: goals = [] } = useSavingsGoals({ include_completed: includeCompleted });
  const { data: contributions = [] } = useSavingsContributions({ limit: 500 });

  const createM = useCreateSavingsGoal();
  const updateM = useUpdateSavingsGoal();
  const deleteM = useDeleteSavingsGoal();
  const contribM = useCreateContribution();

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavingsGoal | null>(null);
  const [contribGoal, setContribGoal] = useState<SavingsGoal | null>(null);

  const allProgress = useMemo(
    () => progressForAllGoals(goals, contributions),
    [goals, contributions]
  );

  const totals = useMemo(() => {
    let saved = 0;
    let target = 0;
    let completed = 0;
    for (const p of allProgress) {
      saved += p.saved;
      target += p.target;
      if (p.isCompleted) completed++;
    }
    return { saved, target, completed };
  }, [allProgress]);

  async function handleSaveGoal(input: CreateGoalInput) {
    try {
      if (editingGoal) {
        await updateM.mutateAsync({ id: editingGoal.id, input });
      } else {
        await createM.mutateAsync(input);
      }
      setGoalModalOpen(false);
      setEditingGoal(null);
    } catch {
      /* hook toasts */
    }
  }

  return (
    <div data-module="finanzas" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Finanzas · Ahorro
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            Cada peso es una decisión. Decide hoy.
          </h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
            <Stat label="Ahorrado" value={formatMoney(totals.saved, "MXN")} />
            <Stat label="Objetivo total" value={formatMoney(totals.target, "MXN")} />
            <Stat label="Logradas" value={`${totals.completed}`} />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display italic text-xl text-ink">Tus metas</h2>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCompleted}
                onChange={(e) => setIncludeCompleted(e.target.checked)}
                className="rounded"
              />
              Mostrar logradas
            </label>
            <button
              type="button"
              onClick={() => {
                setEditingGoal(null);
                setGoalModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Plus size={12} /> Nueva meta
            </button>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="rounded-card border border-dashed border-line p-8 text-center space-y-2">
            <PiggyBank className="mx-auto text-muted" size={32} />
            <p className="text-sm text-ink font-semibold">Sin metas aún</p>
            <p className="text-[12px] text-muted">
              Empieza con algo concreto: un viaje, un curso, una herramienta.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allProgress.map((p) => (
              <GoalCard
                key={p.goal.id}
                progress={p}
                onContribute={() => setContribGoal(p.goal)}
                onEdit={() => {
                  setEditingGoal(p.goal);
                  setGoalModalOpen(true);
                }}
                onDelete={() => setConfirmDelete(p.goal)}
                onMarkCompleted={async () => {
                  await updateM.mutateAsync({
                    id: p.goal.id,
                    input: { is_completed: !p.goal.is_completed },
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      <SavingsGoalModal
        open={goalModalOpen}
        goal={editingGoal}
        saving={createM.isPending || updateM.isPending}
        onClose={() => {
          setGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />
      <ContributeModal
        open={!!contribGoal}
        goal={contribGoal}
        saving={contribM.isPending}
        onClose={() => setContribGoal(null)}
        onSave={async (input) => {
          if (!contribGoal) return;
          await contribM.mutateAsync({
            goal_id: contribGoal.id,
            amount: input.amount,
            note: input.note,
            occurred_on: input.occurred_on,
          });
          // Si completó la meta con este abono, marcar.
          const after =
            (allProgress.find((p) => p.goal.id === contribGoal.id)?.saved ?? 0) + input.amount;
          if (!contribGoal.is_completed && after >= Number(contribGoal.target_amount)) {
            await updateM.mutateAsync({
              id: contribGoal.id,
              input: { is_completed: true },
            });
          }
          setContribGoal(null);
        }}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Eliminar meta?"
        description={`Borra ${confirmDelete?.name ?? "la meta"} y todos sus aportes. No se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteM.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/50">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function GoalCard(props: {
  progress: GoalProgress;
  onContribute: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkCompleted: () => void;
}) {
  const { progress, onContribute, onEdit, onDelete, onMarkCompleted } = props;
  const { goal, saved, percent, remaining, daysToDeadline, monthlyRequired, etaDate, isCompleted } = progress;

  return (
    <div
      className={clsx(
        "rounded-card border p-4 space-y-3 relative overflow-hidden",
        isCompleted ? "bg-success/10 border-success/40" : "bg-bg-alt/40 border-line"
      )}
      style={{
        background: !isCompleted
          ? `linear-gradient(180deg, ${goal.color}1A, transparent 60%)`
          : undefined,
        borderColor: !isCompleted ? `${goal.color}40` : undefined,
      }}
    >
      {goal.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={goal.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
      )}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted truncate">
            {isCompleted ? "Lograda 🏆" : "En progreso"}
          </p>
          <h3 className="font-display italic text-lg text-ink truncate">
            {goal.name}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1 text-muted hover:text-ink rounded">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1 text-muted hover:text-danger rounded">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-2xl font-display italic text-ink">
            {formatMoney(saved, goal.currency)}
          </span>
          <span className="text-xs text-muted">
            de {formatMoney(Number(goal.target_amount), goal.currency)}
          </span>
        </div>
        <div className="h-2 bg-line/30 rounded-full overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.min(100, percent)}%`,
              backgroundColor: goal.color,
            }}
          />
        </div>
        <p className="text-[11px] text-muted mt-1">
          {percent.toFixed(0)}% completado
          {!isCompleted && remaining > 0 && (
            <span> · faltan {formatMoney(remaining, goal.currency)}</span>
          )}
        </p>
      </div>

      {!isCompleted && (
        <div className="relative z-10 space-y-1.5 text-[11px] text-muted">
          {daysToDeadline !== null && (
            <p className="flex items-center gap-1.5">
              <Calendar size={11} />
              {daysToDeadline > 0
                ? `${daysToDeadline} días para deadline`
                : daysToDeadline === 0
                ? "Vence hoy"
                : `Vencida hace ${Math.abs(daysToDeadline)} días`}
            </p>
          )}
          {monthlyRequired !== null && monthlyRequired > 0 && (
            <p>
              Necesitas {formatMoney(monthlyRequired, goal.currency)}/mes para llegar a tiempo
            </p>
          )}
          {etaDate && monthlyRequired === null && (
            <p>
              Al ritmo actual: {etaDate.toLocaleDateString("es-MX", { month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      )}

      <div className="relative z-10 flex gap-2 pt-1">
        {!isCompleted ? (
          <>
            <button
              type="button"
              onClick={onContribute}
              className="flex-1 py-2 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest hover:opacity-90"
            >
              Abonar
            </button>
            <button
              type="button"
              onClick={onMarkCompleted}
              className="px-3 py-2 rounded-lg border border-line text-muted hover:text-success hover:border-success/40 inline-flex items-center"
              aria-label="Marcar como completada"
            >
              <Trophy size={14} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onMarkCompleted}
            className="flex-1 py-2 rounded-lg border border-line text-muted hover:text-ink inline-flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={12} /> Reactivar meta
          </button>
        )}
      </div>
    </div>
  );
}
