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
    <svg viewBox="0 0 800 240" role="img" aria-label="混合精度の Adam でパラメータ 1 個あたりに必要なメモリの内訳">
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


/**
 * DDP の backward。勾配はバケット単位で all-reduce され、バケットが埋まった順に
 * 通信が始まるので、計算と通信が重なる。最後のバケットの通信だけが計算の後ろにはみ出す。
 */
export function DdpOverlap() {
  const x0 = 140;
  const u = 52;
  const layers = ["層 8", "層 7", "層 6", "層 5", "層 4", "層 3", "層 2", "層 1"];
  return (
    <svg viewBox="0 0 800 270" role="img" aria-label="DDP で backward の計算と勾配の all-reduce が重なる様子">
      <T x={24} y={78} size={13} fill={C.fg} weight={700} middle>
        GPU の計算
      </T>
      <T x={24} y={148} size={13} fill={C.fg} weight={700} middle>
        GPU 間の通信
      </T>

      {layers.map((name, i) => (
        <Box key={name} x={x0 + i * u} y={58} w={u - 4} h={40} label={name} size={12} tone="accent" r={4} />
      ))}
      <Box x={x0 + 10 * u} y={58} w={100} h={40} label="step" size={12.5} r={4} />

      {[
        { from: 3, label: "バケット 1" },
        { from: 6, label: "バケット 2" },
        { from: 8, label: "バケット 3" },
      ].map((b) => (
        <g key={b.label}>
          <Box x={x0 + b.from * u} y={128} w={u * 2 - 8} h={40} label={`all-reduce`} sub={b.label} size={12} r={4} />
          <Arrow from={[x0 + b.from * u - 2, 100]} to={[x0 + b.from * u + 6, 126]} color={C.subtle} head={5} />
        </g>
      ))}

      <line x1={x0 + 8 * u} y1={44} x2={x0 + 8 * u} y2={186} stroke={C.ng} strokeWidth={1.5} strokeDasharray="4 4" />
      <T x={x0 + 8 * u - 6} y={206} size={12} fill={C.ng} weight={600} anchor="end">
        backward が終わった時点
      </T>
      <T x={x0 + 8 * u + 6} y={206} size={12} fill={C.ng} weight={600}>
        → 全バケットの通信を待ってから step
      </T>

      <T x={x0} y={30} size={12}>
        backward は出力側の層から順に進む → 勾配がそろったバケットから通信を始める
      </T>
      <T x={400} y={254} size={12} fill={C.subtle} anchor="middle">
        計算と重なった通信は待ち時間として表に出にくい。重なりきらない分が待ち時間になる
      </T>
    </svg>
  );
}

/**
 * テンソル並列・パイプライン並列・データ並列の組み合わせ (Megatron-LM の PTD-P)。
 * どの並列をどの通信路に載せるかが、基盤の構成とそのまま対応する。
 */
