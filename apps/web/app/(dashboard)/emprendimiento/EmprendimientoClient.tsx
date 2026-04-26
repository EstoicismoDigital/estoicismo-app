"use client";
import { useMemo, useState } from "react";
import {
  Plus,
  Briefcase,
  Sparkles,
  Compass,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Users2,
  Package,
  ListChecks,
  Receipt,
} from "lucide-react";
import { clsx } from "clsx";
import {
  useBusinessProfile,
  useUpsertBusinessProfile,
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useClients,
  useCreateClient,
  useDeleteClient,
  useBusinessTasks,
  useCreateBusinessTask,
  useUpdateBusinessTask,
  useDeleteBusinessTask,
  useIdeas,
  useCreateIdea,
  useUpdateIdea,
  useDeleteIdea,
  useBusinessSales,
  useCreateSale,
} from "../../../hooks/useBusiness";
import {
  useFinanceCategories,
  useCreateTransaction,
} from "../../../hooks/useFinance";
import { BrainstormWizard } from "../../../components/emprendimiento/BrainstormWizard";
import { IdeasList } from "../../../components/emprendimiento/IdeasList";
import { SaleQuickModal } from "../../../components/emprendimiento/SaleQuickModal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { formatMoney } from "../../../lib/finance";
import type { BusinessStatus } from "@estoicismo/supabase";

const STATUS_LABELS: Record<BusinessStatus, string> = {
  exploring: "Explorando ideas",
  starting: "Arrancando",
  active: "En operación",
  paused: "En pausa",
};

export function EmprendimientoClient() {
  const { data: profile } = useBusinessProfile();
  const upsertProfile = useUpsertBusinessProfile();

  const status = profile?.status ?? "exploring";

  return (
    <div data-module="emprendimiento" className="min-h-screen bg-bg">
      <section className="bg-bg-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">
            Emprendimiento
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl leading-tight">
            {status === "exploring"
              ? "Antes de la marca, está la pregunta."
              : "Lo pequeño bien hecho — eso es todo."}
          </h1>
          <div className="flex items-center gap-3 mt-4">
            <StatusPill
              current={status}
              onChange={(s) =>
                upsertProfile.mutate({ status: s, ...profile })
              }
            />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {(status === "exploring" || status === "starting") && <ExploringSection />}
        {(status === "active" || status === "starting") && (
          <ActiveSection profileName={profile?.name ?? null} />
        )}
        {status === "paused" && (
          <div className="rounded-card border border-line bg-bg-alt/40 p-6 text-center space-y-2">
            <Briefcase className="mx-auto text-muted" size={28} />
            <p className="text-sm text-ink font-semibold">Tu negocio está en pausa</p>
            <p className="text-[12px] text-muted">
              Cuando vuelvas a moverlo, cambia el estado arriba.
            </p>
          </div>
        )}

        <ProfileCard profile={profile ?? null} onSave={(p) => upsertProfile.mutateAsync(p)} />
      </div>
    </div>
  );
}

