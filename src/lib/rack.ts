import type { RackCheck, RackFeed, RackItem, RackMission, RackSpec } from "./labs";

/**
 * ラック設計の検証。
 *
 * 判定はデータではなくここに置く。電力の条件は「通常時」と「片系統が落ちたとき」で
 * 別物で、後者のほうが厳しい。この関係を JSON の条件式で書こうとすると読めなくなる。
 */

export type Placed = { key: string; item: RackItem };

/** ラック上での位置。U 番号は実機と同じく下が 1、上が units。 */
export type Slot = {
  placed: Placed;
  /** 占有する U 番号の上端 */
  topU: number;
  /** 占有する U 番号の下端 */
  bottomU: number;
};

export type RackTotals = {
  /** U マウントの機器が占有している U */
  usedUnits: number;
  /** 何も入っていない U。ここが熱気の通り道になる */
  freeUnits: number;
  totalWatts: number;
  /** 通常時、1 系統あたりの負荷 (2 系統で分担する) */
  perFeedWatts: number;
  /** 片系統が落ちたとき、残った系統にかかる負荷 */
  failoverWatts: number;
  /** 1 系統が連続負荷で使える上限 */
  feedLimitWatts: number;
  /** 電源を取る必要がある機器の数 (= 必要な口数) */
  poweredCount: number;
  /** PDU が提供する口数の合計 */
  outletCount: number;
};

/** ブレーカ定格の見かけ電力 (VA)。三相は線間電圧なので √3 が掛かる。 */
export function feedVa(feed: RackFeed): number {
  return feed.volts * feed.amps * (feed.phase === 3 ? Math.sqrt(3) : 1);
}

/** 1 系統が連続負荷で使える上限 (W)。 */
export function feedLimit(spec: RackSpec): number {
  const feed = spec.feeds[0];
  if (!feed) return 0;
  return feedVa(feed) * feed.derate;
}

export const isSideMounted = (item: RackItem) => item.mount === "side";
export const isPowered = (item: RackItem) => item.watts > 0;

/**
 * 並び順から U 位置を割り当てる。先頭が最上段。
 * side マウント (縦型 PDU など) は U を消費しないので、全高をカバーするものとして扱う。
 */
export function layout(placed: Placed[], spec: RackSpec): Slot[] {
  let cursor = spec.units;
  return placed.map((p) => {
    if (isSideMounted(p.item)) {
      return { placed: p, topU: spec.units, bottomU: 1 };
    }
    const topU = cursor;
    const bottomU = cursor - p.item.u + 1;
    cursor = bottomU - 1;
    return { placed: p, topU, bottomU };
  });
}

export function totals(placed: Placed[], spec: RackSpec): RackTotals {
  // ブランクパネルも U は占有する。埋まっていない U だけが熱気の通り道になる
  const usedUnits = placed
    .filter((p) => !isSideMounted(p.item))
    .reduce((sum, p) => sum + p.item.u, 0);
  const totalWatts = placed.reduce((sum, p) => sum + p.item.watts, 0);

  return {
    usedUnits,
    freeUnits: spec.units - usedUnits,
    totalWatts,
    // PSU 2 台構成なので通常は 2 系統で分担し、片系が落ちれば残りが全部を受ける
    perFeedWatts: totalWatts / spec.feeds.length,
    failoverWatts: totalWatts,
    feedLimitWatts: feedLimit(spec),
    poweredCount: placed.filter((p) => isPowered(p.item)).length,
    outletCount: placed.reduce((sum, p) => sum + (p.item.outlets ?? 0), 0),
  };
}

/**
 * ケーブルが届いていない機器。
 *
 * `via` は供給側の種別。電源なら PDU、ネットワークなら ToR スイッチ。
 * どちらも「取り付け位置から上下いくつの U まで届くか」という同じ形の制約になる。
 */
export function outOfReach(
  placed: Placed[],
  spec: RackSpec,
  via: RackItem["kind"] = "pdu",
): Slot[] {
  const slots = layout(placed, spec);
  const sources = slots.filter((s) => s.placed.item.kind === via);
  // 供給側と、ケーブルが要らない機材 (ブランクパネルなど) は対象外
  const consumers = slots.filter((s) => s.placed.item.kind !== via && isPowered(s.placed.item));
  if (sources.length === 0) return consumers;

  return consumers.filter((s) => {
    return !sources.some((src) => {
      const reach = src.placed.item.reach;
      if (reach === "all" || reach === undefined) return true;
      // 取り付け位置から上下 reach U ぶんしか届かない
      const center = (src.topU + src.bottomU) / 2;
      const itemCenter = (s.topU + s.bottomU) / 2;
      return Math.abs(center - itemCenter) <= reach;
    });
  });
}

