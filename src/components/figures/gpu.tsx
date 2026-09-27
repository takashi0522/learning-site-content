import { Arrow, Box, Brace, C, T } from "./primitives";

const LAYERS: { label: string; sub?: string; tone: "plain" | "accent" | "ghost" }[] = [
  { label: "アプリケーション", sub: "PyTorch / TensorFlow", tone: "ghost" },
  { label: "ライブラリ", sub: "cuDNN / NCCL / cuBLAS", tone: "ghost" },
  { label: "CUDA Runtime", sub: "libcudart — アプリに同梱されることが多い", tone: "accent" },
  { label: "CUDA Driver API", sub: "libcuda.so", tone: "plain" },
  { label: "カーネルモジュール", sub: "nvidia.ko", tone: "plain" },
  { label: "GPU ハードウェア", tone: "ghost" },
];

/**
 * GPU のソフトウェアスタック。トラブルの大半はこの階層のどこかで
 * バージョンが噛み合っていないことなので、
 * 「Toolkit 側」と「ドライバ側」の境界を最も強く描いている。
 */
export function CudaStack() {
  const x = 150;
  const w = 392;
  const h = 44;
  const gap = 8;
  const top = 22;
  // ドライバ側 (index 3 以降) の手前だけ余白を広げ、境界を目で分かるようにする
  const BOUNDARY_GAP = 34;
  const yOf = (i: number) => top + i * (h + gap) + (i >= 3 ? BOUNDARY_GAP : 0);

  return (
    <svg viewBox="0 0 800 392" role="img" aria-label="GPU のソフトウェアスタックの階層">
      {LAYERS.map((l, i) => (
        <Box
          key={l.label}
          x={x}
          y={yOf(i)}
          w={w}
          h={h}
          label={l.label}
          sub={l.sub}
          tone={l.tone}
          size={13}
        />
      ))}

      <T x={138} y={(yOf(0) + yOf(3) + h) / 2} size={12} fill={C.subtle} anchor="end" middle>
        ユーザー空間
      </T>
      <T x={138} y={yOf(4) + h / 2} size={12} fill={C.subtle} anchor="end" middle>
        カーネル空間
      </T>
      <T x={138} y={yOf(5) + h / 2} size={12} fill={C.subtle} anchor="end" middle>
        ハードウェア
      </T>

      <Brace x={556} y1={yOf(1)} y2={yOf(2) + h} label="CUDA Toolkit 側" color={C.accent} />
      <Brace x={556} y1={yOf(3)} y2={yOf(4) + h} label="NVIDIA ドライバ側" />

      <line
        x1={x - 6}
        y1={yOf(3) - 6}
        x2={x + w + 6}
        y2={yOf(3) - 6}
        stroke={C.ng}
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      <T x={x + w / 2} y={yOf(3) - 20} size={12} fill={C.ng} weight={600} anchor="middle">
        バージョン不整合のほとんどはこの境界で起きる
      </T>

      <T x={400} y={384} size={12.5} fill={C.subtle} anchor="middle">
        nvidia-smi の「CUDA Version」はドライバが対応できる上限であって、入っている Toolkit の版ではない
      </T>
    </svg>
  );
}

// tone はコース別アクセントを使わない。gpu コースの accent は緑なので、
// accent を挟むと「速い」と「中間」が同じ色に見えてしまう。
const PATHS: { label: string; nodes: string[]; bw: string; ms: string; tone: "ok" | "muted" | "ng" }[] = [
  { label: "NVLink 直結", nodes: ["GPU 0", "GPU 1"], bw: "900 GB/s", ms: "約 22 ms", tone: "ok" },
  { label: "PCIe 経由", nodes: ["GPU 0", "CPU / PCIe スイッチ", "GPU 1"], bw: "64 GB/s", ms: "約 310 ms", tone: "muted" },
  { label: "ネットワーク経由", nodes: ["GPU 0", "NIC", "NIC", "GPU 1"], bw: "12.5 GB/s", ms: "約 1,600 ms", tone: "ng" },
];

