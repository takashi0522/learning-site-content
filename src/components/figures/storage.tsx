import { Arrow, Band, Box, C, T } from "./primitives";

/**
 * NFS クライアントがカーネルの中に持つ 3 種類のキャッシュ。
 * 主題は「キャッシュに当たればサーバーに聞かずに返す」ことと、キャッシュごとに保持の条件が違うこと。
 */
export function NfsClientCaches() {
  const cache = (x: number, label: string, sub: string, note: string) => (
    <g>
      <Box x={x} y={140} w={144} h={66} label={label} sub={sub} size={13} />
      <T x={x + 72} y={232} size={12} fill={C.fg} anchor="middle">
        {note}
      </T>
    </g>
  );

  return (
    <svg viewBox="0 0 800 320" role="img" aria-label="NFS クライアントが持つ 3 種類のキャッシュ">
      <Box x={150} y={22} w={230} h={50} label="アプリケーション" sub="open / read / write / stat" size={13.5} />
      <Arrow from={[265, 74]} to={[265, 112]} color={C.subtle} bidi />

      <Band x={24} y={104} w={504} h={160} label="NFS クライアント（カーネル）" />
      {cache(40, "データ", "ページキャッシュ", "close・fsync で書き戻す")}
      {cache(200, "属性", "サイズ・mtime など", "既定で 3〜60 秒保持")}
      {cache(360, "ディレクトリエントリ", "名前 → ファイル", "親の属性が切れるまで")}

      <Box x={606} y={130} w={170} h={86} label="NFS サーバー" sub="エクスポートしたディスク" size={13.5} tone="accent" />
      <Arrow from={[530, 173]} to={[604, 173]} color={C.accent} width={2} bidi />
      <T x={567} y={146} size={12} fill={C.accent} weight={600} anchor="middle">
        RPC
      </T>
      <T x={567} y={200} size={12} anchor="middle">
        GETATTR
      </T>
      <T x={567} y={216} size={12} anchor="middle">
        READ / WRITE
      </T>

      <T x={400} y={296} size={12.5} fill={C.fg} anchor="middle">
        キャッシュに当たれば、サーバーに問い合わせずに返す。外れたときと期限が切れたときだけ RPC が飛ぶ
      </T>
    </svg>
  );
}

/**
 * close-to-open。A が close したあとに B が open すれば新しい中身が見える。
 * 開いたままの B には、その保証が無い。
 */
export function NfsCloseToOpen() {
  const lanes = [
    { x: 130, label: "クライアント A" },
    { x: 400, label: "NFS サーバー" },
    { x: 670, label: "クライアント B" },
  ];
  const msg = (y: number, from: number, to: number, label: string, color: string = C.subtle) => (
    <g>
      <Arrow from={[from, y]} to={[to, y]} color={color} width={color === C.subtle ? 1.5 : 2} />
      <T x={(from + to) / 2} y={y - 8} size={12} fill={color === C.subtle ? C.muted : color} weight={600} anchor="middle">
        {label}
      </T>
    </g>
  );

  return (
    <svg viewBox="0 0 800 370" role="img" aria-label="close-to-open の整合性">
      {lanes.map((l) => (
        <g key={l.label}>
          <Box x={l.x - 74} y={14} w={148} h={36} label={l.label} size={13} tone={l.x === 400 ? "accent" : "plain"} />
          <line x1={l.x} y1={52} x2={l.x} y2={350} stroke={C.border} strokeWidth={1.5} strokeDasharray="4 4" />
        </g>
      ))}

      {msg(84, 130, 398, "open: 属性を確認（GETATTR）")}
      <T x={142} y={124} size={12} fill={C.fg}>
        write はいったん手元に溜まる
      </T>
      {msg(164, 130, 398, "close: 書き戻す（WRITE）", C.accent)}

      {msg(214, 670, 402, "open: 必ず属性を確認", C.accent)}
      {msg(254, 402, 670, "READ: 新しい中身", C.ok)}

      <T x={658} y={300} size={12} fill={C.ng} weight={600} anchor="end">
        A が書く前から開いたままの B は、
      </T>
      <T x={658} y={318} size={12} fill={C.ng} weight={600} anchor="end">
        キャッシュの古い中身を読むことがある
      </T>
      <T x={142} y={300} size={12} fill={C.fg}>
        保証されるのは
      </T>
      <T x={142} y={318} size={12} fill={C.fg}>
        「A の close → B の open」の順のときだけ
      </T>
    </svg>
  );
}

