import { Arrow, Box, C, Elbow, T } from "./primitives";

/**
 * NUMA。DIMM をソケットの外側に置いて、リモートアクセスが
 * 「必ずソケット間接続を 1 本余計に通る」ことを経路として見せている。
 */
export function NumaTopology() {
  return (
    <svg viewBox="0 0 800 272" role="img" aria-label="2 ソケットサーバーの NUMA 構成とローカル / リモートアクセス">
      <Box x={16} y={68} w={124} h={80} label="DIMM" sub="Node 0 のメモリ" size={13} />
      <Box x={660} y={68} w={124} h={80} label="DIMM" sub="Node 1 のメモリ" size={13} />

      <Box x={184} y={56} w={184} h={104} tone="accent" r={10} />
      <T x={276} y={88} size={16} weight={700} fill={C.fg} anchor="middle">
        CPU 0
      </T>
      <T x={276} y={110} size={12} fill={C.muted} anchor="middle">
        NUMA Node 0
      </T>
      <T x={276} y={134} size={12} fill={C.subtle} anchor="middle">
        メモリコントローラ内蔵
      </T>

      <Box x={432} y={56} w={184} h={104} r={10} />
      <T x={524} y={88} size={16} weight={700} fill={C.fg} anchor="middle">
        CPU 1
      </T>
      <T x={524} y={110} size={12} fill={C.muted} anchor="middle">
        NUMA Node 1
      </T>
      <T x={524} y={134} size={12} fill={C.subtle} anchor="middle">
        メモリコントローラ内蔵
      </T>

      <Arrow from={[144, 108]} to={[180, 108]} bidi color={C.ok} width={2} />
      <Arrow from={[620, 108]} to={[656, 108]} bidi color={C.ok} width={2} />
      <Arrow from={[372, 108]} to={[428, 108]} bidi color={C.accent} width={2} />

      <T x={400} y={38} size={12} weight={600} fill={C.accent} anchor="middle">
        ソケット間接続（UPI / Infinity Fabric）
      </T>
      <T x={162} y={182} size={12} weight={600} fill={C.ok} anchor="middle">
        ローカル
      </T>
      <T x={162} y={198} size={12} fill={C.muted} anchor="middle">
        約 80 ns
      </T>
      <T x={638} y={182} size={12} weight={600} fill={C.ok} anchor="middle">
        ローカル
      </T>
      <T x={638} y={198} size={12} fill={C.muted} anchor="middle">
        約 80 ns
      </T>

      <Elbow
        points={[
          [276, 164],
          [276, 224],
          [722, 224],
          [722, 152],
        ]}
        color={C.ng}
        dashed
        width={2}
      />
      <T x={470} y={244} size={12.5} weight={600} fill={C.ng} anchor="middle">
        リモートアクセス: 約 1.5〜2 倍遅く、帯域もソケット間接続に制限される
      </T>
    </svg>
  );
}

/**
 * PCIe デバイスの NUMA 所属。
 * NIC も NVMe も「どちらかの CPU にぶら下がっている」ので、
 * 反対側のコアから触るとソケット間接続を 1 本余計に通ることになる。
 */
export function PcieNuma() {
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="PCIe デバイスがどちらの NUMA ノードに属するか">
      <Box x={150} y={36} w={200} h={80} label="CPU 0" sub="NUMA Node 0" size={14} tone="accent" />
      <Box x={450} y={36} w={200} h={80} label="CPU 1" sub="NUMA Node 1" size={14} />
      <Arrow from={[354, 76]} to={[446, 76]} bidi color={C.accent} width={2} />
      <T x={400} y={28} size={12} fill={C.subtle} anchor="middle">
        ソケット間接続
      </T>

      <Box x={30} y={156} w={116} h={48} label="DIMM" size={12.5} />
      <Box x={166} y={156} w={180} h={48} label="PCIe slot 1-4" size={12.5} mono />
      <Box x={454} y={156} w={180} h={48} label="PCIe slot 5-8" size={12.5} mono />
      <Box x={654} y={156} w={116} h={48} label="DIMM" size={12.5} />

      <Elbow points={[[210, 116], [88, 116], [88, 152]]} color={C.subtle} head={6} />
      <Elbow points={[[250, 116], [256, 116], [256, 152]]} color={C.subtle} head={6} />
      <Elbow points={[[550, 116], [544, 116], [544, 152]]} color={C.subtle} head={6} />
      <Elbow points={[[590, 116], [712, 116], [712, 152]]} color={C.subtle} head={6} />

      <Box x={166} y={240} w={180} h={48} label="NIC" size={13} />
      <Box x={454} y={240} w={180} h={48} label="NVMe" size={13} />
      <Arrow from={[256, 208]} to={[256, 236]} color={C.subtle} head={6} />
      <Arrow from={[544, 208]} to={[544, 236]} color={C.subtle} head={6} />

      <Elbow points={[[350, 264], [400, 264], [400, 300], [546, 300], [546, 292]]} color={C.ng} dashed width={2} />
      <T x={400} y={318} size={12} weight={600} fill={C.ng} anchor="middle">
        CPU 1 のコアから NIC を使うと、ソケット間接続を 1 本余計に通る
      </T>
    </svg>
  );
}

const WRITE_PATH = [
  { label: "ページキャッシュ", sub: "OS のメモリ・揮発性", volatile: true },
  { label: "RAID コントローラのキャッシュ", sub: "揮発性", volatile: true, guard: "BBU / フラッシュ保護" },
  { label: "SSD 内部の DRAM バッファ", sub: "揮発性", volatile: true, guard: "スーパーキャパシタ (PLP)" },
  { label: "NAND / プラッタ", sub: "ここに書けて初めて残る", volatile: false },
];

/**
 * fsync() が返ってきても、まだ電源断で消える段が残っていることがある。
 * 「不揮発になるのはどこか」と「途中の段を守っているのは何か」を対応させる。
 */
export function PowerLossProtection() {
  const h = 54;
  const gap = 22;
  const top = 70;
  return (
    <svg viewBox="0 0 800 384" role="img" aria-label="書き込みが不揮発になるまでに通る揮発性のキャッシュ">
      <Box x={140} y={12} w={320} h={44} label="アプリケーション" size={13} />
      <T x={480} y={26} size={12} fill={C.muted} mono>
        write()
      </T>
      <T x={480} y={44} size={12} fill={C.accent} mono weight={600}>
        fsync()
      </T>

      {WRITE_PATH.map((p, i) => {
        const y = top + i * (h + gap);
        return (
          <g key={p.label}>
            <Box
              x={140}
              y={y}
              w={320}
              h={h}
              label={p.label}
              sub={p.sub}
              size={12.5}
              tone={p.volatile ? "ng" : "ok"}
            />
            <T x={120} y={y + h / 2} size={12} fill={p.volatile ? C.ng : C.ok} weight={600} anchor="end" middle>
              {p.volatile ? "揮発" : "不揮発"}
            </T>
            {p.guard ? (
              <T x={480} y={y + h / 2} size={12} fill={C.muted} middle>
                {p.guard}がなければ消える
              </T>
            ) : null}
            <Arrow from={[300, y - gap + 4]} to={[300, y - 4]} color={C.subtle} head={6} />
          </g>
        );
      })}

      <T x={400} y={374} size={12} fill={C.subtle} anchor="middle">
        fsync() の戻りが何を保証するかは、この列のどこまで電源保護されているかで決まる
      </T>
    </svg>
  );
}
