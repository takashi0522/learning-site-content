import { Arrow, Band, Box, C, Elbow, T } from "./primitives";

const SERVERS = ["サーバー 1", "サーバー 2", "サーバー 3"];

/**
 * A/B 2 系統給電。PSU が 2 台あることではなく、
 * 「上流が根元まで分かれていること」が冗長の条件だと示すための図。
 */
export function AbPowerFeed() {
  const chain = (y: number, suffix: string, color: string) => (
    <g>
      <Box x={16} y={y} w={84} h={40} label={`系統 ${suffix}`} size={12.5} tone="ghost" />
      <Box x={112} y={y} w={84} h={40} label={`UPS ${suffix}`} size={12.5} />
      <Box x={208} y={y} w={96} h={40} label={`分電盤 ${suffix}`} size={12} />
      <Box x={316} y={y} w={84} h={40} label={`PDU ${suffix}`} size={12.5} />
      <Arrow from={[100, y + 20]} to={[110, y + 20]} color={color} head={5} />
      <Arrow from={[196, y + 20]} to={[206, y + 20]} color={color} head={5} />
      <Arrow from={[304, y + 20]} to={[314, y + 20]} color={color} head={5} />
    </g>
  );

  return (
    <svg viewBox="0 0 800 306" role="img" aria-label="A 系統と B 系統に分けた給電経路">
      {chain(24, "A", C.accent)}
      {chain(230, "B", C.ok)}

      {SERVERS.map((name, i) => {
        const y = 76 + i * 60;
        return (
          <g key={name}>
            <Box x={520} y={y} w={236} h={48} r={8} />
            <Box x={532} y={y + 6} w={58} h={17} label="PSU1" size={11} r={4} tone="accent" mono />
            <Box x={532} y={y + 25} w={58} h={17} label="PSU2" size={11} r={4} tone="ok" mono />
            <T x={606} y={y + 24} size={13} weight={600} fill={C.fg} middle>
              {name}
            </T>
            <Elbow points={[[400, 44], [452, 44], [452, y + 14], [528, y + 14]]} color={C.accent} head={6} />
            <Elbow points={[[400, 250], [478, 250], [478, y + 33], [528, y + 33]]} color={C.ok} head={6} />
          </g>
        );
      })}

      <T x={400} y={296} size={12.5} fill={C.subtle} anchor="middle">
        PSU を 2 台積んでも、同じ PDU から 2 本取れば冗長にならない — 分かれているのは根元から
      </T>
    </svg>
  );
}

const LEAVES = ["サーバー A", "サーバー B", "サーバー C", "サーバー D"];

/**
 * ブレイクアウト。「速度を割る」のではなく「束ねてあるレーンを解く」操作だと
 * 分かるよう、通常の使い方と並べている。
 */
export function Breakout() {
  return (
    <svg viewBox="0 0 800 326" role="img" aria-label="通常のリンクとブレイクアウトの比較">
      <T x={16} y={16} size={12} weight={700} fill={C.subtle}>
        通常の使い方
      </T>
      <Box x={16} y={28} w={196} h={48} label="QSFP28 100G" sub="スイッチ" size={12.5} />
      <Box x={548} y={28} w={196} h={48} label="QSFP28 100G" sub="サーバー" size={12.5} />
      <Arrow from={[216, 52]} to={[544, 52]} width={4} head={10} />
      <T x={380} y={38} size={12.5} fill={C.muted} anchor="middle">
        25G × 4 レーンを束ねたまま 1 本のリンクとして使う
      </T>

      <line x1={16} y1={100} x2={784} y2={100} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />

      <T x={16} y={124} size={12} weight={700} fill={C.accent}>
        ブレイクアウト
      </T>
      <Box x={16} y={182} w={196} h={48} label="QSFP28 100G" sub="スイッチ（同じポート）" size={12.5} tone="accent" />
      {LEAVES.map((name, i) => {
        const y = 138 + i * 42;
        return (
          <g key={name}>
            <Box x={548} y={y} w={196} h={32} label={`SFP28 25G — ${name}`} size={12.5} tone="accent" r={6} />
            <Elbow points={[[216, 206], [300, 206], [300, y + 16], [544, y + 16]]} color={C.accent} head={7} />
          </g>
        );
      })}
      <T x={420} y={130} size={12.5} fill={C.muted} anchor="middle">
        束を解いて 1 レーンずつ別の機器へ
      </T>

      <T x={400} y={316} size={12.5} fill={C.subtle} anchor="middle">
        成立の条件はレーン速度の一致。100G (4×25G) → 4×25G は可、400G-SR8 → 4×100G-SR4 は不可
      </T>
    </svg>
  );
}

