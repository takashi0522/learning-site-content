import { Arrow, Box, C, Elbow, Step, T } from "./primitives";

/**
 * 学習ループの 1 周。各段で GPU のメモリに何が足され、何が消えるかを添える。
 * 主題は「計算の順番」と「メモリの出入り」が同じ周期で回っていること。
 */
export function TrainingLoop() {
  const stage = (x: number, n: number, label: string, sub: string, note1: string, note2: string, tone: "plain" | "accent") => (
    <g>
      <Step x={x + 12} y={58} n={n} />
      <Box x={x} y={70} w={146} h={62} label={label} sub={sub} size={13.5} tone={tone} />
      <T x={x + 73} y={156} size={12} fill={C.fg} weight={600} anchor="middle">
        {note1}
      </T>
      <T x={x + 73} y={176} size={12} anchor="middle">
        {note2}
      </T>
    </g>
  );

  return (
    <svg viewBox="0 0 800 300" role="img" aria-label="学習ループの 1 周と、各段でのメモリの出入り">
      {stage(16, 1, "バッチを読む", "データローダ", "入力を GPU へ", "（基盤側: ストレージ）", "plain")}
      {stage(212, 2, "forward", "予測と loss", "中間結果を保存する", "backward で使うため", "accent")}
      {stage(408, 3, "backward", "勾配を計算", "勾配ができる", "保存した中間結果は解放", "accent")}
      {stage(604, 4, "optimizer.step", "重みを直す", "重みと状態を更新", "勾配はここで使い終わる", "accent")}

      <Arrow from={[162, 101]} to={[210, 101]} color={C.subtle} />
      <Arrow from={[358, 101]} to={[406, 101]} color={C.subtle} />
      <Arrow from={[554, 101]} to={[602, 101]} color={C.subtle} />

      <Elbow
        points={[
          [677, 186],
          [677, 230],
          [89, 230],
          [89, 188],
        ]}
        color={C.subtle}
      />
      <T x={383} y={250} size={12.5} fill={C.fg} weight={600} anchor="middle">
        次のバッチへ（zero_grad で勾配を 0 に戻してから）
      </T>
      <T x={400} y={286} size={12} fill={C.subtle} anchor="middle">
        1 周 = 1 ステップ。データセットを 1 回読み終えると 1 エポック
      </T>
    </svg>
  );
}

/**
 * 混合精度で Adam を使うときの、パラメータ 1 個あたりのメモリ (ZeRO 論文の内訳)。
 * forward / backward が触るのは左の 4 バイトで、残り 12 バイトは更新のためだけにある。
 */
export function ModelStateBytes() {
  const unit = 40;
  const x0 = 72;
  const parts = [
    { b: 2, label: "重み", sub: "FP16", tone: "accent" as const },
    { b: 2, label: "勾配", sub: "FP16", tone: "accent" as const },
    { b: 4, label: "重みの控え", sub: "FP32", tone: "plain" as const },
    { b: 4, label: "Adam の m", sub: "FP32", tone: "plain" as const },
    { b: 4, label: "Adam の v", sub: "FP32", tone: "plain" as const },
  ];
  let x = x0;
  const placed = parts.map((p) => {
    const at = x;
    x += p.b * unit;
    return { ...p, x: at, w: p.b * unit };
  });

  return (
    <svg viewBox="0 0 800 270" role="img" aria-label="混合精度の Adam でパラメータ 1 個あたりに必要なメモリの内訳">
      {placed.map((p) => (
        <Box key={p.label} x={p.x} y={60} w={p.w} h={64} label={p.label} sub={`${p.sub}・${p.b} B`} size={13} tone={p.tone} r={4} />
      ))}

      <line x1={x0} y1={140} x2={x0 + 4 * unit} y2={140} stroke={C.accent} strokeWidth={2} />
      <T x={x0 + 2 * unit} y={162} size={12.5} fill={C.fg} weight={600} anchor="middle">
        forward / backward が使う 4 B
      </T>
      <line x1={x0 + 4 * unit} y1={140} x2={x0 + 16 * unit} y2={140} stroke={C.subtle} strokeWidth={2} />
      <T x={x0 + 10 * unit} y={162} size={12.5} fill={C.fg} weight={600} anchor="middle">
        オプティマイザの状態 12 B（更新のときだけ使う）
      </T>

      <T x={x0} y={40} size={13} fill={C.fg} weight={700}>
        パラメータ 1 個あたり 16 バイト
      </T>
      <T x={x0} y={204} size={12}>
        この内訳を 7B（70 億パラメータ）に当てはめると 16 B × 7B = 112 GB。活性化などは含まない
      </T>
      <T x={x0} y={226} size={12}>
        推論だけなら FP16 の重み 2 B × 7B = 14 GB で済む（KV キャッシュは別）
      </T>
      <T x={400} y={258} size={12} fill={C.subtle} anchor="middle">
        出典: ZeRO（Rajbhandari et al.）の混合精度 Adam の内訳
      </T>
    </svg>
  );
}

/** 2 つの「チェックポイント」。名前が同じでも、狙いも置き場所も違う。 */
export function TwoCheckpoints() {
  return (
    <svg viewBox="0 0 800 250" role="img" aria-label="activation checkpointing とチェックポイント保存の違い">
      <Box x={16} y={24} w={372} h={188} tone="ghost" />
      <T x={202} y={50} size={14} fill={C.fg} weight={700} anchor="middle">
        activation checkpointing
      </T>
      <T x={202} y={72} size={12} anchor="middle">
        GPU メモリの中の話
      </T>
      <Box x={40} y={92} w={140} h={46} label="forward" sub="中間結果を一部捨てる" size={12.5} tone="accent" />
      <Box x={224} y={92} w={140} h={46} label="backward" sub="捨てた分を計算し直す" size={12.5} tone="accent" />
      <Arrow from={[180, 115]} to={[222, 115]} color={C.subtle} />
      <T x={202} y={168} size={12.5} fill={C.fg} weight={600} anchor="middle">
        メモリが減り、計算が増える
      </T>
      <T x={202} y={190} size={12} anchor="middle">
        何も保存しない。ジョブが落ちたら消える
      </T>

      <Box x={412} y={24} w={372} h={188} tone="ghost" />
      <T x={598} y={50} size={14} fill={C.fg} weight={700} anchor="middle">
        チェックポイント（の保存）
      </T>
      <T x={598} y={72} size={12} anchor="middle">
        ストレージの話
      </T>
      <Box x={436} y={92} w={140} h={46} label="学習の状態" sub="重み・オプティマイザ" size={12.5} tone="accent" />
      <Box x={620} y={92} w={140} h={46} label="ファイル" sub="共有ストレージ" size={12.5} />
      <Arrow from={[576, 115]} to={[618, 115]} color={C.subtle} />
      <T x={598} y={168} size={12.5} fill={C.fg} weight={600} anchor="middle">
        落ちても途中から再開できる
      </T>
      <T x={598} y={190} size={12} anchor="middle">
        保存中は書き込みの負荷が出る（レッスン 3）
      </T>

      <T x={400} y={240} size={12} fill={C.subtle} anchor="middle">
        ログや設定で「checkpoint」と出てきたら、どちらの意味かを先に確かめる
      </T>
    </svg>
  );
}

