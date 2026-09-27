import { Arrow, Band, Box, C, Step, T } from "./primitives";

/**
 * 受信パケットの経路。切り分けの起点になる図なので、
 * ハードウェア / カーネル / ユーザー空間の境界をどこで跨ぐかを主役にしている。
 */
export function RxPacketPath() {
  return (
    <svg viewBox="0 0 800 352" role="img" aria-label="NIC からアプリケーションまでのパケット受信経路">
      <Band x={16} y={20} w={768} h={72} label="ユーザー空間" align="right" />
      <Band x={16} y={108} w={768} h={136} label="カーネル空間" align="right" />
      <Band x={16} y={258} w={768} h={72} label="ハードウェア" align="right" />

      {/* ハードウェア */}
      <Box x={48} y={270} w={150} h={42} label="NIC" sub="フレームを受信" size={13} />
      <Box x={256} y={270} w={172} h={42} label="RX リング" sub="DMA で主記憶へ" size={13} />

      {/* カーネル */}
      <Box x={256} y={190} w={172} h={44} label="softirq NET_RX" sub="NAPI でポーリング回収" size={12.5} tone="accent" />
      <Box x={452} y={190} w={214} h={44} label="IP → netfilter → TCP" size={12.5} tone="accent" />
      <Box x={452} y={124} w={214} h={44} label="ソケット受信バッファ" sub="rcvbuf" size={12.5} />

      {/* ユーザー空間 */}
      <Box x={452} y={32} w={214} h={46} label="アプリケーション" sub="recv() で取り出す" size={13} />

      <Arrow from={[18, 291]} to={[44, 291]} />
      <Arrow from={[198, 291]} to={[252, 291]} />
      <Arrow from={[342, 266]} to={[342, 238]} color={C.accent} />
      <Arrow from={[428, 212]} to={[448, 212]} color={C.accent} />
      <Arrow from={[559, 186]} to={[559, 172]} color={C.accent} />
      <Arrow from={[559, 120]} to={[559, 82]} />

      <Step x={40} y={264} n={1} tone="ghost" />
      <Step x={248} y={264} n={2} tone="ghost" />
      <Step x={372} y={252} n={3} />
      <Step x={248} y={184} n={4} />
      <Step x={444} y={184} n={5} />
      <Step x={444} y={118} n={6} tone="ghost" />
      <Step x={444} y={26} n={7} tone="ghost" />

      <T x={386} y={252} size={12} fill={C.accent} weight={600}>
        ハード割り込み → 以降は softirq へ委譲
      </T>
      <T x={30} y={332} size={12} fill={C.subtle}>
        物理線
      </T>

      <T x={694} y={212} size={12} fill={C.subtle}>
        ここで落ちると
      </T>
      <T x={694} y={228} size={12} fill={C.ng} mono>
        rx_dropped
      </T>
      <T x={694} y={146} size={12} fill={C.subtle}>
        溢れると
      </T>
      <T x={694} y={162} size={12} fill={C.ng} mono>
        Recv-Q
      </T>

      <T x={400} y={346} size={12.5} fill={C.subtle} anchor="middle">
        「届かない」はこの 7 段のどこで消えたかの問題 — 段ごとに見るカウンタが違う
      </T>
    </svg>
  );
}

/**
 * 接続確立時の 2 つのキュー。
 * 「接続が落ちる」の切り分けで、どちらのキューが溢れたのかで見る場所も対処も変わるため、
 * 溢れたときに現れる兆候を各キューの横に並べている。
 */
export function TcpQueues() {
  return (
    <svg viewBox="0 0 800 348" role="img" aria-label="SYN キューと accept キュー">
      <Box x={16} y={22} w={150} h={46} label="クライアント" size={13} />
      <line x1={91} y1={72} x2={91} y2={318} stroke={C.border} strokeWidth={1.2} strokeDasharray="4 6" />

      <Band x={196} y={22} w={588} h={296} label="サーバー（カーネル）" align="right" />

      <Box x={224} y={72} w={230} h={56} label="SYN キュー" sub="半開き（SYN_RECV）" size={13} tone="accent" />
      <Box x={224} y={176} w={230} h={56} label="accept キュー" sub="確立済み（ESTABLISHED）" size={13} tone="accent" />
      <Box x={224} y={266} w={230} h={44} label="アプリケーション" size={13} />

      <Arrow from={[95, 100]} to={[220, 100]} />
      <T x={100} y={90} size={12} fill={C.muted} mono>
        SYN
      </T>
      <Arrow from={[220, 146]} to={[95, 146]} color={C.subtle} />
      <T x={190} y={136} size={12} fill={C.muted} anchor="end" mono>
        SYN+ACK
      </T>
      <Arrow from={[95, 200]} to={[220, 200]} />
      <T x={100} y={190} size={12} fill={C.muted} mono>
        ACK
      </T>

      <Arrow from={[339, 132]} to={[339, 172]} color={C.accent} width={2} />
      <T x={351} y={158} size={12} fill={C.accent} weight={600}>
        ACK が届いた時点で移る
      </T>
      <Arrow from={[339, 236]} to={[339, 262]} color={C.subtle} width={2} />
      <T x={351} y={256} size={12} fill={C.subtle} mono>
        accept()
      </T>

      <T x={478} y={88} size={12} weight={600} fill={C.ng}>
        溢れると
      </T>
      <T x={478} y={106} size={12} fill={C.muted} mono>
        tcp_max_syn_backlog
      </T>
      <T x={478} y={124} size={12} fill={C.muted}>
        SYN cookie が発動する
      </T>

      <T x={478} y={192} size={12} weight={600} fill={C.ng}>
        溢れると
      </T>
      <T x={478} y={210} size={12} fill={C.muted} mono>
        somaxconn / listen(backlog)
      </T>
      <T x={478} y={228} size={12} fill={C.muted}>
        ss -ltn の Recv-Q が張り付く
      </T>

      <T x={400} y={340} size={12} fill={C.subtle} anchor="middle">
        アプリが accept() を呼ぶのが遅いと、3 ウェイは成立しているのに接続が捨てられる
      </T>
    </svg>
  );
}

