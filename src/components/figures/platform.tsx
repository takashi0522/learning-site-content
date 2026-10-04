import type { ReactNode } from "react";
import { Arrow, Band, Box, C, T } from "./primitives";

/**
 * Kubernetes の部品と、「望む状態」が Pod になるまでの流れ。
 * コントローラは介してやり取りし、直接は話さない。
 */
export function K8sControlFlow() {
  return (
    <svg viewBox="0 0 800 360" role="img" aria-label="Kubernetes の部品と、望む状態が Pod になるまでの流れ">
      <Box x={20} y={40} w={130} h={56} label="kubectl apply" sub="望む状態を書く" size={13} mono />
      <Arrow from={[152, 68]} to={[234, 68]} color={C.accent} width={2} />

      <Band x={216} y={14} w={568} h={160} label="コントロールプレーン" />
      <Box x={236} y={44} w={170} h={56} label="kube-apiserver" sub="すべての窓口" size={13} tone="accent" mono />
      <Box x={236} y={118} w={116} h={44} label="etcd" sub="状態の保存先" size={12.5} mono />
      <Arrow from={[294, 102]} to={[294, 116]} color={C.subtle} bidi />
      <Box x={450} y={44} w={160} h={50} label="controller-manager" sub="望む状態に近づける" size={12} mono />
      <Box x={450} y={110} w={160} h={50} label="kube-scheduler" sub="Pod を置くノードを決める" size={12} mono />
      <Arrow from={[448, 69]} to={[408, 69]} color={C.subtle} bidi />
      <Arrow from={[448, 130]} to={[408, 90]} color={C.subtle} bidi />
      <T x={628} y={86} size={12} fill={C.fg}>
        コントローラは
      </T>
      <T x={628} y={104} size={12} fill={C.fg}>
        API サーバーに伝え、
      </T>
      <T x={628} y={122} size={12} fill={C.fg}>
        ほかの部品が反応する
      </T>

      <Band x={216} y={196} w={568} h={130} label="ワーカーノード（GPU サーバーなど）" />
      <Box x={236} y={240} w={170} h={56} label="kubelet" sub="Pod を動かす" size={13} mono />
      <Box x={450} y={240} w={150} h={56} label="コンテナランタイム" sub="コンテナを動かす" size={12.5} />
      <Box x={630} y={240} w={140} h={56} label="Pod" sub="コンテナの組" size={13} tone="ok" />
      <Arrow from={[408, 268]} to={[448, 268]} color={C.subtle} />
      <Arrow from={[602, 268]} to={[628, 268]} color={C.subtle} />
      <Arrow from={[384, 102]} to={[384, 238]} color={C.subtle} bidi />
      <T x={20} y={226} size={12} fill={C.fg}>
        kubelet は自分のノードに
      </T>
      <T x={20} y={244} size={12} fill={C.fg}>
        割り当てられた Pod を見張る
      </T>
      <T x={400} y={348} size={12} anchor="middle">
        kube-proxy（Service の規則）と DNS は、レッスン 2 で扱う
      </T>
    </svg>
  );
}

/**
 * Service の仕組み。名前（DNS）→ 動かない IP（ClusterIP）→ 入れ替わる Pod（EndpointSlice）。
 * headless では DNS が Pod の IP を直接返す。
 */