/**
 * Lustre の 1 つのファイルの正体。MDT のオブジェクトが FID とレイアウトを持ち、
 * 中身は OST のオブジェクトに RAID 0 で分かれている。クライアントはレイアウトを聞いてから OST と直接話す。
 */
export function LustreFileLayout() {
  return (
    <svg viewBox="0 0 800 340" role="img" aria-label="Lustre のファイルは MDT のオブジェクトと OST のオブジェクトでできている">
      <Box x={24} y={130} w={140} h={70} label="クライアント" sub="MDC / OSC" size={13.5} />

      <Box x={250} y={24} w={250} h={92} tone="accent" />
      <T x={375} y={48} size={13.5} fill={C.fg} weight={700} anchor="middle">
        MDT のオブジェクト
      </T>
      <T x={375} y={72} size={12} fill={C.fg} anchor="middle" mono>
        FID（128 ビット）
      </T>
      <T x={375} y={94} size={12} fill={C.fg} anchor="middle" mono>
        layout EA: OST 0, 1, 2 / 1MB ずつ
      </T>

      <Arrow from={[166, 150]} to={[248, 92]} color={C.accent} dashed />
      <T x={200} y={104} size={12} fill={C.accent} weight={600} anchor="middle">
        ① レイアウト
      </T>

      {[0, 1, 2].map((i) => (
        <g key={i}>
          <Box x={250 + i * 180} y={226} w={150} h={64} label={`OST ${i}`} sub={`オブジェクト（${["0, 3, 6", "1, 4, 7", "2, 5, 8"][i]}…）`} size={13} />
          <Arrow from={[166, 182]} to={[300 + i * 180, 224]} color={C.ok} width={2} />
        </g>
      ))}
      <T x={234} y={214} size={12} fill={C.ok} weight={600} anchor="end">
        ② 直接読み書き
      </T>

      <T x={400} y={318} size={12.5} fill={C.fg} anchor="middle">
        中身は 1MB ずつ順番に OST へ配られる（RAID 0）。数字はファイルの中の何番目の 1MB か
      </T>
    </svg>
  );
}

/**
 * PFL と DoM。1 つのファイルの前のほうと後ろのほうで、置き場所と分け方を変える。
 */
export function PflComponents() {
  const seg = (x: number, w: number, label: string, sub: string, tone: "accent" | "plain" | "ok") => (
    <Box x={x} y={92} w={w} h={64} label={label} sub={sub} size={13} tone={tone} />
  );
  return (
    <svg viewBox="0 0 800 280" role="img" aria-label="PFL のコンポーネント。ファイルの範囲ごとにレイアウトを変える">
      <T x={24} y={40} size={13} fill={C.fg} weight={700}>
        lfs setstripe -E 1M -L mdt -E 1G -c1 -E eof -c4 dir/
      </T>
      <T x={24} y={78} size={12}>
        ファイルの先頭
      </T>
      <T x={776} y={78} size={12} anchor="end">
        ファイルの終わり（eof）
      </T>
      {seg(24, 150, "0〜1MB", "MDT に置く（DoM）", "accent")}
      {seg(180, 230, "1MB〜1GB", "OST 1 台", "plain")}
      {seg(416, 360, "1GB〜", "OST 4 台に分ける", "ok")}

      <T x={99} y={188} size={12} fill={C.fg} anchor="middle">
        小さいファイルは
      </T>
      <T x={99} y={206} size={12} fill={C.fg} anchor="middle">
        ここだけで終わる
      </T>
      <T x={295} y={188} size={12} fill={C.fg} anchor="middle">
        中くらいまでは 1 台で
      </T>
      <T x={596} y={188} size={12} fill={C.fg} anchor="middle">
        大きくなった分だけ並列に
      </T>
      <T x={400} y={252} size={12.5} anchor="middle">
        DoM では、MDT の範囲を超えて書かれるまで OST 側は作られない
      </T>
    </svg>
  );
}

/**
 * ファイルとオブジェクトの違い。木構造と途中からの読み書き vs 平らなキーと丸ごとの PUT / GET。
 */
