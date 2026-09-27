import { Box, Elbow, Arrow, Step, T, C } from "./primitives";

/**
 * PFC は 1 ホップずつ上流へ伝播し、同じ優先度クラスを丸ごと止める。
 * 輻輳と無関係な送信 B まで巻き添えになるのが head-of-line blocking。
 */
export function PfcPause() {
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="PFC の PAUSE が上流へ伝播し、無関係な送信も止まる">
      <line x1={30} y1={40} x2={70} y2={40} stroke={C.accent} strokeWidth={2.5} strokeLinecap="round" />
      <T x={78} y={40} size={12} fill={C.muted} middle>
        データ（優先度 3 の RoCE）
      </T>
      <line
        x1={300}
        y1={40}
        x2={340}
        y2={40}
        stroke={C.ng}
        strokeWidth={2.5}
        strokeDasharray="5 4"
        strokeLinecap="round"
      />
      <T x={348} y={40} size={12} fill={C.muted} middle>
        PAUSE（送信を止めろ、という要求）
      </T>

      <Box x={30} y={110} w={110} h={56} label="送信 A" sub="輻輳の原因" />
      <Box x={220} y={110} w={110} h={56} label="スイッチ 1" />
      <Box x={410} y={110} w={110} h={56} label="スイッチ 2" />
      <Box x={600} y={110} w={130} h={56} label="受信" sub="バッファ満杯" tone="ng" />

      <Arrow from={[142, 126]} to={[218, 126]} color={C.accent} />
      <Arrow from={[332, 126]} to={[408, 126]} color={C.accent} />
      <Arrow from={[522, 126]} to={[598, 126]} color={C.accent} />

      <Arrow from={[598, 152]} to={[522, 152]} color={C.ng} dashed />
      <Arrow from={[408, 152]} to={[332, 152]} color={C.ng} dashed />
      <Arrow from={[218, 152]} to={[142, 152]} color={C.ng} dashed />

      <Box x={30} y={232} w={110} h={56} label="送信 B" sub="別のジョブ" tone="ghost" />
      <line x1={140} y1={260} x2={190} y2={260} stroke={C.border} strokeWidth={1.5} />
      <line x1={190} y1={260} x2={190} y2={166} stroke={C.border} strokeWidth={1.5} />
      <Elbow points={[[232, 166], [232, 260], [148, 260]]} color={C.ng} dashed />

      <T x={252} y={252} size={12} fill={C.ng} weight={600}>
        輻輳と無関係でも、同じ優先度クラスなら一緒に止まる
      </T>
      <T x={252} y={274} size={12} fill={C.muted}>
        （head-of-line blocking。止めたいのは A だけなのに B が犠牲になる）
      </T>
    </svg>
  );
}

/**
 * DCQCN の閉ループ。スイッチが ECN を立て、受信側が CNP を返し、送信側が速度を落とす。
 * PFC が発動する前にこのループで収めるのが狙い。
 */
export function DcqcnLoop() {
  return (
    <svg viewBox="0 0 800 300" role="img" aria-label="ECN と CNP による DCQCN の閉ループ">
      <Box x={40} y={92} w={170} h={62} label="送信 NIC" sub="RP / 速度を調整する" tone="accent" />
      <Box x={315} y={92} w={170} h={62} label="スイッチ" sub="CP / ECN を立てる" />
      <Box x={590} y={92} w={170} h={62} label="受信 NIC" sub="NP / CNP を返す" />

      <Arrow from={[212, 116]} to={[313, 116]} color={C.subtle} />
      <Arrow from={[487, 116]} to={[588, 116]} color={C.subtle} />

      <Step x={400} y={72} n={1} />
      <Step x={675} y={72} n={2} />
      <Step x={125} y={72} n={3} />

      <T x={400} y={50} size={12} fill={C.muted} anchor="middle" middle>
        キュー長が Kmin を超えたら印を付ける
      </T>

      <Elbow points={[[675, 156], [675, 212], [125, 212], [125, 158]]} color={C.accent} />
      <T x={400} y={230} size={13} fill={C.accent} weight={600} anchor="middle" middle>
        CNP（輻輳しているぞ、という通知）
      </T>

      <T x={400} y={268} size={12} fill={C.muted} anchor="middle" middle>
        PFC が出る前に送信側の速度を落とし、キューを空ける
      </T>
    </svg>
  );
}

/**
 * ECMP はフロー単位で経路を固定するため、本数の少ない AI のトラフィックでは偏る。
 * 適応ルーティングは空いている経路を選び直す。
 */
export function EcmpVsAdaptive() {
  const spineXs = [16, 96, 176, 256];
  const group = (x0: number, hit: number | null) => (
    <g>
      {spineXs.map((dx, i) => (
        <Box
          key={dx}
          x={x0 + dx}
          y={72}
          w={62}
          h={40}
          label={`S${i + 1}`}
          size={13}
          tone={hit === null || hit === i ? "plain" : "ghost"}
        />
      ))}
      <Box x={x0 + 118} y={240} w={124} h={46} label="リーフ" size={13} />
    </g>
  );

  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="ECMP のハッシュ衝突と適応ルーティングの比較">
      <T x={190} y={40} size={14} fill={C.fg} weight={700} anchor="middle" middle>
        ECMP（5-tuple ハッシュで固定）
      </T>
      <T x={590} y={40} size={14} fill={C.fg} weight={700} anchor="middle" middle>
        適応ルーティング
      </T>

      <line x1={400} y1={30} x2={400} y2={312} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />

      {group(20, 1)}
      <line x1={184} y1={240} x2={141} y2={112} stroke={C.ng} strokeWidth={3.5} strokeLinecap="round" />
      <line x1={216} y1={240} x2={151} y2={112} stroke={C.ng} strokeWidth={3.5} strokeLinecap="round" />
      <T x={190} y={306} size={12} fill={C.ng} weight={600} anchor="middle" middle>
        2 本とも同じ経路。残り 3 本は空いている
      </T>

      {group(420, null)}
      {spineXs.map((dx, i) => (
        <line
          key={dx}
          x1={600 + (i - 1.5) * 18}
          y1={240}
          x2={420 + dx + 31}
          y2={112}
          stroke={C.ok}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      ))}
      <T x={590} y={306} size={12} fill={C.ok} weight={600} anchor="middle" middle>
        混み具合を見て、空いている経路へ送る
      </T>
    </svg>
  );
}