export function ServiceRouting() {
  return (
    <svg viewBox="0 0 800 340" role="img" aria-label="Service が、入れ替わる Pod に動かない名前と IP を与える仕組み">
      <Box x={20} y={60} w={140} h={56} label="クライアントの Pod" sub="my-service に接続" size={12.5} />
      <Arrow from={[162, 88]} to={[226, 88]} color={C.subtle} />
      <Box x={228} y={60} w={170} h={56} label="DNS（CoreDNS など）" sub="my-service.my-ns" size={12.5} />
      <Arrow from={[400, 88]} to={[456, 88]} color={C.accent} width={2} />
      <Box x={458} y={60} w={150} h={56} label="ClusterIP" sub="変わらない仮想の IP" size={13} tone="accent" />
      <T x={533} y={140} size={12} fill={C.fg} anchor="middle">
        kube-proxy などが
      </T>
      <T x={533} y={158} size={12} fill={C.fg} anchor="middle">
        転送の規則を作る
      </T>

      {[0, 1, 2].map((i) => (
        <g key={i}>
          <Box x={650} y={30 + i * 56} w={130} h={44} label={`Pod ${i + 1}`} sub="入れ替わる" size={12.5} tone="ok" />
          <Arrow from={[610, 88]} to={[648, 52 + i * 56]} color={C.ok} />
        </g>
      ))}
      <Box x={458} y={186} w={150} h={44} label="EndpointSlice" sub="今の Pod の一覧" size={12.5} mono />
      <Arrow from={[608, 208]} to={[648, 208]} color={C.subtle} dashed />
      <T x={650} y={212} size={12} fill={C.fg}>
        selector で自動更新
      </T>

      <Band x={16} y={256} w={768} h={72} label="headless（clusterIP: None）" />
      <T x={40} y={300} size={12.5} fill={C.fg}>
        ClusterIP も転送も無い。DNS が Pod の IP を直接返し、クライアントが相手の Pod を選んで直接つなぐ
      </T>
    </svg>
  );
}

/**
 * requests と limits。スケジューラは requests の合計だけを見る。
 * 実行中は limits を超えると、CPU は絞られ、メモリは OOM で止められうる。
 */
export function RequestsLimits() {
  const scaleX = (v: number) => 140 + v * 6;
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="requests と limits の働き">
      <T x={20} y={30} size={13} fill={C.fg} weight={700}>
        スケジュールのとき: ノードの割り当て可能量と、requests の合計を比べる
      </T>
      <T x={20} y={66} size={12.5} fill={C.fg}>
        ノード
      </T>
      <rect x={scaleX(0)} y={48} width={scaleX(100) - scaleX(0)} height={30} rx={6} fill={C.surface2} stroke={C.border} />
      <rect x={scaleX(0)} y={48} width={scaleX(40) - scaleX(0)} height={30} rx={6} fill={C.accentSoft} stroke={C.accent} />
      <rect x={scaleX(40)} y={48} width={scaleX(70) - scaleX(40)} height={30} fill={C.accentSoft} stroke={C.accent} />
      <T x={scaleX(20)} y={67} size={12} fill={C.fg} anchor="middle">
        Pod A の requests
      </T>
      <T x={scaleX(55)} y={67} size={12} fill={C.fg} anchor="middle">
        Pod B の requests
      </T>
      <T x={scaleX(85)} y={67} size={12} anchor="middle">
        空き 30%
      </T>
      <T x={20} y={104} size={12} fill={C.fg}>
        新しい Pod の requests が 40% なら、実際の使用量が少なくても置かれない（FailedScheduling）
      </T>

      <T x={20} y={156} size={13} fill={C.fg} weight={700}>
        動いているとき: 1 つのコンテナ
      </T>
      <rect x={scaleX(0)} y={176} width={scaleX(100) - scaleX(0)} height={30} rx={6} fill={C.surface2} stroke={C.border} />
      <rect x={scaleX(0)} y={176} width={scaleX(35) - scaleX(0)} height={30} rx={6} fill={C.accentSoft} stroke={C.accent} />
      <line x1={scaleX(35)} y1={168} x2={scaleX(35)} y2={214} stroke={C.accent} strokeWidth={2} />
      <line x1={scaleX(70)} y1={168} x2={scaleX(70)} y2={214} stroke={C.ng} strokeWidth={2} />
      <T x={scaleX(35)} y={230} size={12} fill={C.accent} weight={600} anchor="middle">
        requests
      </T>
      <T x={scaleX(70)} y={230} size={12} fill={C.ng} weight={600} anchor="middle">
        limits
      </T>
      <T x={scaleX(52)} y={196} size={12} fill={C.fg} anchor="middle">
        空いていれば使える
      </T>
      <T x={scaleX(85)} y={196} size={12} fill={C.ng} anchor="middle">
        超えると…
      </T>
      <T x={20} y={266} size={12.5} fill={C.fg}>
        CPU: limits で絞られる（スロットリング）。使いすぎで止められはしない
      </T>
      <T x={20} y={290} size={12.5} fill={C.fg}>
        メモリ: limits を超えると、カーネルの OOM でプロセスが止められうる
      </T>
      <T x={20} y={314} size={12.5} fill={C.fg}>
        GPU など拡張リソース: 整数で数え、重ねて割り当てない（両方書くなら requests = limits）
      </T>
    </svg>
  );
}

