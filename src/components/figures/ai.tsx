import { Arrow, Band, Box, C, Elbow, T } from "./primitives";

const R = 19;

function Node({ cx, cy, n, tone = C.accent }: { cx: number; cy: number; n: number; tone?: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} fill={C.surface} stroke={tone} strokeWidth={1.8} />
      <T x={cx} y={cy} size={13} weight={700} fill={C.fg} anchor="middle" middle>
        {n}
      </T>
    </g>
  );
}

/** 円周上の 2 点を、円の縁で切り詰めた線分に変換する。 */
function edge(a: [number, number], b: [number, number]): { from: [number, number]; to: [number, number] } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const pad = R + 3;
  return {
    from: [a[0] + ux * pad, a[1] + uy * pad],
    to: [b[0] - ux * pad, b[1] - uy * pad],
  };
}

/**
 * NCCL の Ring と Tree。速い遅いではなく
 * 「ホップ数がノード数に比例するか、log に収まるか」の違いを形として見せる。
 */
export function NcclRingTree() {
  const cx = 196;
  const cy = 146;
  const ringR = 94;
  // Tree 側と同じ 7 ランクで揃える。比べたいのは台数ではなく形なので、
  // 両方を同じ GPU 数で描かないと「ホップ数の違い」が読み取れなくなる。
  const RANKS = 7;
  const ring: [number, number][] = Array.from({ length: RANKS }, (_, i) => {
    const t = (-90 + (i * 360) / RANKS) * (Math.PI / 180);
    return [cx + ringR * Math.cos(t), cy + ringR * Math.sin(t)];
  });

  const root: [number, number] = [604, 52];
  const mid: [number, number][] = [
    [540, 132],
    [668, 132],
  ];
  const leaf: [number, number][] = [
    [508, 212],
    [572, 212],
    [636, 212],
    [700, 212],
  ];

  return (
    <svg viewBox="0 0 800 326" role="img" aria-label="NCCL の Ring アルゴリズムと Tree アルゴリズムの比較">
      <line x1={400} y1={16} x2={400} y2={310} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />

      <T x={196} y={24} size={14} weight={700} fill={C.fg} anchor="middle">
        Ring
      </T>
      {ring.map((p, i) => {
        const next = ring[(i + 1) % ring.length];
        const e = edge(p, next);
        return <Arrow key={`r${i}`} from={e.from} to={e.to} color={C.accent} head={6} />;
      })}
      {ring.map((p, i) => (
        <Node key={`n${i}`} cx={p[0]} cy={p[1]} n={i} />
      ))}

      <T x={604} y={24} size={14} weight={700} fill={C.fg} anchor="middle">
        Tree
      </T>
      {mid.map((p, i) => {
        const e = edge(root, p);
        return <Arrow key={`t${i}`} from={e.from} to={e.to} color={C.ok} head={6} bidi />;
      })}
      {leaf.map((p, i) => {
        const parent = mid[i < 2 ? 0 : 1];
        const e = edge(parent, p);
        return <Arrow key={`l${i}`} from={e.from} to={e.to} color={C.ok} head={6} bidi />;
      })}
      <Node cx={root[0]} cy={root[1]} n={0} tone={C.ok} />
      {mid.map((p, i) => (
        <Node key={`m${i}`} cx={p[0]} cy={p[1]} n={i + 1} tone={C.ok} />
      ))}
      {leaf.map((p, i) => (
        <Node key={`f${i}`} cx={p[0]} cy={p[1]} n={i + 3} tone={C.ok} />
      ))}

      <T x={196} y={272} size={12.5} weight={600} fill={C.accent} anchor="middle">
        ホップ数は GPU 数に比例する
      </T>
      <T x={196} y={292} size={12.5} fill={C.muted} anchor="middle">
        どのリンクも同時に埋まるので帯域を使い切れる
      </T>
      <T x={196} y={310} size={12.5} fill={C.fg} anchor="middle">
        → 大きなメッセージ（数 MB 以上）で速い
      </T>

      <T x={604} y={272} size={12.5} weight={600} fill={C.ok} anchor="middle">
        ホップ数は log(GPU 数) に収まる
      </T>
      <T x={604} y={292} size={12.5} fill={C.muted} anchor="middle">
        往復回数が少なく、レイテンシが積み上がらない
      </T>
      <T x={604} y={310} size={12.5} fill={C.fg} anchor="middle">
        → 小さなメッセージ（数 KB〜数百 KB）で速い
      </T>
    </svg>
  );
}