/** 総質量 (kg)。 */
export function totalKg(placed: Placed[]): number {
  return placed.reduce((sum, p) => sum + (p.item.kg ?? 0), 0);
}

/**
 * 質量の重心が何 U の高さにあるか。
 * 重い機器を上に積むと重心が上がり、地震時や搬入時に倒れやすくなる。
 */
export function centerOfMassU(placed: Placed[], spec: RackSpec): number | null {
  const slots = layout(placed, spec).filter((s) => (s.placed.item.kg ?? 0) > 0);
  const mass = slots.reduce((sum, s) => sum + (s.placed.item.kg ?? 0), 0);
  if (mass === 0) return null;
  const moment = slots.reduce(
    (sum, s) => sum + (s.placed.item.kg ?? 0) * ((s.topU + s.bottomU) / 2),
    0,
  );
  return moment / mass;
}

export type CheckResult = {
  check: RackCheck;
  ok: boolean;
  /** 現在値の表示 (例: 「12 / 42 U」) */
  actual: string;
};

export function runChecks(placed: Placed[], spec: RackSpec, mission: RackMission): CheckResult[] {
  const t = totals(placed, spec);
  const kw = (w: number) => `${(w / 1000).toFixed(2)} kW`;

  return mission.checks.map((check) => {
    switch (check.kind) {
      case "units":
        return {
          check,
          ok: t.usedUnits <= spec.units,
          actual: `${t.usedUnits} / ${spec.units} U`,
        };
      case "breaker":
        return {
          check,
          ok: t.perFeedWatts <= t.feedLimitWatts,
          actual: `通常時 1 系統あたり ${kw(t.perFeedWatts)} / ${kw(t.feedLimitWatts)}`,
        };
      case "redundancy":
        return {
          check,
          ok: t.failoverWatts <= t.feedLimitWatts,
          actual: `片系統停止時 ${kw(t.failoverWatts)} / ${kw(t.feedLimitWatts)}`,
        };
      case "count": {
        const count = placed.filter((p) => p.item.kind === check.target).length;
        return {
          check,
          ok: count >= (check.min ?? 0),
          actual: `${count} 台 / ${check.min ?? 0} 台以上`,
        };
      }
      case "blanks":
        return { check, ok: t.freeUnits === 0, actual: `塞がっていない空き ${t.freeUnits} U` };
      case "outlets":
        return {
          check,
          ok: t.outletCount >= t.poweredCount,
          actual: `口数 ${t.outletCount} / 必要 ${t.poweredCount}`,
        };
      case "reach": {
        const missed = outOfReach(placed, spec, check.via ?? "pdu");
        return {
          check,
          ok: missed.length === 0,
          actual:
            missed.length === 0 ? "全機器に届いている" : `ケーブルが届かない機器 ${missed.length} 台`,
        };
      }
      case "weight": {
        const kg = totalKg(placed);
        const max = check.maxKg ?? 0;
        return { check, ok: kg <= max, actual: `${Math.round(kg)} kg / ${max} kg` };
      }
      case "balance": {
        /*
         * 「重心がラックの下半分」では判定にならない。機器は上から詰まるので、
         * 台数が少ないほど重心は必ず上に来てしまう。
         * 見るべきは絶対位置ではなく並び順 — 上にあるものほど軽いか。
         * ブランクパネルは詰め物なので対象外。
         */
        const stack = layout(placed, spec).filter(
          (s) => s.placed.item.kind !== "blank" && (s.placed.item.kg ?? 0) > 0,
        );
        let inversions = 0;
        for (let i = 1; i < stack.length; i++) {
          if ((stack[i - 1].placed.item.kg ?? 0) > (stack[i].placed.item.kg ?? 0)) inversions++;
        }
        return {
          check,
          ok: inversions === 0,
          actual:
            inversions === 0
              ? "上にあるものほど軽い"
              : `重い機器が軽い機器の上にある箇所 ${inversions}`,
        };
      }
      case "zone": {
        const slots = layout(placed, spec).filter((s) => s.placed.item.kind === check.target);
        const limit = spec.units - (check.topWithin ?? 0) + 1;
        const outside = slots.filter((s) => s.bottomU < limit);
        return {
          check,
          ok: slots.length > 0 && outside.length === 0,
          actual:
            slots.length === 0
              ? "対象の機材がない"
              : outside.length === 0
                ? `最上段から ${check.topWithin} U 以内`
                : `範囲外に ${outside.length} 台`,
        };
      }
      default:
        return { check, ok: false, actual: "—" };
    }
  });
}