function StatusPill(props: { current: BusinessStatus; onChange: (s: BusinessStatus) => void }) {
  const order: BusinessStatus[] = ["exploring", "starting", "active", "paused"];
  return (
    <div className="flex flex-wrap gap-1">
      {order.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => props.onChange(s)}
          className={clsx(
            "px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border transition-colors",
            props.current === s
              ? "bg-accent text-bg border-accent"
              : "border-white/20 text-white/70 hover:border-white/40"
          )}
        >
          {STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}

function ProfileCard(props: {
  profile: import("@estoicismo/supabase").BusinessProfile | null;
  onSave: (input: Partial<import("@estoicismo/supabase").BusinessProfile>) => Promise<unknown>;
}) {
  const { profile, onSave } = props;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [desc, setDesc] = useState(profile?.description ?? "");
  const [purpose, setPurpose] = useState(profile?.purpose_link ?? "");

  return (
    <section className="rounded-card border border-line bg-bg-alt/40 p-4 sm:p-5 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Perfil
          </p>
          <h2 className="font-display italic text-lg text-ink">
            {profile?.name ?? "Tu negocio"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setName(profile?.name ?? "");
            setDesc(profile?.description ?? "");
            setPurpose(profile?.purpose_link ?? "");
            setEditing(!editing);
          }}
          className="text-[10px] font-mono uppercase tracking-widest text-muted hover:text-ink inline-flex items-center gap-1"
        >
          <Pencil size={11} /> {editing ? "Cancelar" : "Editar"}
        </button>
      </div>
      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del negocio"
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            placeholder="Descripción breve"
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink resize-none focus:outline-none focus:border-accent"
          />
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={2}
            placeholder="¿Qué propósito mayor persigue este negocio? (link a tu MPD)"
            className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-ink resize-none focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={async () => {
              await onSave({
                name: name.trim() || null,
                description: desc.trim() || null,
                purpose_link: purpose.trim() || null,
              });
              setEditing(false);
            }}
            className="w-full py-2 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest"
          >
            Guardar
          </button>
        </div>
      ) : (
        <>
          {profile?.description && (
            <p className="text-[12px] text-muted leading-relaxed">{profile.description}</p>
          )}
          {profile?.purpose_link && (
            <p className="text-[12px] italic text-accent border-l-2 border-accent/40 pl-2 mt-1.5">
              "{profile.purpose_link}"
            </p>
          )}
          {!profile?.description && !profile?.purpose_link && (
            <p className="text-[11px] text-muted italic">
              Define tu negocio para empezar a llevar registro.
            </p>
          )}
        </>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Sección "Explorando" — brainstorm + ideas guardadas
// ─────────────────────────────────────────────────────────────

function ExploringSection() {
  const { data: ideas = [] } = useIdeas();
  const createIdeaM = useCreateIdea();
  const updateIdeaM = useUpdateIdea();
  const deleteIdeaM = useDeleteIdea();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <section className="space-y-5">
      <div className="rounded-card bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 p-4 flex gap-3">
        <Compass className="text-accent shrink-0" size={20} />
        <div>
          <p className="text-sm font-semibold text-ink">¿Aún no decides el rubro?</p>
          <p className="text-[12px] text-muted">
            Responde 4 preguntas y te muestro ideas que conectan con quién eres.
          </p>
        </div>
      </div>

      <BrainstormWizard
        onSaveIdea={(i) =>
          createIdeaM.mutate({
            title: i.title,
            description: i.description,
            category: i.category,
          })
        }
      />

      <IdeasList
        ideas={ideas}
        onToggleFavorite={(id, current) =>
          updateIdeaM.mutate({ id, input: { is_favorite: !current } })
        }
        onDelete={(id) => setConfirmDelete(id)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Eliminar idea?"
        description="Borra la idea de tu lista. No se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await deleteIdeaM.mutateAsync(confirmDelete);
          setConfirmDelete(null);
        }}
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Sección "Activo" — dashboard del negocio
// ─────────────────────────────────────────────────────────────

function ActiveSection(props: { profileName: string | null }) {
  const { data: products = [] } = useProducts();
  const createProd = useCreateProduct();
  const updateProd = useUpdateProduct();
  const deleteProd = useDeleteProduct();

  const { data: clients = [] } = useClients();
  const createCli = useCreateClient();
  const deleteCli = useDeleteClient();

  const { data: tasks = [] } = useBusinessTasks();
  const createTask = useCreateBusinessTask();
  const updateTask = useUpdateBusinessTask();
  const deleteTask = useDeleteBusinessTask();

  const { data: sales = [] } = useBusinessSales({ limit: 100 });
  const createSale = useCreateSale();
  const { data: categories = [] } = useFinanceCategories();
  const createTx = useCreateTransaction();

  const [saleOpen, setSaleOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [clientName, setClientName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");

  const incomeCategoryId = useMemo(
    () => categories.find((c) => c.kind === "income" && c.name === "Ventas")?.id ?? null,
    [categories]
  );

  // Stats simples del mes
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthSales = sales.filter(
      (s) => new Date(s.occurred_on + "T00:00:00") >= monthStart
    );
    const total = monthSales.reduce((s, x) => s + Number(x.amount), 0);
    const count = monthSales.length;
    const avg = count > 0 ? total / count : 0;
    return { total, count, avg };
  }, [sales]);

  return (
    <section className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KPI icon={<Receipt size={12} />} label="Mes" value={formatMoney(stats.total, "MXN")} />
        <KPI label="Ventas" value={String(stats.count)} />
        <KPI label="Ticket prom." value={stats.count > 0 ? formatMoney(stats.avg, "MXN") : "—"} />
      </div>

      {/* Quick add venta */}
      <button
        type="button"
        onClick={() => setSaleOpen(true)}
        className="w-full py-3 rounded-card bg-accent text-bg font-mono text-[11px] uppercase tracking-widest hover:opacity-90 inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={14} /> Registrar venta
      </button>

      {/* Productos */}
      <div className="space-y-2">
        <h3 className="font-display italic text-lg text-ink flex items-center gap-1.5">
          <Package size={14} /> Productos / servicios ({products.length})
        </h3>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!productName.trim()) return;
            const price = Number(productPrice) || 0;
            createProd.mutate({ name: productName.trim(), price });
            setProductName("");
            setProductPrice("");
          }}
        >
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Nombre"
            className="flex-1 bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            placeholder="Precio"
            className="w-24 bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!productName.trim()}
            className="px-3 py-2 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest disabled:opacity-40"
          >
            <Plus size={12} className="inline" />
          </button>
        </form>
        {products.length > 0 && (
          <ul className="space-y-1.5">
            {products.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-line bg-bg-alt/30 px-3 py-2 flex items-center justify-between text-sm"
              >
                <span className="text-ink truncate flex-1">{p.name}</span>
                <span className="text-muted text-[12px] mx-2">
                  {formatMoney(Number(p.price), p.currency)}
                </span>
                <button
                  type="button"
                  onClick={() => deleteProd.mutate(p.id)}
                  className="text-muted hover:text-danger p-1"
                  aria-label="Eliminar"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Clientes */}
      <div className="space-y-2">
        <h3 className="font-display italic text-lg text-ink flex items-center gap-1.5">
          <Users2 size={14} /> Clientes ({clients.length})
        </h3>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!clientName.trim()) return;
            createCli.mutate({ name: clientName.trim() });
            setClientName("");
          }}
        >
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Nombre del cliente"
            className="flex-1 bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!clientName.trim()}
            className="px-3 py-2 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest disabled:opacity-40"
          >
            <Plus size={12} className="inline" />
          </button>
        </form>
        {clients.length > 0 && (
          <ul className="space-y-1.5">
            {clients.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-line bg-bg-alt/30 px-3 py-2 flex items-center justify-between text-sm"
              >
                <span className="text-ink truncate">{c.name}</span>
                <button
                  type="button"
                  onClick={() => deleteCli.mutate(c.id)}
                  className="text-muted hover:text-danger p-1"
                  aria-label="Eliminar"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tareas */}
      <div className="space-y-2">
        <h3 className="font-display italic text-lg text-ink flex items-center gap-1.5">
          <ListChecks size={14} /> Tareas ({tasks.filter((t) => !t.is_completed).length} abiertas)
        </h3>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!taskTitle.trim()) return;
            createTask.mutate({ title: taskTitle.trim() });
            setTaskTitle("");
          }}
        >
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="¿Qué necesitas hacer?"
            className="flex-1 bg-bg border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!taskTitle.trim()}
            className="px-3 py-2 rounded-lg bg-accent text-bg font-mono text-[10px] uppercase tracking-widest disabled:opacity-40"
          >
            <Plus size={12} className="inline" />
          </button>
        </form>
        {tasks.length > 0 && (
          <ul className="space-y-1">
            {tasks.map((t) => (
              <li
                key={t.id}
                className={clsx(
                  "rounded-lg border px-3 py-2 flex items-center gap-2 text-sm transition-opacity",
                  t.is_completed
                    ? "border-line/40 bg-bg-alt/20 opacity-50"
                    : "border-line bg-bg-alt/30"
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    updateTask.mutate({
                      id: t.id,
                      input: { is_completed: !t.is_completed },
                    })
                  }
                  className={clsx(
                    "shrink-0",
                    t.is_completed ? "text-success" : "text-muted hover:text-accent"
                  )}
                >
                  {t.is_completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
                <span
                  className={clsx(
                    "flex-1 text-ink",
                    t.is_completed && "line-through text-muted"
                  )}
                >
                  {t.title}
                </span>
                <button
                  type="button"
                  onClick={() => deleteTask.mutate(t.id)}
                  className="text-muted hover:text-danger p-1"
                  aria-label="Eliminar"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ventas recientes */}
      {sales.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display italic text-lg text-ink">Últimas ventas</h3>
          <ul className="space-y-1.5">
            {sales.slice(0, 8).map((s) => {
              const product = products.find((p) => p.id === s.product_id);
              const client = clients.find((c) => c.id === s.client_id);
              return (
                <li
                  key={s.id}
                  className="rounded-lg border border-line bg-bg-alt/30 px-3 py-2 flex items-center justify-between text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate">
                      {product?.name ?? "Venta personalizada"}
                      {client && (
                        <span className="text-muted">
                          {" "}
                          · {client.name}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted">
                      {new Date(s.occurred_on + "T00:00:00").toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                      })}
                      {s.quantity > 1 && ` · ${s.quantity} unidades`}
                    </p>
                  </div>
                  <span className="text-success font-semibold">
                    {formatMoney(Number(s.amount), s.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <SaleQuickModal
        open={saleOpen}
        products={products}
        clients={clients}
        saving={createSale.isPending}
        onClose={() => setSaleOpen(false)}
        onSave={async (input) => {
          let txId: string | null = null;
          if (input.log_as_income && incomeCategoryId) {
            try {
              const tx = await createTx.mutateAsync({
                amount: input.amount,
                kind: "income",
                category_id: incomeCategoryId,
                occurred_on: input.occurred_on,
                note: `Venta${input.note ? ` · ${input.note}` : ""}`,
                source: "manual",
              });
              txId = tx.id;
            } catch {
              txId = null;
            }
          }
          await createSale.mutateAsync({
            product_id: input.product_id,
            client_id: input.client_id,
            quantity: input.quantity,
            amount: input.amount,
            occurred_on: input.occurred_on,
            note: input.note,
            transaction_id: txId,
          });
          setSaleOpen(false);
        }}
      />
    </section>
  );
}

function KPI(props: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg-alt/40 p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted flex items-center gap-1">
        {props.icon}
        {props.label}
      </p>
      <p className="text-base font-display italic text-ink">{props.value}</p>
    </div>
  );
}
