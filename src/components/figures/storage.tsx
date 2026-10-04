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
