"use client";

import { useCallback, useMemo, useState } from "react";
import type { GpuSlot, Lab, PlacementMission } from "@/lib/labs";
import { useProgress } from "@/lib/progress";
import { NextLinks } from "./next-links";

/**
 * 置き場所を選ぶ形式のラボ。
 *
 * 合否だけでなく**所要時間が数字で変わる**のがこの形式の主眼。
 * 同じ 8 GPU でも、1 ノードに収まるか跨ぐかで桁が変わることを、
 * 選び直すたびに見えるようにしている。
 */
export function PlaceLab({ lab }: { lab: Lab }) {
  const spec = lab.placement!;
  const missions = spec.missions;
  const [missionIndex, setMissionIndex] = useState(0);
  const mission = missions[missionIndex];
  const [picked, setPicked] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);
  const [cleared, setCleared] = useState<boolean[]>(() => missions.map(() => false));
  const { recordLab } = useProgress();

  // お題ごとに、埋まっている / 壊れている GPU を差し替える
  const nodes = useMemo(() => {
    const overrides = new Map((mission.unavailable ?? []).map((u) => [u.gpu, u.status]));
    return spec.nodes.map((node) => ({
      ...node,
      gpus: node.gpus.map((g) => ({ ...g, status: overrides.get(g.id) ?? g.status })),
    }));
  }, [spec.nodes, mission]);

  const nodeOf = useMemo(() => {
    const map = new Map<string, string>();
    nodes.forEach((n) => n.gpus.forEach((g) => map.set(g.id, n.id)));
    return map;
  }, [nodes]);

  /** 選んだ GPU が何ノードに散っているか。1 ノードなら NVLink で済む。 */
  const spread = useMemo(
    () => new Set(picked.map((id) => nodeOf.get(id))).size,
    [picked, nodeOf],
  );
  const link = spread <= 1 ? spec.links.intra : spec.links.inter;

  /*
   * Ring All-Reduce の所要時間。転送量は 2D×(N-1)/N で、N が増えると 2D に漸近する。
   * 実効帯域は経路の中で最も遅いリンクで決まるので、1 本でもノードを跨ぐと
   * ノード内がいくら速くてもそちらには引きずられない。
   */
  const seconds = useMemo(() => {
    const n = picked.length;
    if (n < 2 || link.gbps === 0) return null;
    return (2 * spec.gradientGb * ((n - 1) / n)) / link.gbps;
  }, [picked.length, link.gbps, spec.gradientGb]);

  const enough = picked.length === mission.need;
  const linkOk = mission.requireLink ? link === spec.links[mission.requireLink] : true;
  const allOk = enough && linkOk;

  const toggle = useCallback((gpu: GpuSlot) => {
    if (gpu.status !== "free") return;
    setVerified(false);
    setPicked((prev) =>
      prev.includes(gpu.id) ? prev.filter((id) => id !== gpu.id) : [...prev, gpu.id],
    );
  }, []);

  const goMission = useCallback((index: number) => {
    setMissionIndex(index);
    setPicked([]);
    setVerified(false);
  }, []);

  const verify = useCallback(() => {
    setVerified(true);
    if (allOk) {
      setCleared((prev) => prev.map((v, i) => (i === missionIndex ? true : v)));
      if (missions.every((_, i) => (i === missionIndex ? true : cleared[i]))) recordLab(lab.id, 0);
    }
  }, [allOk, missionIndex, missions, cleared, recordLab, lab.id]);

  return (
    <div className="flex flex-col gap-6">
      <MissionTabs
        missions={missions}
        index={missionIndex}
        cleared={cleared}
        onPick={goMission}
      />

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
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4">
          {nodes.map((node) => {
            const used = node.gpus.filter((g) => picked.includes(g.id)).length;
            return (
              <div key={node.id} className="rounded-2xl border border-border bg-surface px-4 py-4">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold text-fg">{node.label}</p>
                  <p className="font-mono text-xs text-fg-subtle">
                    {used > 0 ? `${used} GPU 使用` : node.sub}
                  </p>
                </div>
                <ul className="grid grid-cols-4 gap-2">
                  {node.gpus.map((gpu) => {
                    const on = picked.includes(gpu.id);
                    const disabled = gpu.status !== "free";
                    return (
                      <li key={gpu.id}>
                        <button
                          type="button"
                          onClick={() => toggle(gpu)}
                          disabled={disabled}
                          title={gpu.note ?? ""}
                          className={[
                            "w-full rounded-lg border px-2 py-2.5 text-center text-xs font-bold transition",
                            on
                              ? "border-accent bg-accent text-accent-fg"
                              : gpu.status === "faulty"
                                ? "cursor-not-allowed border-ng/50 bg-ng/10 text-ng"
                                : gpu.status === "busy"
                                  ? "cursor-not-allowed border-border bg-surface-2 text-fg-subtle"
                                  : "border-border text-fg hover:border-accent hover:bg-accent-soft",
                          ].join(" ")}
                        >
                          <span className="block">{gpu.label}</span>
                          <span className="mt-0.5 block text-[0.6rem] font-normal opacity-70">
                            {gpu.status === "faulty"
                              ? "故障"
                              : gpu.status === "busy"
                                ? "使用中"
                                : on
                                  ? "選択"
                                  : "空き"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-border bg-surface px-5 py-4">
            <p className="mb-3 text-xs font-bold text-fg-subtle">この配置だとどうなるか</p>

            <Row label="選んだ GPU" value={`${picked.length} / ${mission.need}`} ok={enough} />
            <Row label="またがるノード数" value={`${spread || 0}`} />
            <Row
              label="通る経路"
              value={picked.length === 0 ? "—" : link.label}
              ok={picked.length === 0 ? undefined : linkOk}
            />
            <Row
              label="実効帯域"
              value={picked.length === 0 ? "—" : `${link.gbps} GB/s`}
            />

            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs text-fg-muted">勾配 {spec.gradientGb}GB の All-Reduce</p>
              <p
                className={`mt-1 font-mono text-2xl font-bold ${
                  seconds === null ? "text-fg-subtle" : linkOk ? "text-ok" : "text-ng"
                }`}
              >
                {seconds === null ? "—" : `${Math.round(seconds * 1000)} ms`}
              </p>
              <p className="mt-1 text-[0.7rem] leading-relaxed text-fg-subtle">
                1 ステップごとに毎回かかります。1 万ステップなら
                {seconds === null ? " —" : ` ${Math.round((seconds * 10000) / 60)} 分`}。
              </p>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={verify}
              disabled={picked.length === 0}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-accent-fg transition hover:brightness-110 disabled:opacity-35"
            >
              この配置で確定する
            </button>
            <button
              type="button"
              onClick={() => {
                setPicked([]);
                setVerified(false);
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-fg-muted transition hover:border-accent hover:text-fg"
            >
              選び直す
            </button>
          </div>
        </div>
      </div>

      {verified ? (
        <section
          className={`rounded-2xl border px-6 py-5 ${allOk ? "border-ok bg-ok/10" : "border-ng/40 bg-ng/8"}`}
        >
          <p className="text-sm font-bold text-fg">
            {allOk ? "この配置で通ります" : "この配置では要件を満たせていません"}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
            {allOk ? (mission.afterword ?? "") : mission.hint}
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
        </section>
      ) : null}

      {cleared.every(Boolean) ? (
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
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3 last:mb-0">
      <p className="text-xs text-fg-muted">{label}</p>
      <p
        className={`font-mono text-sm font-bold ${
          ok === undefined ? "text-fg" : ok ? "text-ok" : "text-ng"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MissionTabs({
  missions,
  index,
  cleared,
  onPick,
}: {
  missions: PlacementMission[];
  index: number;
  cleared: boolean[];
  onPick: (index: number) => void;
}) {
  return (
    <ol className="flex flex-wrap gap-2">
      {missions.map((m, i) => (
        <li key={m.id}>
          <button
            type="button"
            onClick={() => onPick(i)}
            aria-current={i === index ? "step" : undefined}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs font-bold transition",
              i === index
                ? "border-accent bg-accent-soft text-fg"
                : cleared[i]
                  ? "border-ok/50 text-fg-muted"
                  : "border-border text-fg-subtle hover:border-accent",
            ].join(" ")}
          >
            <span className="mr-1.5 font-mono opacity-60">{i + 1}</span>
            {m.title}
            {cleared[i] ? <span className="ml-1.5 text-ok">✓</span> : null}
          </button>
        </li>
      ))}
    </ol>
  );
}
