"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { formatSAR } from "@/lib/format";
import { moveDeal } from "./actions";

export type BoardStage = { id: string; name: string; kind: "open" | "won" | "lost" };
export type BoardDeal = {
  id: string;
  title: string;
  value: number;
  stage_id: string;
  lost_reason: string | null;
  contacts: { id: string; name: string } | null;
};

const TONE = { open: "bg-slate-100", won: "bg-brand-50", lost: "bg-red-50" };

export function Board({ stages, deals }: { stages: BoardStage[]; deals: BoardDeal[] }) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [optimistic, move] = useOptimistic(deals, (state, { id, stageId }: { id: string; stageId: string }) =>
    state.map((d) => (d.id === id ? { ...d, stage_id: stageId } : d)),
  );

  function drop(dealId: string, stage: BoardStage) {
    setOver(null);
    const deal = optimistic.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === stage.id) return;
    let reason: string | undefined;
    if (stage.kind === "lost") {
      reason = window.prompt("سبب خسارة الصفقة (إلزامي):")?.trim();
      if (!reason) return;
    }
    setError(null);
    startTransition(async () => {
      move({ id: dealId, stageId: stage.id });
      const err = await moveDeal(dealId, stage.id, reason);
      if (err) setError(err);
    });
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const items = optimistic.filter((d) => d.stage_id === stage.id);
          const total = items.reduce((a, d) => a + Number(d.value), 0);
          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage.id);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => drop(e.dataTransfer.getData("text/plain"), stage)}
              className={`w-64 shrink-0 rounded-xl p-3 ${TONE[stage.kind]} ${over === stage.id ? "ring-2 ring-brand-600" : ""}`}
            >
              <div className="mb-3">
                <p className="font-semibold">
                  {stage.name} <span className="text-sm text-slate-400">({items.length})</span>
                </p>
                <p className="text-xs text-slate-500">{formatSAR(total)}</p>
              </div>
              <div className="min-h-24 space-y-2">
                {items.map((d) => (
                  <div
                    key={d.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
                    className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm active:cursor-grabbing"
                  >
                    <p className="font-medium">{d.title}</p>
                    <p className="text-slate-500">{formatSAR(d.value)}</p>
                    {d.contacts && (
                      <Link href={`/contacts/${d.contacts.id}`} className="text-xs text-brand-700">
                        {d.contacts.name}
                      </Link>
                    )}
                    {d.lost_reason && <p className="mt-1 text-xs text-red-600">السبب: {d.lost_reason}</p>}
                    <select
                      aria-label="نقل إلى مرحلة"
                      className="mt-2 w-full rounded border border-slate-200 text-xs md:hidden"
                      value={d.stage_id}
                      onChange={(e) => drop(d.id, stages.find((s) => s.id === e.target.value)!)}
                    >
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