/**
 * 切断と、残る 2 つの状態。
 * CLOSE_WAIT が受動側に、TIME_WAIT が能動側に溜まるという
 * 「どちら側に出るか」が切り分けの決め手になる。
 */
export function TcpTeardown() {
  return (
    <svg viewBox="0 0 800 342" role="img" aria-label="TCP の切断手順と CLOSE_WAIT / TIME_WAIT">
      <Box x={70} y={20} w={220} h={46} label="能動側" sub="先に閉じたほう" size={13} />
      <Box x={510} y={20} w={220} h={46} label="受動側" size={13} />
      <line x1={180} y1={70} x2={180} y2={252} stroke={C.border} strokeWidth={1.2} strokeDasharray="4 6" />
      <line x1={620} y1={70} x2={620} y2={252} stroke={C.border} strokeWidth={1.2} strokeDasharray="4 6" />

      <Arrow from={[184, 100]} to={[616, 100]} />
      <T x={400} y={90} size={12.5} fill={C.muted} anchor="middle" mono>
        FIN
      </T>
      <T x={640} y={124} size={12.5} weight={600} fill={C.ng}>
        CLOSE_WAIT に入る
      </T>

      <Arrow from={[616, 152]} to={[184, 152]} color={C.subtle} />
      <T x={400} y={142} size={12.5} fill={C.muted} anchor="middle" mono>
        ACK
      </T>

      <Arrow from={[616, 196]} to={[184, 196]} color={C.subtle} />
      <T x={400} y={186} size={12.5} fill={C.muted} anchor="middle" mono>
        FIN
      </T>
      <T x={400} y={218} size={12} fill={C.muted} anchor="middle">
        アプリが close() を呼んで初めて送られる
      </T>

      <Arrow from={[184, 246]} to={[616, 246]} />
      <T x={400} y={236} size={12.5} fill={C.muted} anchor="middle" mono>
        ACK
      </T>

      <Box x={70} y={268} w={220} h={46} label="TIME_WAIT" sub="既定 60 秒" size={13} tone="accent" mono />
      <Box x={510} y={268} w={220} h={46} label="CLOSED" size={13} mono />

      <T x={400} y={286} size={12} fill={C.ng} anchor="middle" weight={600}>
        CLOSE_WAIT が積み上がる
      </T>
      <T x={400} y={304} size={12} fill={C.muted} anchor="middle">
        = 受動側のアプリが close() を
      </T>
      <T x={400} y={320} size={12} fill={C.muted} anchor="middle">
        呼んでいない。カーネルの問題ではない
      </T>

      <T x={400} y={338} size={12} fill={C.subtle} anchor="middle">
        TIME_WAIT は能動側に、CLOSE_WAIT は受動側に出る — どちらに溜まったかで原因が分かれる
      </T>
    </svg>
  );
}

/**
 * TLS 1.2 と 1.3 の往復回数。
 * 「1 往復減る」が体感でどれだけ効くかは RTT 次第なので、
 * ブロックの数として見せておく。
 */
export function TlsHandshakeRtt() {
  const block = (x: number, y: number, w: number, label: string, tone: "plain" | "accent") => (
    <Box x={x} y={y} w={w} h={48} label={label} size={12.5} tone={tone} />
  );
  return (
    <svg viewBox="0 0 800 272" role="img" aria-label="TLS 1.2 と TLS 1.3 のハンドシェイク往復回数">
      <T x={20} y={40} size={13} weight={700} fill={C.muted} middle>
        TLS 1.2
      </T>
      {block(96, 16, 150, "TCP 1 RTT", "plain")}
      {block(254, 16, 150, "TLS 1 RTT", "accent")}
      {block(412, 16, 150, "TLS 1 RTT", "accent")}
      <T x={588} y={40} size={13} weight={700} fill={C.muted} middle>
        合計 3 RTT
      </T>

      <T x={20} y={136} size={13} weight={700} fill={C.fg} middle>
        TLS 1.3
      </T>
      {block(96, 112, 150, "TCP 1 RTT", "plain")}
      {block(254, 112, 150, "TLS 1 RTT", "accent")}
      <rect x={412} y={112} width={150} height={48} rx={8} fill="none" stroke={C.ok} strokeWidth={1.5} strokeDasharray="5 4" />
      <T x={487} y={136} size={12.5} weight={600} fill={C.ok} anchor="middle" middle>
        1 往復削減
      </T>
      <T x={588} y={136} size={13} weight={700} fill={C.ok} middle>
        合計 2 RTT
      </T>

      <T x={400} y={200} size={12.5} fill={C.fg} anchor="middle">
        RTT 20ms の国内なら 60ms → 40ms、RTT 150ms の海外なら 450ms → 300ms
      </T>
      <T x={400} y={224} size={12} fill={C.muted} anchor="middle">
        セッション再開（0-RTT）が効けば、2 回目以降はさらに短くなる
      </T>

      <T x={400} y={262} size={12} fill={C.subtle} anchor="middle">
        遠いクライアントほど TLS 1.3 の効きが大きい。距離は RTT でしか縮まない
      </T>
    </svg>
  );
}