export function FileVsObject() {
  const line = (x: number, y: number, text: string, mono = true) => (
    <T x={x} y={y} size={12.5} fill={C.fg} mono={mono}>
      {text}
    </T>
  );
  return (
    <svg viewBox="0 0 800 340" role="img" aria-label="ファイルシステムとオブジェクトストレージの違い">
      <Band x={16} y={20} w={372} h={250} label="ファイルシステム" />
      <Band x={412} y={20} w={372} h={250} label="オブジェクトストレージ" align="right" />

      {line(40, 70, "/data/")}
      {line(64, 96, "├─ train/")}
      {line(88, 122, "│  ├─ shard-0001.tar")}
      {line(88, 148, "│  └─ shard-0002.tar")}
      {line(64, 174, "└─ ckpt/step-1000/")}
      <T x={40} y={212} size={12} fill={C.fg}>
        ディレクトリそのものが、ファイルシステムの中にある
      </T>
      <T x={40} y={234} size={12} fill={C.fg}>
        open → seek → 途中を read / write
      </T>

      <Box x={436} y={52} w={324} h={36} label="バケット: data" size={12.5} tone="accent" />
      {line(448, 114, "train/shard-0001.tar")}
      {line(448, 140, "train/shard-0002.tar")}
      {line(448, 166, "ckpt/step-1000/model.safetensors")}
      <T x={436} y={212} size={12} fill={C.fg}>
        キーは平らな文字列。/ は区切りの約束にすぎない
      </T>
      <T x={436} y={234} size={12} fill={C.fg}>
        HTTP で PUT（丸ごと）/ GET / LIST / DELETE
      </T>

      <T x={202} y={300} size={12.5} fill={C.fg} anchor="middle">
        POSIX のファイル操作
      </T>
      <T x={598} y={300} size={12.5} fill={C.fg} anchor="middle">
        キー単位の API（S3 など）
      </T>
    </svg>
  );
}

/**
 * 「速い」の 3 つの意味。測る道具と、AI 基盤でどの負荷に当たるかを並べる。
 */
export function StoragePerfAxes() {
  const col = (x: number, title: string, unit: string, tool: string, l1: string, l2: string, tone: "accent" | "plain" | "ok") => (
    <g>
      <Box x={x} y={30} w={236} h={70} label={title} sub={unit} size={14} tone={tone} />
      <T x={x + 118} y={132} size={12} anchor="middle">
        主に測る道具
      </T>
      <Box x={x + 38} y={142} w={160} h={36} label={tool} size={13} mono />
      <T x={x + 118} y={214} size={12} anchor="middle">
        AI 基盤で効く場面
      </T>
      <T x={x + 118} y={238} size={12.5} fill={C.fg} anchor="middle">
        {l1}
      </T>
      <T x={x + 118} y={258} size={12.5} fill={C.fg} anchor="middle">
        {l2}
      </T>
    </g>
  );
  return (
    <svg viewBox="0 0 800 300" role="img" aria-label="ストレージの速さの 3 つの意味と測る道具">
      {col(18, "帯域", "MB/s・GB/s", "IOR / fio", "大きなファイルの読み込み", "チェックポイントの保存", "accent")}
      {col(282, "IOPS", "回/秒（小さい I/O）", "fio", "小さなランダム読み", "データベース的な負荷", "plain")}
      {col(546, "メタデータ", "作成・stat・削除/秒", "mdtest", "小さいファイルが大量", "ディレクトリの走査", "ok")}
    </svg>
  );
}

/**
 * Ceph の層。3 つの使い方（ブロック・ファイル・オブジェクト）が、同じ RADOS の上に乗っている。
 */
export function CephLayers() {
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="Ceph の層。RBD・CephFS・RGW が RADOS の上に乗る">
      <Box x={40} y={24} w={210} h={58} label="RBD" sub="ブロック（VM のディスクなど）" size={14} />
      <Box x={295} y={24} w={210} h={58} label="CephFS" sub="ファイル（POSIX）" size={14} />
      <Box x={550} y={24} w={210} h={58} label="RGW" sub="オブジェクト（S3 互換）" size={14} />
      <Box x={295} y={104} w={210} h={34} label="MDS（メタデータ）" size={12.5} tone="ghost" />
      {[145, 400, 655].map((x) => (
        <Arrow key={x} from={[x, x === 400 ? 140 : 84]} to={[x, 164]} color={C.subtle} />
      ))}
      <Box x={40} y={166} w={720} h={36} label="librados（RADOS を直接使う口）" size={13} />
      <Band x={24} y={218} w={752} h={92} label="RADOS — 分散オブジェクトストア" />
      <Box x={44} y={250} w={150} h={44} label="MON × 3〜" sub="クラスタの地図" size={12.5} tone="accent" />
      <Box x={206} y={250} w={130} h={44} label="MGR × 2〜" sub="指標・管理" size={12.5} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} x={350 + i * 82} y={250} w={74} h={44} label="OSD" sub="データを置く" size={12.5} tone="ok" />
      ))}
    </svg>
  );
}