export function ParallelismLayout() {
  const node = (x: number, y: number, stage: string) => (
    <g>
      <Box x={x} y={y} w={168} h={98} tone="ghost" />
      <T x={x + 84} y={y + 16} size={12} fill={C.fg} weight={700} anchor="middle" middle>
        {stage}
      </T>
      {[0, 1, 2, 3].map((g) => (
        <Box key={g} x={x + 10 + g * 38} y={y + 32} w={32} h={30} label={`G${g}`} size={12} tone="accent" r={4} />
      ))}
      <T x={x + 84} y={y + 80} size={12} anchor="middle" middle>
        NVLink 内でテンソル並列
      </T>
    </g>
  );
  const replica = (x: number, name: string) => (
    <g>
      <T x={x + 186} y={28} size={13} fill={C.fg} weight={700} anchor="middle">
        {name}
      </T>
      {node(x, 40, "ノード 1: 層 1〜16")}
      {node(x + 204, 40, "ノード 2: 層 17〜32")}
      <Arrow from={[x + 170, 89]} to={[x + 202, 89]} color={C.accent} width={2} />
      <T x={x + 186} y={158} size={12} fill={C.accent} weight={600} anchor="middle">
        パイプライン並列: 活性化を次の段へ
      </T>
    </g>
  );
  return (
    <svg viewBox="0 0 800 292" role="img" aria-label="テンソル並列・パイプライン並列・データ並列の組み合わせ">
      {replica(16, "モデルの複製 A")}
      {replica(424, "モデルの複製 B")}

      <Arrow from={[200, 180]} to={[608, 180]} color={C.ok} width={2} bidi />
      <T x={404} y={200} size={12.5} fill={C.ok} weight={600} anchor="middle">
        データ並列: 複製どうしで勾配を揃える
      </T>

      <T x={24} y={234} size={12}>
        テンソル並列 … 1 つの層の行列を分ける。層ごとに all-reduce が要るので、一般にサーバーの中（NVLink）に留める
      </T>
      <T x={24} y={256} size={12}>
        パイプライン並列 … 層の並びを段に分ける。通信は段の境目だけ（1 対 1）だが、段が空いて待つ時間が出る
      </T>
      <T x={24} y={278} size={12}>
        データ並列 … 同じ構成の複製を並べ、別々のデータを処理させる。段どうし・複製どうしの通信はネットワークを通る
      </T>
    </svg>
  );
}

/**
 * 再開用のチェックポイントと、重みだけの保存の違い。
 * 何を入れるかで、大きさと「そこから再開できるか」が決まる。
 */
export function CheckpointContents() {
  const item = (x: number, y: number, w: number, label: string, sub: string, tone: "accent" | "plain" | "ghost") => (
    <Box x={x} y={y} w={w} h={40} label={label} sub={sub} size={12.5} tone={tone} r={4} />
  );
  return (
    <svg viewBox="0 0 800 270" role="img" aria-label="再開用のチェックポイントと重みだけの保存の違い">
      <T x={200} y={30} size={14} fill={C.fg} weight={700} anchor="middle">
        再開用のチェックポイント
      </T>
      {item(40, 48, 320, "重み", "モデルの state_dict", "accent")}
      {item(40, 94, 320, "オプティマイザの状態", "Adam なら m と v", "plain")}
      {item(40, 140, 154, "スケジューラ", "学習率の進み具合", "plain")}
      {item(206, 140, 154, "乱数の状態", "データの並びなど", "plain")}
      {item(40, 186, 320, "ステップ数・エポック", "どこまで進んだか", "plain")}
      <T x={200} y={252} size={12.5} fill={C.ok} weight={600} anchor="middle">
        途中から、同じ状態で再開できる
      </T>

      <T x={600} y={30} size={14} fill={C.fg} weight={700} anchor="middle">
        重みだけ
      </T>
      {item(440, 48, 320, "重み", "モデルの state_dict", "accent")}
      <Box x={440} y={94} w={320} h={132} tone="ghost" dashed />
      <T x={600} y={152} size={12} anchor="middle" middle>
        オプティマイザ・スケジューラ・乱数は持たない
      </T>
      <T x={600} y={174} size={12} anchor="middle" middle>
        → ずっと小さい
      </T>
      <T x={600} y={252} size={12.5} fill={C.ng} weight={600} anchor="middle">
        推論には使えるが、学習はオプティマイザが最初から
      </T>

    </svg>
  );
}

/**
 * 分散チェックポイント (DCP)。各ランクが自分の担当分を並列に書き、
 * 読むときは別の GPU 数に分け直せる。
 */