/**
 * ネットワークからの起動の流れ。DHCP が「何を起動するか」を教え、ファームウェアが取りに行く。
 */
export function NetbootFlow() {
  const lanes = [
    { x: 90, label: "新しいサーバー", tone: "accent" as const },
    { x: 300, label: "DHCP サーバー", tone: "plain" as const },
    { x: 500, label: "TFTP / HTTP", tone: "plain" as const },
    { x: 700, label: "設定の置き場", tone: "plain" as const },
  ];
  const msg = (y: number, from: number, to: number, label: string, color: string = C.subtle) => (
    <g>
      <Arrow from={[from, y]} to={[to, y]} color={color} width={color === C.subtle ? 1.5 : 2} />
      <T x={(from + to) / 2} y={y - 7} size={12} fill={color === C.subtle ? C.fg : color} weight={600} anchor="middle">
        {label}
      </T>
    </g>
  );
  return (
    <svg viewBox="0 0 800 370" role="img" aria-label="ネットワークからの起動と初回の設定の流れ">
      {lanes.map((l) => (
        <g key={l.label}>
          <Box x={l.x - 78} y={10} w={156} h={34} label={l.label} size={12.5} tone={l.tone} />
          <line x1={l.x} y1={46} x2={l.x} y2={350} stroke={C.border} strokeWidth={1.5} strokeDasharray="4 4" />
        </g>
      ))}
      {msg(78, 92, 298, "① DHCP 要求（種別 93: x64 UEFI など）")}
      {msg(118, 298, 92, "② IP と起動ファイル名を返す", C.accent)}
      {msg(158, 92, 498, "③ 起動ファイル（iPXE など）を取得")}
      {msg(198, 92, 298, "④ iPXE がもう一度 DHCP")}
      {msg(238, 92, 498, "⑤ カーネル・インストーラを HTTP で取得")}
      <Box x={14} y={258} w={152} h={40} label="⑥ OS を入れて再起動" size={12} tone="ok" />
      {msg(322, 92, 698, "⑦ 初回起動で cloud-init が設定を取得（ds=nocloud;s=https://…）", C.ok)}
    </svg>
  );
}

/**
 * VM がデバイスを使う 2 つの道。ホストが模した仮想デバイスか、IOMMU で守った直接の割り当てか。
 * SR-IOV は 1 枚のデバイスを複数の VF に見せ、それぞれを直接割り当てられるようにする。
 */
export function DeviceAssignment() {
  return (
    <svg viewBox="0 0 800 350" role="img" aria-label="仮想デバイス、直接の割り当て、SR-IOV の違い">
      <Box x={20} y={20} w={230} h={50} label="VM 1" sub="ゲストのドライバ" size={13} />
      <Box x={285} y={20} w={230} h={50} label="VM 2" sub="ベアメタルと同じドライバ" size={13} tone="accent" />
      <Box x={550} y={20} w={230} h={50} label="VM 3 / VM 4" sub="それぞれ VF を 1 つ" size={13} tone="accent" />

      <Band x={16} y={96} w={768} h={92} label="ホスト（KVM・IOMMU）" />
      <Box x={36} y={128} w={194} h={46} label="ホストが模したデバイス" sub="処理がホストを通る" size={12} />
      <Box x={305} y={128} w={190} h={46} label="IOMMU で隔離" sub="DMA の範囲を守る" size={12} tone="ok" />
      <Box x={570} y={128} w={190} h={46} label="IOMMU で隔離" sub="VF を割り当てて" size={12} tone="ok" />

      <Box x={36} y={220} w={194} h={56} label="物理デバイス" sub="ホストが使う" size={13} />
      <Box x={305} y={220} w={190} h={56} label="物理デバイス" sub="VM 2 が使う" size={13} />
      <Box x={570} y={220} w={190} h={56} label="SR-IOV のデバイス" sub="PF 1 つ → VF 複数" size={13} />

      <Arrow from={[135, 72]} to={[135, 126]} color={C.subtle} />
      <Arrow from={[135, 176]} to={[135, 218]} color={C.subtle} />
      {[400, 620, 710].map((x) => (
        <g key={x}>
          <Arrow from={[x, 72]} to={[x, 126]} color={C.accent} width={2} />
          <Arrow from={[x, 176]} to={[x, 218]} color={C.accent} width={2} />
        </g>
      ))}

      <T x={135} y={302} size={12} fill={C.fg} anchor="middle">
        仮想デバイス
      </T>
      <T x={400} y={302} size={12} fill={C.fg} anchor="middle">
        直接の割り当て（VFIO）
      </T>
      <T x={665} y={302} size={12} fill={C.fg} anchor="middle">
        SR-IOV で分けて割り当て
      </T>
      <T x={400} y={334} size={12} anchor="middle">
        直接の割り当ては、ホストを通す仮想デバイスに比べてレイテンシが小さく帯域が大きい（VFIO のドキュメント）
      </T>
    </svg>
  );
}