/**
 * CRUSH による置き場所の計算。表を引かずに、名前から計算で OSD まで決まる。
 */
export function CephPlacement() {
  return (
    <svg viewBox="0 0 800 300" role="img" aria-label="オブジェクト名から PG、PG から OSD を計算で決める">
      <Box x={20} y={40} w={150} h={64} label="オブジェクト" sub="プール + 名前" size={13.5} />
      <Arrow from={[172, 72]} to={[246, 72]} color={C.accent} width={2} />
      <T x={209} y={48} size={12} fill={C.accent} weight={600} anchor="middle">
        ハッシュ
      </T>
      <T x={209} y={64} size={12} anchor="middle">
        mod PG 数
      </T>
      <Box x={248} y={40} w={150} h={64} label="PG 4.58" sub="プール 4 の 58 番" size={13.5} tone="accent" mono />
      <Arrow from={[400, 72]} to={[474, 72]} color={C.accent} width={2} />
      <T x={437} y={48} size={12} fill={C.accent} weight={600} anchor="middle">
        CRUSH
      </T>
      <T x={437} y={64} size={12} anchor="middle">
        地図から計算
      </T>
      <Box x={476} y={16} w={170} h={48} label="OSD 25" sub="プライマリ（書き込み口）" size={13} tone="ok" />
      <Box x={476} y={92} w={150} h={34} label="OSD 32" size={12.5} />
      <Box x={476} y={150} w={150} h={34} label="OSD 61" size={12.5} />
      <Arrow from={[530, 66]} to={[530, 90]} color={C.ok} />
      <Arrow from={[600, 66]} to={[600, 148]} color={C.ok} />
      <T x={656} y={112} size={12} fill={C.fg}>
        ② プライマリが複製
      </T>
      <T x={656} y={132} size={12} fill={C.fg}>
        ③ 揃ったら応答
      </T>

      <Box x={250} y={200} w={140} h={46} label="クライアント" size={13.5} />
      <Arrow from={[372, 198]} to={[492, 66]} color={C.ok} width={2} />
      <T x={250} y={186} size={12} fill={C.ok} weight={600}>
        ① プライマリに書く
      </T>
      <T x={400} y={278} size={12.5} fill={C.fg} anchor="middle">
        場所を問い合わせる中央の表は無い。地図（cluster map）さえあれば、誰でも同じ答えを計算できる
      </T>
    </svg>
  );
}

/**
 * 何から守るかで、手段が違う。冗長はディスクの故障から守るが、消す操作はそのまま全コピーに届く。
 */
export function ProtectionLayers() {
  const row = (y: number, threat: string, measure: string, sub: string, tone: "accent" | "plain" | "ok" | "ng") => (
    <g>
      <Box x={24} y={y} w={230} h={50} label={threat} size={13.5} tone={tone === "ng" ? "ng" : "plain"} />
      <Arrow from={[256, y + 25]} to={[322, y + 25]} color={C.subtle} />
      <Box x={324} y={y} w={452} h={50} label={measure} sub={sub} size={13.5} tone={tone === "ng" ? "plain" : tone} />
    </g>
  );
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="脅威ごとに、守る手段が違う">
      <T x={139} y={22} size={12.5} fill={C.fg} weight={700} anchor="middle">
        何が起きるか
      </T>
      <T x={550} y={22} size={12.5} fill={C.fg} weight={700} anchor="middle">
        守る手段（このレッスンで見るもの）
      </T>
      {row(36, "ディスク・サーバーの故障", "レプリケーション・イレイジャーコーディング", "レッスン 5。消す操作はすべてのコピーに届く", "plain")}
      {row(104, "誤った削除・上書き", "スナップショット・バージョニング", "過去の時点に戻れる", "accent")}
      {row(172, "管理者を含む誰かの削除", "WORM（S3 Object Lock の compliance など）", "期間中は root を含む利用者が消せない", "ok")}
      {row(240, "使いすぎ・混在", "クォータ・ID の対応づけ", "チームごとに上限と見え方を分ける", "plain")}
      <T x={400} y={316} size={12} anchor="middle">
        対応関係はこのコースの整理。各手段の性質は、本文で出典とともに見る
      </T>
    </svg>
  );
}