export function DcpShards() {
  return (
    <svg viewBox="0 0 800 258" role="img" aria-label="各ランクが自分の分を並列に書き、別の GPU 数で読み直す">
      <T x={130} y={28} size={13} fill={C.fg} weight={700} anchor="middle">
        保存: 8 ランク
      </T>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <g key={i}>
          <Box x={30 + (i % 4) * 52} y={46 + Math.floor(i / 4) * 52} w={44} h={40} label={`R${i}`} size={12} tone="accent" r={4} />
        </g>
      ))}
      <Arrow from={[244, 96]} to={[318, 96]} color={C.accent} width={2.5} />
      <T x={281} y={82} size={12} fill={C.accent} weight={600} anchor="middle">
        並列に書く
      </T>

      <Box x={322} y={36} w={156} h={124} tone="ghost" />
      <T x={400} y={54} size={12.5} fill={C.fg} weight={700} anchor="middle" middle>
        共有ストレージ
      </T>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={336 + (i % 4) * 34} y={74 + Math.floor(i / 4) * 38} width={26} height={30} rx={3} fill={C.surface2} stroke={C.border} />
      ))}
      <T x={400} y={174} size={12} anchor="middle">
        ランクごとに 1 つ以上のファイル
      </T>

      <Arrow from={[482, 96]} to={[556, 96]} color={C.ok} width={2.5} />
      <T x={519} y={82} size={12} fill={C.ok} weight={600} anchor="middle">
        読む
      </T>
      <T x={670} y={28} size={13} fill={C.fg} weight={700} anchor="middle">
        再開: 4 ランク
      </T>
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} x={562 + (i % 2) * 108} y={46 + Math.floor(i / 2) * 52} w={100} h={40} label={`R${i}`} sub="担当が 2 倍" size={12} tone="ok" r={4} />
      ))}

      <T x={24} y={222} size={12}>
        torch.save で 1 つのファイルにまとめる代わりに、各ランクが自分の担当分だけを同時に書く
      </T>
      <T x={24} y={244} size={12}>
        読むときに分け直す（resharding）ので、保存したときと違う GPU 数でも再開できる
      </T>
    </svg>
  );
}

/**
 * LoRA。元の重み W は凍結し、横に足した小さな 2 つの行列 (A, B) だけを学習する。
 * 学習後は B·A を W に足し込める (マージ) ので、推論の経路は元と同じになる。
 */
export function LoraAdapter() {
  return (
    <svg viewBox="0 0 800 290" role="img" aria-label="LoRA は元の重みを凍結し、小さな行列だけを学習する">
      <Box x={40} y={110} w={90} h={44} label="入力 x" size={13} />
      <Arrow from={[130, 132]} to={[176, 92]} color={C.subtle} />
      <Arrow from={[130, 132]} to={[176, 186]} color={C.subtle} />

      <Box x={180} y={36} w={240} h={110} tone="ghost" />
      <T x={300} y={74} size={15} fill={C.fg} weight={700} anchor="middle" middle>
        元の重み W
      </T>
      <T x={300} y={100} size={12} anchor="middle" middle>
        凍結（学習しない）
      </T>
      <T x={300} y={122} size={12} anchor="middle" middle>
        勾配もオプティマイザの状態も持たない
      </T>

      <Box x={180} y={168} w={66} h={60} label="A" sub="r × k" size={14} tone="accent" />
      <Box x={264} y={168} w={66} h={60} label="B" sub="d × r" size={14} tone="accent" />
      <Arrow from={[246, 198]} to={[262, 198]} color={C.subtle} head={5} />
      <T x={300} y={248} size={12} fill={C.accent} weight={600} anchor="middle">
        ここだけ学習する（r は小さい）
      </T>

      <Arrow from={[420, 92]} to={[486, 126]} color={C.subtle} />
      <Arrow from={[330, 198]} to={[486, 140]} color={C.accent} />
      <circle cx={500} cy={132} r={14} fill={C.surface2} stroke={C.border} strokeWidth={1.5} />
      <T x={500} y={132} size={15} fill={C.fg} weight={700} anchor="middle" middle>
        +
      </T>
      <Arrow from={[514, 132]} to={[560, 132]} color={C.subtle} />
      <Box x={564} y={110} w={196} h={44} label="出力 = Wx + BAx" size={13} />

      <T x={540} y={192} size={12} fill={C.fg} weight={600}>
        学習後の選択肢
      </T>
      <T x={540} y={214} size={12}>
        ・BA を W に足し込む（遅延は増えない）
      </T>
      <T x={540} y={236} size={12}>
        ・A と B だけを別に配り、差し替える
      </T>
      <T x={400} y={280} size={12} fill={C.subtle} anchor="middle">
        保存して配るのは A と B だけで済むが、推論には元の重み W が別に要る
      </T>
    </svg>
  );
}