/**
 * ホットアイル / コールドアイル。
 * ラックを背中合わせに並べる理由は「熱気と冷気を混ぜないこと」の一点に尽きるので、
 * 気流の向きを主役にして、前面と背面の向きが揃っていることを見せる。
 */
export function HotColdAisle() {
  const rack = (x: number, name: string, frontRight: boolean) => {
    const front = frontRight ? x + 108 : x;
    const back = frontRight ? x : x + 108;
    return (
      <g>
        <Box x={x} y={74} w={120} h={152} r={8} />
        <rect x={front} y={74} width={12} height={152} rx={4} fill={C.ok} opacity={0.55} />
        <rect x={back} y={74} width={12} height={152} rx={4} fill={C.ng} opacity={0.55} />
        <T x={x + 60} y={112} size={13} weight={700} fill={C.fg} anchor="middle">
          {name}
        </T>
        <T x={x + 60} y={144} size={12} fill={C.ok} anchor="middle" weight={600}>
          {frontRight ? "前面 →" : "← 前面"}
        </T>
        <T x={x + 60} y={164} size={12} fill={C.muted} anchor="middle">
          冷気を吸う
        </T>
        <T x={x + 60} y={196} size={12} fill={C.ng} anchor="middle" weight={600}>
          {frontRight ? "← 背面" : "背面 →"}
        </T>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 800 322" role="img" aria-label="ホットアイルとコールドアイルの配置と気流">
      <Band x={16} y={50} w={148} h={200} label="ホットアイル" />
      <Band x={310} y={50} w={180} h={200} label="コールドアイル" />
      <Band x={636} y={50} w={148} h={200} label="ホットアイル" align="right" />

      {rack(178, "ラック A", true)}
      {rack(502, "ラック B", false)}

      <Arrow from={[400, 238]} to={[400, 88]} color={C.ok} width={3} head={9} />
      <Arrow from={[386, 150]} to={[316, 150]} color={C.ok} width={2} head={7} />
      <Arrow from={[414, 150]} to={[484, 150]} color={C.ok} width={2} head={7} />
      <T x={400} y={268} size={12.5} weight={600} fill={C.ok} anchor="middle">
        有孔タイルから冷気が上がる
      </T>

      <Arrow from={[174, 150]} to={[104, 150]} color={C.ng} width={2.5} head={8} />
      <Arrow from={[626, 150]} to={[696, 150]} color={C.ng} width={2.5} head={8} />
      <Arrow from={[90, 124]} to={[90, 64]} color={C.ng} width={2} head={7} />
      <Arrow from={[710, 124]} to={[710, 64]} color={C.ng} width={2} head={7} />
      <T x={90} y={180} size={12} weight={600} fill={C.ng} anchor="middle">
        熱気
      </T>
      <T x={710} y={180} size={12} weight={600} fill={C.ng} anchor="middle">
        熱気
      </T>
      <T x={400} y={36} size={12} fill={C.subtle} anchor="middle">
        熱気は天井から空調へ戻る
      </T>

      <T x={400} y={312} size={12} fill={C.subtle} anchor="middle">
        背中合わせに並べる理由はこれだけ — 1 台でも向きが違うと、隣の吸気に熱気が入る
      </T>
    </svg>
  );
}

/**
 * ToR と EoR。判断材料は「スイッチの台数」と「ラックから出る本数」の
 * トレードオフなので、そのまま線の本数の違いとして描いている。
 */
export function TorEorMor() {
  return (
    <svg viewBox="0 0 800 340" role="img" aria-label="ToR 構成と EoR 構成の配線量の違い">
      <line x1={400} y1={14} x2={400} y2={300} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />

      <T x={20} y={24} size={13} weight={700} fill={C.accent}>
        ToR（各ラックの上にスイッチ）
      </T>
      {[0, 1, 2].map((i) => {
        const x = 26 + i * 120;
        return (
          <g key={i}>
            <Box x={x} y={44} w={104} h={168} r={8} tone="ghost" />
            <Box x={x + 10} y={54} w={84} h={30} label="SW" size={12} r={5} tone="accent" />
            {[0, 1, 2].map((k) => (
              <Box key={k} x={x + 10} y={92 + k * 38} w={84} h={30} label="サーバー" size={12} r={5} />
            ))}
            <Elbow points={[[x + 52, 214], [x + 52, 244], [198, 244], [198, 262]]} color={C.accent} head={6} />
          </g>
        );
      })}
      <T x={198} y={286} size={12} weight={600} fill={C.accent} anchor="middle">
        ラック外へ出るのは数本だけ
      </T>

      <T x={424} y={24} size={13} weight={700} fill={C.muted}>
        EoR（列の端にスイッチ）
      </T>
      {[0, 1, 2].map((i) => {
        const x = 424 + i * 88;
        const cx = x + 40;
        return (
          <g key={i}>
            <Box x={x} y={44} w={80} h={158} r={8} tone="ghost" />
            {[0, 1, 2, 3].map((k) => (
              <Box key={k} x={x + 7} y={54 + k * 36} w={66} h={28} label="サーバー" size={11} r={5} />
            ))}
            {/* ケーブルは束ねてラックの下を通す。1 本ずつ描くと後段のラックを貫通してしまう */}
            <Elbow
              points={[
                [cx, 204],
                [cx, 218 + i * 9],
                [739, 218 + i * 9],
                [739, 206],
              ]}
              color={C.subtle}
              head={6}
              width={2.5}
            />
          </g>
        );
      })}
      <Box x={700} y={44} w={78} h={158} r={8} label="SW" size={12} tone="plain" />
      <T x={600} y={272} size={12} weight={600} fill={C.muted} anchor="middle">
        スイッチは少ないが、1 台ごとに長いケーブルが列端まで走る
      </T>
      <T x={600} y={290} size={12} fill={C.subtle} anchor="middle">
        この例なら 12 本ぶん
      </T>

      <T x={400} y={330} size={12} fill={C.subtle} anchor="middle">
        ToR はスイッチ台数と引き換えに配線を短くする。高速化で距離が効くほど ToR が有利になる
      </T>
    </svg>
  );
}

/**
 * パッチパネルを挟む理由。
 * 「幹線は固定して、動かすのは端の短いコードだけにする」という構造化配線の骨子。
 */
export function PatchPanel() {
  return (
    <svg viewBox="0 0 800 276" role="img" aria-label="直結配線とパッチパネル経由の比較">
      <T x={20} y={24} size={12.5} weight={700} fill={C.ng}>
        直結
      </T>
      <Box x={20} y={36} w={150} h={48} label="サーバー" size={12.5} />
      <Box x={630} y={36} w={150} h={48} label="スイッチ" size={12.5} />
      <Arrow from={[174, 60]} to={[626, 60]} color={C.ng} width={2} bidi />
      <T x={400} y={48} size={12} fill={C.ng} anchor="middle" weight={600}>
        長いケーブルを 1 本ずつ直接引く
      </T>
      <T x={400} y={102} size={12} fill={C.muted} anchor="middle">
        機器を入れ替えるたびに、その長いケーブルを引き直すことになる
      </T>

      <line x1={20} y1={128} x2={780} y2={128} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />

      <T x={20} y={156} size={12.5} weight={700} fill={C.ok}>
        パッチパネル経由（構造化配線）
      </T>
      <Box x={20} y={168} w={124} h={48} label="サーバー" size={12.5} />
      <Box x={196} y={168} w={130} h={48} label="パッチパネル" size={12} tone="ok" />
      <Box x={474} y={168} w={130} h={48} label="パッチパネル" size={12} tone="ok" />
      <Box x={656} y={168} w={124} h={48} label="スイッチ" size={12.5} />
      <Arrow from={[148, 192]} to={[192, 192]} color={C.accent} head={6} />
      <Arrow from={[330, 192]} to={[470, 192]} color={C.subtle} width={4} head={9} bidi />
      <Arrow from={[652, 192]} to={[608, 192]} color={C.accent} head={6} />
      <T x={400} y={182} size={12} fill={C.subtle} anchor="middle">
        幹線は敷いたら動かさない
      </T>
      <T x={400} y={240} size={12} fill={C.ok} anchor="middle" weight={600}>
        入れ替えで触るのは、両端の短いパッチコードだけ
      </T>

      <T x={400} y={268} size={12} fill={C.subtle} anchor="middle">
        ラック内の配線が固定されるので、増設のたびに床下や天井を触らずに済む
      </T>
    </svg>
  );
}

const NAME_PARTS = [
  { x: 60, w: 120, token: "100G", y: 128, label: "速度" },
  { x: 192, w: 120, token: "BASE", y: 170, label: "ベースバンド伝送（ほぼ常に BASE）" },
  { x: 356, w: 92, token: "SR", y: 212, label: "到達距離と媒体の種別（SR = 短距離マルチモード）" },
  { x: 460, w: 70, token: "4", y: 254, label: "レーン数（または波長数）" },
];

/** 規格名の分解。ここが読めると、型番だけで距離とレーン構成が分かる。 */
export function EthernetNaming() {
  return (
    <svg viewBox="0 0 800 300" role="img" aria-label="100GBASE-SR4 という規格名の分解">
      {NAME_PARTS.map((p) => (
        <Box key={p.token} x={p.x} y={40} w={p.w} h={54} label={p.token} size={18} mono tone="accent" />
      ))}
      <T x={334} y={67} size={18} fill={C.muted} anchor="middle" middle mono>
        -
      </T>

      {NAME_PARTS.map((p) => (
        <g key={`l-${p.token}`}>
          <Elbow
            points={[
              [p.x + p.w / 2, 98],
              [p.x + p.w / 2, p.y - 6],
              [p.x + p.w / 2 + 16, p.y - 6],
            ]}
            color={C.accent}
            head={6}
            width={1.3}
          />
          <T x={p.x + p.w / 2 + 26} y={p.y - 6} size={12.5} fill={C.fg} middle>
            {p.label}
          </T>
        </g>
      ))}

      <T x={400} y={290} size={12} fill={C.subtle} anchor="middle">
        100GBASE-SR4 = 25G のレーン × 4、マルチモードで約 100m
      </T>
    </svg>
  );
}

/**
 * ブランクパネル。
 * 空きスロットがあると、背面の熱気が筐体を通り抜けて前面へ回り込む。
 * 「上のサーバーが自分の排気を吸う」という循環を見せる。
 */
export function BlankPanel() {
  const unit = (x: number, y: number, label: string, tone: "plain" | "ghost" | "ok") => (
    <Box x={x} y={y} w={150} h={40} label={label} size={12.5} tone={tone} r={4} />
  );

  return (
    <svg viewBox="0 0 800 306" role="img" aria-label="ブランクパネルの有無による熱気の回り込み">
      <line x1={400} y1={14} x2={400} y2={272} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />

      <T x={24} y={26} size={12.5} weight={700} fill={C.ng}>
        ブランクパネルなし
      </T>
      <Box x={110} y={46} w={170} h={176} r={8} tone="ghost" />
      {unit(120, 58, "サーバー", "plain")}
      {unit(120, 110, "空き", "ghost")}
      {unit(120, 162, "サーバー", "plain")}
      <Elbow points={[[330, 200], [330, 130], [274, 130]]} color={C.ng} width={2.5} head={8} />
      <Elbow points={[[274, 124], [92, 124], [92, 84], [116, 84]]} color={C.ng} width={2.5} head={8} />
      <T x={196} y={244} size={12} weight={600} fill={C.ng} anchor="middle">
        背面の熱気が空きスロットを通って前へ回る
      </T>
      <T x={196} y={264} size={12} fill={C.muted} anchor="middle">
        上のサーバーが自分たちの排気を吸い込む
      </T>

      <T x={424} y={26} size={12.5} weight={700} fill={C.ok}>
        ブランクパネルあり
      </T>
      <Box x={510} y={46} w={170} h={176} r={8} tone="ghost" />
      {unit(520, 58, "サーバー", "plain")}
      {unit(520, 110, "ブランクパネル", "ok")}
      {unit(520, 162, "サーバー", "plain")}
      <Elbow points={[[730, 200], [730, 130], [692, 130]]} color={C.ng} width={2.5} head={8} />
      <line x1={676} y1={116} x2={706} y2={146} stroke={C.ng} strokeWidth={2.5} />
      <T x={596} y={244} size={12} weight={600} fill={C.ok} anchor="middle">
        経路が塞がれ、熱気は背面に留まる
      </T>
      <T x={596} y={264} size={12} fill={C.muted} anchor="middle">
        数百円の板 1 枚で吸気温度が数度変わる
      </T>

      <T x={400} y={296} size={12} fill={C.subtle} anchor="middle">
        ラック単位で温度が上がっているのに空調は正常、というときはまずここを疑う
      </T>
    </svg>
  );
}

const FABRIC_LEAVES = [
  { x: 40, label: "リーフ 1", rack: "ラック A" },
  { x: 250, label: "リーフ 2", rack: "ラック B" },
  { x: 460, label: "リーフ 3", rack: "ラック C" },
  { x: 670, label: "リーフ 4", rack: "ラック D" },
];
const SPINES = [
  { x: 150, label: "スパイン 1" },
  { x: 460, label: "スパイン 2" },
];

/**
 * スパイン・リーフ。
 * 決まりは「全リーフが全スパインに繋がる」「リーフ同士は繋がない」の 2 つだけで、
 * そこから「どのラック間も 3 ホップ」が出てくる。等距離だから ECMP が成り立つ、
 * という因果が読めるように、リンクを全部描いている。
 */
export function SpineLeaf() {
  const leafW = 130;
  const spineW = 190;
  const spineY = 44;
  const leafY = 168;
  const h = 56;

  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="スパイン・リーフ構成と全リンク">
      <T x={16} y={24} size={12} weight={700} fill={C.subtle}>
        スパイン層（リーフ同士を繋ぐためだけのスイッチ。サーバーは繋がない）
      </T>

      {SPINES.map((s) =>
        FABRIC_LEAVES.map((l) => (
          <line
            key={`${s.label}-${l.label}`}
            x1={s.x + spineW / 2}
            y1={spineY + h}
            x2={l.x + leafW / 2}
            y2={leafY}
            stroke={C.border}
            strokeWidth={1.5}
          />
        )),
      )}

      {SPINES.map((s) => (
        <Box key={s.label} x={s.x} y={spineY} w={spineW} h={h} label={s.label} size={13} tone="accent" />
      ))}

      {FABRIC_LEAVES.map((l) => (
        <g key={l.label}>
          <Box x={l.x} y={leafY} w={leafW} h={h} label={l.label} sub={l.rack} size={12.5} />
          <Box
            x={l.x}
            y={leafY + 76}
            w={leafW}
            h={40}
            label="サーバー群"
            size={12}
            tone="ghost"
            dashed
          />
          <Arrow from={[l.x + leafW / 2, leafY + 72]} to={[l.x + leafW / 2, leafY + h + 4]} head={6} />
        </g>
      ))}

      <T x={16} y={158} size={12} weight={700} fill={C.subtle}>
        リーフ層（各ラックの ToR。サーバーは自分のラックのリーフにだけ繋ぐ）
      </T>

      <T x={400} y={322} size={12} fill={C.subtle} anchor="middle">
        どのラックからどのラックへも必ず 3 ホップ。距離が同じだから、経路に優劣がない（= ECMP）
      </T>
    </svg>
  );
}