/**
 * Kubernetes が GPU を扱えるようになるまで。
 * スケジューラは GPU を「nvidia.com/gpu: 8」という数としてしか見ていない。
 * その数を誰が入れているのかを追うと、GPU が見えないときの調査順が決まる。
 */
export function K8sDevicePlugin() {
  return (
    <svg viewBox="0 0 800 336" role="img" aria-label="device plugin によって GPU が割り当てられるまで">
      <Band x={16} y={20} w={768} h={92} label="コントロールプレーン" align="right" />
      <Box x={24} y={40} w={300} h={56} label="Node.status.allocatable" sub="nvidia.com/gpu: 8" size={12.5} mono />
      <Box x={540} y={40} w={230} h={56} label="kube-scheduler" sub="ただの数として見る" size={12.5} />
      <Arrow from={[328, 68]} to={[536, 68]} color={C.subtle} />
      <T x={432} y={58} size={12} fill={C.subtle} anchor="middle">
        ④ これを見て配置先を決める
      </T>

      <Band x={16} y={148} w={768} h={166} label="ノード" align="right" />
      <Box x={40} y={182} w={200} h={60} label="kubelet" size={13} />
      <Box x={300} y={182} w={240} h={60} label="device plugin" sub="DaemonSet で各ノードに常駐" size={12.5} tone="accent" />
      <Box x={600} y={182} w={160} h={60} label="GPU × 8" size={13} />
      <Box x={300} y={262} w={240} h={40} label="Pod のコンテナ" size={12.5} tone="accent" />

      <Arrow from={[596, 212]} to={[544, 212]} color={C.accent} head={6} />
      <T x={570} y={170} size={12} fill={C.accent} anchor="middle" weight={600}>
        ① 検出
      </T>
      <Arrow from={[296, 202]} to={[244, 202]} color={C.accent} head={6} />
      <T x={270} y={170} size={12} fill={C.accent} anchor="middle" weight={600}>
        ② 登録
      </T>
      <Arrow from={[244, 226]} to={[296, 226]} color={C.subtle} head={6} />
      <T x={270} y={256} size={12} fill={C.subtle} anchor="middle">
        ⑤ 割り当て依頼
      </T>

      <Elbow points={[[140, 178], [140, 100]]} color={C.accent} head={6} />
      <T x={152} y={140} size={12} fill={C.accent}>
        ③ allocatable に反映される
      </T>

      <Arrow from={[420, 246]} to={[420, 258]} color={C.accent} head={6} />
      <T x={556} y={286} size={12} fill={C.accent} weight={600}>
        ⑥ デバイスファイルと
      </T>
      <T x={556} y={302} size={12} fill={C.accent} weight={600}>
        環境変数を渡す
      </T>

      <T x={400} y={330} size={12} fill={C.subtle} anchor="middle">
        GPU が見えないときは、① 〜 ③ のどこで止まっているかを上から順に確認する
      </T>
    </svg>
  );
}

const AI_LAYERS = [
  { label: "ジョブ管理", sub: "Kubernetes / Slurm", ref: "レッスン 5, 6" },
  { label: "通信ライブラリ", sub: "NCCL", ref: "レッスン 3" },
  { label: "ストレージ", sub: "並列 FS / オブジェクト / キャッシュ", ref: "レッスン 4" },
  { label: "ノード間ネットワーク", sub: "InfiniBand / RoCE", ref: "レッスン 2" },
  { label: "GPU / ノード内", sub: "NVLink・PCIe・ドライバ", ref: "GPU コース" },
];

/** AI 基盤の層。どのレッスンがどの層を扱うかを右に対応させている。 */
export function AiStackLayers() {
  const h = 54;
  const gap = 8;
  const top = 26;
  return (
    <svg viewBox="0 0 800 352" role="img" aria-label="AI 基盤を構成する層とレッスンの対応">
      {AI_LAYERS.map((l, i) => {
        const y = top + i * (h + gap);
        return (
          <g key={l.label}>
            <Box x={96} y={y} w={460} h={h} label={l.label} sub={l.sub} size={13} tone={i === 4 ? "ghost" : "plain"} />
            <T x={578} y={y + h / 2} size={12} fill={C.subtle} middle>
              {l.ref}
            </T>
          </g>
        );
      })}
      <Elbow points={[[80, 32], [80, 306]]} color={C.accent} width={2} />
      <g transform="rotate(-90 62 170)">
        <T x={62} y={170} size={12} weight={600} fill={C.accent} anchor="middle" middle>
          下が遅いと上は速くならない
        </T>
      </g>
      <T x={400} y={342} size={12} fill={C.subtle} anchor="middle">
        どの層も「GPU を待たせないため」にある。詰まる場所はだいたい GPU 以外
      </T>
    </svg>
  );
}