/**
 * 文章の生成は 1 トークンずつのループ。出したトークンを入力の後ろに足して、
 * 終わりの記号か上限の長さに達するまで繰り返す。
 */
export function GenerationLoop() {
  return (
    <svg viewBox="0 0 800 250" role="img" aria-label="文章の生成は 1 トークンずつのループ">
      <Box x={16} y={70} w={120} h={56} label="入力の文章" sub="プロンプト" size={13} />
      <Arrow from={[136, 98]} to={[170, 98]} color={C.subtle} />
      <Box x={172} y={70} w={120} h={56} label="トークナイザ" sub="文章 → ID の列" size={13} />
      <Arrow from={[292, 98]} to={[326, 98]} color={C.subtle} />
      <Box x={328} y={62} w={150} h={72} label="モデル" sub="次の 1 トークンを予測" size={14} tone="accent" />
      <Arrow from={[478, 98]} to={[512, 98]} color={C.subtle} />
      <Box x={514} y={70} w={120} h={56} label="次のトークン" sub="選び方は設定で決まる" size={13} tone="accent" />
      <Elbow
        points={[
          [574, 126],
          [574, 168],
          [403, 168],
          [403, 136],
        ]}
        color={C.accent}
        width={2}
      />
      <T x={488} y={188} size={12} fill={C.accent} weight={600} anchor="middle">
        入力の後ろに足して、もう一度
      </T>
      <Arrow from={[634, 98]} to={[668, 98]} color={C.subtle} dashed />
      <Box x={670} y={70} w={114} h={56} label="文章に戻す" sub="終わったら" size={13} />
      <T x={727} y={150} size={12} anchor="middle">
        終わりの記号（EOS）か
      </T>
      <T x={727} y={168} size={12} anchor="middle">
        上限の長さで止まる
      </T>
      <T x={400} y={232} size={12} fill={C.subtle} anchor="middle">
        出力が長いほど、このループの回数（＝GPU でモデルを通す回数）が増える
      </T>
    </svg>
  );
}

/**
 * vLLM の構成。クライアントは OpenAI 互換の HTTP API を叩き、
 * サーバーは GPU メモリの決めた割合の中に、重みと KV キャッシュを置く。
 */