/**
 * GPU の渡し方・分け方の 4 つ。分ける単位（まるごと・時間・ハードウェアの区画）と、隔離の強さが違う。
 */
export function GpuSharingModes() {
  const col = (x: number, title: string, sub: string, tone: "accent" | "plain" | "ok") => (
    <Box x={x} y={18} w={180} h={56} label={title} sub={sub} size={13} tone={tone} />
  );
  const gpu = (x: number, children: ReactNode) => (
    <g>
      <rect x={x} y={92} width={180} height={110} rx={8} fill={C.surface2} stroke={C.border} />
      {children}
    </g>
  );
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="GPU の渡し方と分け方の比較">
      {col(16, "パススルー", "1 枚を 1 VM に", "plain")}
      {col(212, "vGPU（時分割）", "複数の VM で時間を分ける", "accent")}
      {col(408, "MIG", "区画に分ける（最大 7）", "ok")}
      {col(604, "K8s の time-slicing", "Pod で時間を分ける", "plain")}

      {gpu(16, <Box x={30} y={106} w={152} h={82} label="VM 1" sub="GPU 全体を専有" size={13} tone="accent" />)}
      {gpu(
        212,
        <g>
          {[0, 1, 2].map((i) => (
            <Box key={i} x={226 + i * 52} y={104} w={44} h={70} label={`VM${i + 1}`} size={12} tone="accent" />
          ))}
          <T x={302} y={194} size={12} fill={C.fg} anchor="middle">
            順番に GPU を使う
          </T>
        </g>,
      )}
      {gpu(
        408,
        <g>
          <Box x={420} y={104} w={74} h={86} label="3g" sub="区画" size={12} tone="ok" />
          <Box x={500} y={104} w={50} h={86} label="2g" size={12} tone="ok" />
          <Box x={556} y={104} w={22} h={86} size={12} tone="ok" />
        </g>,
      )}
      {gpu(
        604,
        <g>
          {[0, 1, 2].map((i) => (
            <Box key={i} x={618 + i * 52} y={106} w={44} h={82} label={`Pod`} size={12} />
          ))}
        </g>,
      )}

      <T x={16} y={236} size={12.5} fill={C.fg} weight={700}>
        隔離（各ドキュメントの記述）
      </T>
      <T x={106} y={262} size={12} fill={C.fg} anchor="middle">
        VM 1 つだけ
      </T>
      <T x={302} y={262} size={12} fill={C.fg} anchor="middle">
        IOMMU でメモリアクセスを保護
      </T>
      <T x={498} y={262} size={12} fill={C.ok} weight={600} anchor="middle">
        メモリと障害を区画ごと
      </T>
      <T x={694} y={262} size={12} fill={C.ng} weight={600} anchor="middle">
        メモリも障害も無い
      </T>
      <T x={400} y={312} size={12} anchor="middle">
        MIG の区画を vGPU に割り当てる（MIG-backed vGPU）組み合わせもある
      </T>
    </svg>
  );
}