const STEPS = [
  { label: "① データ読み出し", detail: "ストレージ → ホストメモリ", res: "ストレージ / NW" },
  { label: "② 前処理", detail: "CPU でデコード・変換", res: "CPU コア数" },
  { label: "③ 転送", detail: "ホストメモリ → GPU VRAM", res: "PCIe" },
  { label: "④ 順伝播・逆伝播", detail: "GPU で計算", res: "GPU 演算性能" },
  { label: "⑤ 勾配の集約", detail: "All-Reduce（全 GPU 間）", res: "ノード間 NW" },
  { label: "⑥ パラメータ更新", detail: "GPU で計算", res: "GPU" },
];

/**
 * 学習 1 ステップの内訳。
 * ④ だけが GPU 演算で、残りは全部それ以外の資源に律速される、という比率を見せたい図。
 */
export function TrainingStep() {
  const h = 44;
  const gap = 7;
  const top = 26;
  return (
    <svg viewBox="0 0 800 350" role="img" aria-label="学習 1 ステップの内訳と、各段階を律速する資源">
      {STEPS.map((s, i) => {
        const y = top + i * (h + gap);
        const gpu = i === 3 || i === 5;
        return (
          <g key={s.label}>
            <Box x={62} y={y} w={452} h={h} tone={gpu ? "accent" : "plain"} />
            <T x={80} y={y + h / 2} size={12.5} weight={600} fill={C.fg} middle>
              {s.label}
            </T>
            <T x={286} y={y + h / 2} size={12} fill={C.muted} middle>
              {s.detail}
            </T>
            <T x={534} y={y + h / 2} size={12} fill={gpu ? C.accent : C.subtle} weight={gpu ? 600 : 400} middle>
              {s.res}
            </T>
          </g>
        );
      })}
      <Elbow
        points={[
          [58, 296],
          [30, 296],
          [30, 34],
          [58, 34],
        ]}
        color={C.subtle}
        width={2}
      />
      <T x={400} y={340} size={12} fill={C.subtle} anchor="middle">
        これを何十万回も繰り返す。GPU が計算しているのは ④ と ⑥ だけ
      </T>
    </svg>
  );
}

/**
 * InfiniBand のクレジットベースフロー制御。
 * Ethernet が「溢れたら捨てる」なのに対し、IB は「空きがある分しか送らせない」。
 * 受信バッファの空き数がそのまま送信許可になる、という一点を描く。
 */
export function IbCreditFlow() {
  return (
    <svg viewBox="0 0 800 304" role="img" aria-label="InfiniBand のクレジットベースフロー制御">
      <Box x={70} y={20} w={200} h={46} label="送信側" size={13} />
      <Box x={530} y={20} w={200} h={46} label="受信側" size={13} />
      <line x1={170} y1={70} x2={170} y2={268} stroke={C.border} strokeWidth={1.2} strokeDasharray="4 6" />
      <line x1={630} y1={70} x2={630} y2={268} stroke={C.border} strokeWidth={1.2} strokeDasharray="4 6" />

      <T x={630} y={98} size={12} fill={C.subtle} anchor="middle">
        受信バッファ
      </T>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={558 + i * 38}
          y={110}
          width={30}
          height={30}
          rx={5}
          fill={i < 3 ? C.surface2 : C.accentSoft}
          stroke={i < 3 ? C.border : C.accent}
          strokeWidth={1.4}
        />
      ))}

      <Arrow from={[626, 170]} to={[174, 170]} color={C.ok} width={2} />
      <T x={400} y={160} size={12.5} weight={600} fill={C.ok} anchor="middle">
        ① 空いているバッファ数を伝える（クレジット）
      </T>

      <Arrow from={[174, 218]} to={[626, 218]} color={C.accent} width={2} />
      <T x={400} y={208} size={12.5} weight={600} fill={C.accent} anchor="middle">
        ② クレジットの数だけ送る。それ以上は送らない
      </T>

      <T x={400} y={254} size={12} fill={C.muted} anchor="middle">
        ③ 使い切ったら送信を止めて、次のクレジットを待つ
      </T>

      <T x={400} y={294} size={12} fill={C.subtle} anchor="middle">
        Ethernet は溢れてから捨てて再送する。IB は最初から溢れさせない（ロスレス）
      </T>
    </svg>
  );
}