export function VllmServing() {
  const x0 = 470;
  const w = 300;
  return (
    <svg viewBox="0 0 800 280" role="img" aria-label="vLLM の構成と GPU メモリの使い方">
      <Box x={16} y={40} w={150} h={64} label="アプリ" sub="curl / OpenAI SDK" size={13} />
      <Arrow from={[166, 72]} to={[222, 72]} color={C.subtle} bidi />
      <T x={194} y={58} size={12} anchor="middle">
        HTTP
      </T>
      <Box x={224} y={24} w={200} h={96} tone="accent" />
      <T x={324} y={46} size={14} fill={C.fg} weight={700} anchor="middle" middle>
        vllm serve
      </T>
      <T x={324} y={70} size={12} anchor="middle" middle>
        :8000 で OpenAI 互換の API
      </T>
      <T x={324} y={92} size={12} anchor="middle" middle>
        リクエストをまとめて GPU へ
      </T>
      <Arrow from={[424, 72]} to={[466, 72]} color={C.subtle} />

      <T x={x0} y={16} size={13} fill={C.fg} weight={700}>
        GPU メモリ
      </T>
      <rect x={x0} y={28} width={w} height={88} rx={6} fill="none" stroke={C.border} strokeWidth={1.5} />
      <rect x={x0} y={28} width={w * 0.92} height={88} rx={6} fill={C.accentSoft} stroke={C.accent} strokeWidth={1.5} strokeDasharray="5 4" />
      <Box x={x0 + 8} y={40} w={150} h={64} label="重み" sub="変わらない" size={13} />
      <Box x={x0 + 166} y={40} w={102} h={64} label="KV キャッシュ" sub="この枠の残り" size={12} tone="accent" />
      <T x={x0 + w * 0.92} y={134} size={12} fill={C.accent} weight={600} anchor="end">
        gpu-memory-utilization（既定 0.92）の線 ↑
      </T>

      <T x={24} y={176} size={12} fill={C.fg} weight={600}>
        PagedAttention の論文の例（13B のモデルを A100 40GB で動かした場合）
      </T>
      <rect x={24} y={190} width={752 * 0.65} height={30} rx={4} fill={C.surface2} stroke={C.border} />
      <T x={24 + (752 * 0.65) / 2} y={205} size={12} fill={C.fg} anchor="middle" middle>
        重み 約 65%
      </T>
      <rect x={24 + 752 * 0.65} y={190} width={752 * 0.3} height={30} rx={4} fill={C.accentSoft} stroke={C.accent} />
      <T x={24 + 752 * 0.65 + (752 * 0.3) / 2} y={205} size={12} fill={C.fg} anchor="middle" middle>
        KV キャッシュ 約 30%
      </T>
      <T x={24} y={246} size={12}>
        重みはサービング中ずっと同じだが、KV キャッシュはリクエストごとに伸び縮みする
      </T>
    </svg>
  );
}

/**
 * 学習から推論への受け渡し。どの段で何が生まれ、どこに置かれるかを並べる。
 * 上の段が「もの」、下の段が「置き場所」。
 */
export function HandoverPipeline() {
  const stage = (x: number, n: number, label: string, sub: string, place: string, tone: "plain" | "accent") => (
    <g>
      <Step x={x + 10} y={30} n={n} />
      <Box x={x} y={42} w={170} h={64} label={label} sub={sub} size={13} tone={tone} />
      <T x={x + 85} y={130} size={12} anchor="middle">
        {place}
      </T>
    </g>
  );
  return (
    <svg viewBox="0 0 800 250" role="img" aria-label="学習のチェックポイントが推論サーバーに届くまで">
      {stage(16, 1, "再開用チェックポイント", "重み＋状態（DCP など）", "学習用の共有ストレージ", "plain")}
      {stage(214, 2, "配布用の重み", "safetensors＋インデックス", "変換して書き出す", "accent")}
      {stage(412, 3, "マージ・量子化", "必要なときだけ", "LoRA なら元のモデルも", "plain")}
      {stage(610, 4, "推論サーバー", "vLLM などが読み込む", "モデルの置き場から読む", "accent")}
      <Arrow from={[186, 74]} to={[212, 74]} color={C.subtle} />
      <Arrow from={[384, 74]} to={[410, 74]} color={C.subtle} />
      <Arrow from={[582, 74]} to={[608, 74]} color={C.subtle} />

      <line x1={16} y1={154} x2={784} y2={154} stroke={C.border} strokeWidth={1} />
      <T x={24} y={180} size={12} fill={C.fg} weight={600}>
        ① は学習を続けるためのもので、大きく、オプティマイザの状態を含む
      </T>
      <T x={24} y={202} size={12} fill={C.fg} weight={600}>
        ② 以降は推論のためのもので、重みだけ。② を作った時点で ① は消してよいかを決められる
      </T>
      <T x={24} y={224} size={12}>
        どの段のファイルがどのストレージにあり、誰が消すのかを決めておくと、容量の見積もりが立つ
      </T>
    </svg>
  );
}