/**
 * GPU 間の経路と、その差が学習 1 ステップに効く時間。
 * 同じ All-Reduce でも経路で 70 倍変わるので、
 * 「どこを通っているか」が性能の主因であることを経路の形と数字の両方で示す。
 */
export function GpuInterconnectPaths() {
  return (
    <svg viewBox="0 0 800 306" role="img" aria-label="GPU 間の経路ごとの帯域と All-Reduce 所要時間">
      <T x={24} y={22} size={12.5} fill={C.subtle}>
        勾配 10 GB の All-Reduce に、経路ごとにどれだけかかるか
      </T>

      {PATHS.map((p, row) => {
        const y = 44 + row * 74;
        const span = 372;
        const step = span / (p.nodes.length - 1);
        return (
          <g key={p.label}>
            <T x={24} y={y + 26} size={12.5} weight={600} fill={C.fg} middle>
              {p.label}
            </T>
            {p.nodes.map((n, i) => {
              const cx = 196 + i * step;
              const w = Math.min(step - 26, 126);
              return (
                <g key={`${n}-${i}`}>
                  <Box
                    x={cx - w / 2}
                    y={y}
                    w={w}
                    h={52}
                    label={n}
                    size={12}
                    tone={i === 0 || i === p.nodes.length - 1 ? "plain" : "ghost"}
                  />
                  {i > 0 ? (
                    <Arrow
                      from={[cx - step + w / 2 + 4, y + 26]}
                      to={[cx - w / 2 - 4, y + 26]}
                      color={C[p.tone]}
                      width={2}
                      head={6}
                    />
                  ) : null}
                </g>
              );
            })}
            <T x={640} y={y + 18} size={12} fill={C.muted} mono>
              {p.bw}
            </T>
            <T x={640} y={y + 42} size={16} weight={700} fill={C[p.tone]} mono>
              {p.ms}
            </T>
          </g>
        );
      })}

      <T x={400} y={296} size={12} fill={C.subtle} anchor="middle">
        nvidia-smi topo -m が NV# / PIX / SYS のどれを返すかで、この 3 行のどれになるかが決まる
      </T>
    </svg>
  );
}

/**
 * コンテナから GPU を使う構成。
 * ホストに置くのはドライバだけ、CUDA はコンテナ側。
 * この分担のおかげで、1 台のホストで違う CUDA バージョンを同時に動かせる。
 */
export function GpuContainerStack() {
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="ホストのドライバとコンテナ内の CUDA の分担">
      <Box x={20} y={26} w={368} h={272} r={12} tone="ghost" />
      <T x={40} y={50} size={13} weight={700} fill={C.fg}>
        ホスト
      </T>
      <Box x={40} y={66} w={328} h={64} label="NVIDIA ドライバ" sub="nvidia.ko / libcuda.so" size={13} />
      <Box
        x={40}
        y={146}
        w={328}
        h={64}
        label="NVIDIA Container Toolkit"
        sub="デバイスとライブラリを注入する"
        size={12.5}
        tone="accent"
      />
      <T x={204} y={240} size={12} fill={C.muted} anchor="middle">
        ホストに CUDA Toolkit は要らない
      </T>
      <T x={204} y={262} size={12} fill={C.muted} anchor="middle">
        入れるのはドライバだけ
      </T>

      <Box x={432} y={26} w={348} h={272} r={12} tone="ghost" dashed />
      <T x={452} y={50} size={13} weight={700} fill={C.accent}>
        コンテナ
      </T>
      {[
        { label: "PyTorch / TensorFlow", y: 66 },
        { label: "cuDNN / NCCL", y: 138 },
        { label: "CUDA Toolkit 12.4", y: 210 },
      ].map((l) => (
        <Box key={l.label} x={452} y={l.y} w={308} h={58} label={l.label} size={13} />
      ))}

      <Arrow from={[372, 178]} to={[448, 178]} color={C.accent} width={2.5} />
      <T x={410} y={162} size={12} fill={C.accent} weight={600} anchor="middle">
        注入
      </T>

      <T x={400} y={320} size={12} fill={C.subtle} anchor="middle">
        だから 1 台のホストで、違う CUDA バージョンのコンテナを同時に動かせる
      </T>
    </svg>
  );
}
