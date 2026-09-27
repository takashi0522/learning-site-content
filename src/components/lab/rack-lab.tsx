"use client";

import { useCallback, useMemo, useState } from "react";
import type { Lab, RackItem, RackMission } from "@/lib/labs";
import {
  centerOfMassU,
  feedVa,
  isSideMounted,
  layout,
  outOfReach,
  runChecks,
  totalKg,
  totals,
  type Placed,
} from "@/lib/rack";
import { useProgress } from "@/lib/progress";
import { NextLinks } from "./next-links";
import { RackView } from "./rack-view";

let seq = 0;
const place = (item: RackItem): Placed => ({ key: `${item.id}-${seq++}`, item });

function presetOf(mission: RackMission, catalog: RackItem[]): Placed[] {
  return (mission.preset ?? [])
    .map((id) => catalog.find((c) => c.id === id))
    .filter((item): item is RackItem => Boolean(item))
    .map(place);
}

/**
 * 組み立てて検証する形式のラボ。
 *
 * 正解を 1 つ用意して当てさせるのではなく、**制約を全部同時に満たせる構成を探させる**。
 * お題は短く区切って積み上げる。全部の制約を最初から出すと、初級者には長すぎる。
 */
export function RackLab({ lab }: { lab: Lab }) {
  const spec = lab.rack!;
  const missions = spec.missions;
  const [missionIndex, setMissionIndex] = useState(0);
  const mission = missions[missionIndex];

  const [placed, setPlaced] = useState<Placed[]>(() => presetOf(missions[0], spec.catalog));
  const [verified, setVerified] = useState(false);
  const [cleared, setCleared] = useState<boolean[]>(() => missions.map(() => false));
  const { recordLab } = useProgress();

  // お題ごとに給電を差し替えられる。以降の計算はすべてこの実効 spec を通す。
  const active = useMemo(
    () => (mission.feeds ? { ...spec, feeds: mission.feeds } : spec),
    [spec, mission],
  );

  const t = useMemo(() => totals(placed, active), [placed, active]);
  const slots = useMemo(
    () => layout(placed, active).filter((s) => !isSideMounted(s.placed.item)),
    [placed, active],
  );
  const sideMounted = useMemo(() => placed.filter((p) => isSideMounted(p.item)), [placed]);
  const results = useMemo(() => runChecks(placed, active, mission), [placed, active, mission]);
  // ケーブル到達を問うていないお題では出さない。
  // PDU がカタログにすら無いお題で「電源が届かない」と出ると、ただのノイズになる。
  const unreachable = useMemo(() => {
    const reachCheck = mission.checks.find((c) => c.kind === "reach");
    if (!reachCheck) return new Set<string>();
    return new Set(outOfReach(placed, active, reachCheck.via ?? "pdu").map((s) => s.placed.key));
  }, [placed, active, mission]);

  const reachLabel =
    mission.checks.find((c) => c.kind === "reach")?.via === "switch"
      ? "ネットワークが届かない"
      : "電源が届かない";

  // 重量を問うお題でだけ、重量パネルを出す
  const weightCheck = mission.checks.find((c) => c.kind === "weight");
  const kgTotal = totalKg(placed);
  const com = centerOfMassU(placed, active);
  const allOk = results.every((r) => r.ok);

  const catalog = useMemo(
    () =>
      mission.available
        ? spec.catalog.filter((item) => mission.available!.includes(item.id))
        : spec.catalog,
    [mission, spec.catalog],
  );

  const add = useCallback(
    (item: RackItem) => {
      setVerified(false);
      setPlaced((prev) => {
        const used = prev
          .filter((p) => !isSideMounted(p.item))
          .reduce((sum, p) => sum + p.item.u, 0);
        if (used + item.u > spec.units) return prev;
        return [...prev, place(item)];
      });
    },
    [spec.units],
  );

  const remove = useCallback((key: string) => {
    setVerified(false);
    setPlaced((prev) => prev.filter((p) => p.key !== key));
  }, []);

  // ドラッグでの並べ替え。側面マウントを除いた表示順を、元の配列の順序に写し戻す
  const move = useCallback(
    (from: number, to: number) => {
      setVerified(false);
      setPlaced((prev) => {
        const indices = prev.map((p, i) => (isSideMounted(p.item) ? -1 : i)).filter((i) => i >= 0);
        const fromIndex = indices[from];
        const toIndex = indices[to];
        if (fromIndex === undefined || toIndex === undefined) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [],
  );

  const goMission = useCallback(
    (index: number) => {
      setMissionIndex(index);
      setPlaced(presetOf(missions[index], spec.catalog));
      setVerified(false);
    },
    [missions, spec.catalog],
  );

  const verify = useCallback(() => {
    setVerified(true);
    if (!results.every((r) => r.ok)) return;
    setCleared((prev) => prev.map((v, i) => (i === missionIndex ? true : v)));
    if (missions.every((_, i) => (i === missionIndex ? true : cleared[i]))) recordLab(lab.id, 0);
  }, [results, missionIndex, missions, cleared, recordLab, lab.id]);

  const kw = (w: number) => `${(w / 1000).toFixed(2)} kW`;
  const feed = active.feeds[0];
  const allCleared = cleared.every(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap gap-2" aria-label="お題">
        {missions.map((m, i) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => goMission(i)}
              aria-current={i === missionIndex ? "step" : undefined}
              className={[
                "rounded-lg border px-3 py-1.5 text-xs font-bold transition",
                i === missionIndex
                  ? "border-accent bg-accent text-accent-fg"
                  : cleared[i]
                    ? "border-ok/50 bg-ok/10 text-fg"
                    : "border-border text-fg-muted hover:border-accent",
              ].join(" ")}
            >
              <span aria-hidden className="mr-1 opacity-70">
                {cleared[i] ? "✓" : i + 1}
              </span>
              {m.title}
            </button>
          </li>
        ))}
      </ol>

      <section className="rounded-2xl border border-border bg-surface-2 px-5 py-4">
        <p className="text-sm leading-relaxed text-fg-muted">{mission.brief}</p>
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
          {mission.requirements.map((line) => (
            <li key={line} className="flex gap-2 text-sm leading-relaxed text-fg-muted">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-fg-subtle">
          給電は {feed.label} / {active.feeds[1]?.label} の 2 系統。それぞれ{" "}
          {feed.phase === 3 ? "三相" : "単相"} {feed.volts}V {feed.amps}A（
          {(feedVa(feed) / 1000).toFixed(1)} kVA）のブレーカです。
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-surface px-4 py-4">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-xs font-bold text-fg-subtle">ラック（{spec.units}U）</p>
            <p className="font-mono text-xs text-fg-subtle">
              {t.usedUnits} / {spec.units} U
            </p>
          </div>

          <RackView
            units={spec.units}
            slots={slots}
            sideMounted={sideMounted}
            freeUnits={t.freeUnits}
            outOfReachKeys={unreachable}
            reachLabel={reachLabel}
            onRemove={remove}
            onMove={move}
          />

          <p className="mt-2 text-[0.7rem] text-fg-subtle">
            ドラッグで並べ替え、× で取り外せます
          </p>
        </section>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-border bg-surface px-5 py-4">
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold text-fg-subtle">ラック全体の消費電力</p>
              <p className="font-mono text-sm font-bold text-fg">{kw(t.totalWatts)}</p>
            </div>
            {/*
              同じ合計値でも、2 系統で分担している通常時と、
              片方が全部を引き受ける障害時では、上限に対する余裕がまったく違う。
              その差を 2 本のバーとして並べるのがこのラボの主眼。
            */}
            <Meter
              label="通常時 1 系統あたり（A と B で分担）"
              value={t.perFeedWatts}
              limit={t.feedLimitWatts}
              format={kw}
            />
            <Meter
              label="片系統が止まったとき（残りが全部を受ける）"
              value={t.failoverWatts}
              limit={t.feedLimitWatts}
              format={kw}
              emphasise
            />
            {weightCheck ? (
              <div className="mt-4 border-t border-border pt-3">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <p className="text-xs font-bold text-fg-subtle">質量</p>
                  <p
                    className={`font-mono text-xs ${
                      kgTotal > (weightCheck.maxKg ?? Infinity) ? "font-bold text-ng" : "text-fg-muted"
                    }`}
                  >
                    {Math.round(kgTotal)} / {weightCheck.maxKg} kg
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      kgTotal > (weightCheck.maxKg ?? Infinity) ? "bg-ng" : "bg-accent"
                    }`}
                    style={{
                      width: `${Math.min((kgTotal / (weightCheck.maxKg || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
                {com !== null ? (
                  <p className="mt-1.5 text-[0.7rem] text-fg-subtle">
                    重心 U{com.toFixed(1)}（ラック中央は U{active.units / 2}）
                  </p>
                ) : null}
              </div>
            ) : null}

            <p className="mt-3 text-[0.7rem] leading-relaxed text-fg-subtle">
              1 系統の上限 {kw(t.feedLimitWatts)} ={" "}
              {feed.phase === 3 ? `√3 × ${feed.volts}V × ${feed.amps}A` : `${feed.volts}V × ${feed.amps}A`}{" "}
              × {feed.derate}（連続負荷の係数）
            </p>
            {t.outletCount > 0 || mission.checks.some((c) => c.kind === "outlets") ? (
              <p className="mt-2 border-t border-border pt-2 font-mono text-[0.7rem] text-fg-subtle">
                コンセント口数 {t.outletCount} / 必要 {t.poweredCount}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border bg-surface px-5 py-4">
            <p className="mb-3 text-xs font-bold text-fg-subtle">置ける機器</p>
            <ul className="flex flex-col gap-2">
              {catalog.map((item) => {
                const noRoom = t.usedUnits + item.u > spec.units;
                return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => add(item)}
                    disabled={noRoom}
                    title={noRoom ? "空き U が足りません。何かを外してください" : undefined}
                    className="w-full rounded-xl border border-border px-3 py-2 text-left transition hover:border-accent hover:bg-accent-soft disabled:opacity-35 disabled:hover:border-border disabled:hover:bg-transparent"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-fg">＋ {item.label}</span>
                      <span className="shrink-0 font-mono text-xs text-fg-muted">
                        {isSideMounted(item) ? "0U" : `${item.u}U`}
                        {item.watts > 0
                          ? ` · ${item.watts >= 1000 ? `${item.watts / 1000}kW` : `${item.watts}W`}`
                          : ""}
                      </span>
                    </span>
                    {item.note ? (
                      <span className="mt-0.5 block text-[0.7rem] leading-relaxed text-fg-subtle">
                        {item.note}
                      </span>
                    ) : null}
                    {noRoom ? (
                      <span className="mt-0.5 block text-[0.7rem] font-bold text-ng">
                        空き U が足りません
                      </span>
                    ) : null}
                  </button>
                </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={verify}
          disabled={placed.length === 0}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-accent-fg transition hover:brightness-110 disabled:opacity-35"
        >
          検証する
        </button>
        <button
          type="button"
          onClick={() => goMission(missionIndex)}
          className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-fg-muted transition hover:border-accent hover:text-fg"
        >
          このお題を最初から
        </button>
      </div>

      {verified ? (
        <section className="flex flex-col gap-4">
          <div
            className={`rounded-2xl border px-6 py-5 ${
              allOk ? "border-ok bg-ok/10" : "border-border bg-surface"
            }`}
          >
            <p className="text-sm font-bold text-fg">
              {allOk ? "このお題は達成です" : "満たせていない要件があります"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">
              {allOk
                ? (mission.afterword ??
                  "どれか 1 つを諦めないと成立しない、という状態が設計の判断点です。")
                : "どれか 1 つを諦めないと成立しない、という状態かもしれません。そこが設計の判断点です。"}
            </p>
            {allOk && missionIndex < missions.length - 1 ? (
              <button
                type="button"
                onClick={() => goMission(missionIndex + 1)}
                className="mt-4 rounded-lg border border-accent px-4 py-2 text-sm font-bold text-accent transition hover:bg-accent-soft"
              >
                次のお題へ →
              </button>
            ) : null}
          </div>

          <ul className="flex flex-col gap-2">
            {results.map((r) => (
              <li
                key={r.check.id}
                className={`rounded-xl border px-4 py-3 ${
                  r.ok ? "border-ok/40 bg-ok/8" : "border-ng/40 bg-ng/8"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-fg">
                    <span aria-hidden className={r.ok ? "text-ok" : "text-ng"}>
                      {r.ok ? "✓" : "✗"}
                    </span>{" "}
                    {r.check.label}
                  </p>
                  <p className="font-mono text-xs text-fg-muted">{r.actual}</p>
                </div>
                {(r.ok ? r.check.insight : r.check.hint) ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
                    {r.ok ? r.check.insight : r.check.hint}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          {allCleared ? (
            <>
              <section className="rounded-2xl border border-border bg-surface px-6 py-5">
                <h2 className="mb-3 text-sm font-bold text-fg">このラボで確かめたこと</h2>
                <ul className="flex flex-col gap-2">
                  {(lab.summary ?? []).map((line) => (
                    <li key={line} className="flex gap-2 text-sm leading-relaxed text-fg-muted">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </section>

              <NextLinks items={lab.next} />
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Meter({
  label,
  value,
  limit,
  format,
  emphasise = false,
}: {
  label: string;
  value: number;
  limit: number;
  format: (w: number) => string;
  emphasise?: boolean;
}) {
  const ratio = limit > 0 ? Math.min(value / limit, 1.25) : 0;
  const over = value > limit;
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className={`text-xs ${emphasise ? "font-bold text-fg" : "text-fg-muted"}`}>{label}</p>
        <p className={`font-mono text-xs ${over ? "font-bold text-ng" : "text-fg-muted"}`}>
          {format(value)}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-ng" : "bg-accent"}`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
