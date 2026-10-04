import { Arrow, Band, Box, C, T } from "./primitives";

/**
 * コンテキストウィンドウに入るもの。モデルが一度に参照できるのは、この帯の中だけ。
 * 出力も同じ帯の中に数えられる。
 */
export function ContextWindowContents() {
  const seg = (x: number, w: number, label: string, sub: string, tone: "plain" | "accent" | "ok" | "ghost") => (
    <Box x={x} y={84} w={w} h={66} label={label} sub={sub} size={13} tone={tone} />
  );
  return (
    <svg viewBox="0 0 800 300" role="img" aria-label="コンテキストウィンドウに入るもの">
      <Band x={16} y={40} w={768} h={130} label="コンテキストウィンドウ（1 回の要求で扱えるトークンの上限）" />
      {seg(32, 128, "システム", "役割・決まりごと", "plain")}
      {seg(166, 110, "ツール定義", "使える道具", "plain")}
      {seg(282, 196, "これまでの会話", "質問・応答・ツールの結果", "plain")}
      {seg(484, 132, "今回の質問", "＋ 添付した文書", "accent")}
      {seg(622, 146, "今回の出力", "（思考も含む）", "ok")}

      <Arrow from={[700, 172]} to={[700, 212]} color={C.subtle} />
      <T x={776} y={232} size={12} fill={C.fg} anchor="end">
        次の回では「これまでの会話」に入る
      </T>
      <T x={24} y={212} size={12.5} fill={C.fg}>
        すべてトークンで数えられ、合計には上限がある
      </T>
      <T x={24} y={234} size={12.5} fill={C.fg}>
        学習に使ったデータとは別の「作業用の記憶」
      </T>
      <T x={24} y={272} size={12}>
        長くなるほど精度と想起が落ちることがある（context rot）
      </T>
    </svg>
  );
}

/**
 * API は会話を覚えていない。アプリケーションが毎回、それまでの会話を丸ごと送る。
 */
export function ApiStateless() {
  const turn = (y: number, n: number, items: string[], tokens: string) => (
    <g>
      <T x={24} y={y + 26} size={12.5} fill={C.fg} weight={700}>
        {`${n} 回目`}
      </T>
      {items.map((label, i) => (
        <Box
          key={label + i}
          x={92 + i * 94}
          y={y + 6}
          w={88}
          h={36}
          label={label}
          size={12}
          tone={i === items.length - 1 ? "accent" : "plain"}
        />
      ))}
      <Arrow from={[92 + items.length * 94, y + 24]} to={[648, y + 24]} color={C.subtle} />
      <T x={658} y={y + 28} size={12} fill={C.fg}>
        {tokens}
      </T>
    </g>
  );
  return (
    <svg viewBox="0 0 800 270" role="img" aria-label="API は状態を持たず、毎回それまでの会話を送る">
      <T x={92} y={22} size={12.5} fill={C.fg} weight={700}>
        アプリケーションが送るもの（messages）
      </T>
      <T x={658} y={22} size={12.5} fill={C.fg} weight={700}>
        入力のトークン
      </T>
      {turn(34, 1, ["質問 1"], "少ない")}
      {turn(90, 2, ["質問 1", "応答 1", "質問 2"], "増える")}
      {turn(146, 3, ["質問 1", "応答 1", "質問 2", "応答 2", "質問 3"], "さらに増える")}
      <T x={400} y={240} size={12.5} fill={C.fg} anchor="middle">
        API の側は前の回を覚えていない。会話の履歴を持ち、毎回送り直すのはアプリケーションの仕事
      </T>
    </svg>
  );
}

/**
 * RAG の 2 つの段。前もって文書を検索できる形にしておき、質問が来たら関係する断片だけをプロンプトに足す。
 */
export function RagPipeline() {
  const step = (x: number, y: number, w: number, label: string, sub: string, tone: "plain" | "accent" | "ok" = "plain") => (
    <Box x={x} y={y} w={w} h={56} label={label} sub={sub} size={13} tone={tone} />
  );
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="RAG の前処理と、質問が来たときの流れ">
      <T x={20} y={22} size={12.5} fill={C.fg} weight={700}>
        前処理（文書が増えたとき・変わったとき）
      </T>
      {step(20, 34, 130, "文書", "手順書・チケット")}
      <Arrow from={[152, 62]} to={[178, 62]} color={C.subtle} />
      {step(180, 34, 140, "断片（チャンク）", "数百トークンずつ")}
      <Arrow from={[322, 62]} to={[348, 62]} color={C.subtle} />
      {step(350, 34, 150, "埋め込みモデル", "断片 → ベクトル")}
      <Arrow from={[502, 62]} to={[598, 62]} color={C.subtle} />
      {step(600, 34, 180, "ベクトル DB", "＋ 単語の索引（BM25）", "accent")}

      <T x={20} y={150} size={12.5} fill={C.fg} weight={700}>
        質問が来たとき
      </T>
      {step(20, 162, 130, "質問", "利用者から")}
      <Arrow from={[152, 190]} to={[348, 190]} color={C.subtle} />
      {step(350, 162, 150, "埋め込みモデル", "質問 → ベクトル")}
      <Arrow from={[502, 190]} to={[598, 190]} color={C.subtle} />
      {step(600, 162, 180, "近いものを検索", "上位 K 個の断片", "accent")}
      <Arrow from={[690, 92]} to={[690, 160]} color={C.subtle} dashed />

      <Arrow from={[690, 220]} to={[690, 250]} color={C.ok} width={2} />
      {step(350, 252, 430, "LLM に送る: 質問 ＋ 見つけた断片", "見つけた断片を根拠に答えさせる", "ok")}
    </svg>
  );
}

/**
 * ツール呼び出しの往復。モデルは「呼んでほしい」と返すだけで、実行するのはアプリケーション。
 */
export function ToolUseRoundTrip() {
  const msg = (y: number, from: number, to: number, label: string, color: string = C.subtle) => (
    <g>
      <Arrow from={[from, y]} to={[to, y]} color={color} width={color === C.subtle ? 1.5 : 2} />
      <T x={(from + to) / 2} y={y - 8} size={12} fill={color === C.subtle ? C.fg : color} weight={600} anchor="middle">
        {label}
      </T>
    </g>
  );
  return (
    <svg viewBox="0 0 800 340" role="img" aria-label="ツール呼び出しの往復">
      <Box x={40} y={14} w={180} h={40} label="アプリケーション" size={13.5} />
      <Box x={580} y={14} w={180} h={40} label="モデル（API）" size={13.5} tone="accent" />
      <line x1={130} y1={56} x2={130} y2={320} stroke={C.border} strokeWidth={1.5} strokeDasharray="4 4" />
      <line x1={670} y1={56} x2={670} y2={320} stroke={C.border} strokeWidth={1.5} strokeDasharray="4 4" />

      {msg(90, 132, 668, "① 質問 ＋ 使えるツールの定義（名前・説明・入力の形）")}
      {msg(140, 668, 132, "② tool_use: 「get_weather を location=… で呼んで」", C.accent)}
      <Box x={150} y={164} w={250} h={44} label="③ アプリケーションが実行する" sub="実行するのはこちら側" size={12.5} tone="ok" />
      {msg(240, 132, 668, "④ tool_result: 実行した結果")}
      {msg(290, 668, 132, "⑤ 結果を踏まえた答え", C.ok)}
      <T x={656} y={160} size={12} fill={C.fg} anchor="end">
        （この応答の stop_reason は tool_use）
      </T>
    </svg>
  );
}

/**
 * MCP の参加者。ホストがサーバーごとにクライアントを 1 つ作り、ローカルとリモートのサーバーにつなぐ。
 */
export function McpParticipants() {
  return (
    <svg viewBox="0 0 800 300" role="img" aria-label="MCP のホスト・クライアント・サーバー">
      <Band x={16} y={30} w={360} h={230} label="MCP ホスト（Claude Code、VS Code など）" />
      <Box x={40} y={70} w={150} h={50} label="LLM とのやり取り" size={12.5} tone="ghost" />
      <Box x={210} y={70} w={146} h={50} label="MCP クライアント 1" size={12.5} tone="accent" />
      <Box x={210} y={140} w={146} h={50} label="MCP クライアント 2" size={12.5} tone="accent" />
      <T x={40} y={226} size={12} fill={C.fg}>
        サーバー 1 つにつき、クライアントを 1 つ作る
      </T>

      <Box x={470} y={60} w={300} h={70} label="ローカルの MCP サーバー" sub="stdio（同じマシンのプロセス）" size={13} />
      <Box x={470} y={150} w={300} h={70} label="リモートの MCP サーバー" sub="Streamable HTTP（認証は OAuth を推奨）" size={13} />
      <Arrow from={[358, 95]} to={[468, 95]} color={C.subtle} bidi />
      <Arrow from={[358, 165]} to={[468, 185]} color={C.subtle} bidi />
      <T x={620} y={250} size={12} fill={C.fg} anchor="middle">
        サーバーが出すもの: ツール・リソース・プロンプト
      </T>
    </svg>
  );
}

/**
 * エージェントの正体はループ。毎回、環境からの結果（ground truth）を見て次を決める。
 */
export function AgentLoop() {
  return (
    <svg viewBox="0 0 800 320" role="img" aria-label="エージェントのループ">
      <Box x={24} y={124} w={150} h={60} label="人の依頼" sub="目標と完了の条件" size={13.5} />
      <Arrow from={[176, 154]} to={[236, 154]} color={C.subtle} />

      <Box x={240} y={40} w={180} h={60} label="① 考える" sub="次に何をするか" size={13.5} tone="accent" />
      <Box x={520} y={40} w={200} h={60} label="② ツールを使う" sub="コマンド・API・検索" size={13.5} />
      <Box x={520} y={206} w={200} h={60} label="③ 結果を見る" sub="出力・エラー・テスト" size={13.5} tone="ok" />
      <Box x={240} y={206} w={180} h={60} label="④ 進んだか判断" sub="完了／続ける／人に聞く" size={13.5} />

      <Arrow from={[422, 70]} to={[518, 70]} color={C.accent} width={2} />
      <Arrow from={[620, 102]} to={[620, 204]} color={C.accent} width={2} />
      <Arrow from={[518, 236]} to={[422, 236]} color={C.accent} width={2} />
      <Arrow from={[330, 204]} to={[330, 102]} color={C.accent} width={2} />
      <T x={342} y={158} size={12} fill={C.fg}>
        繰り返す
      </T>

      <Arrow from={[240, 250]} to={[176, 250]} color={C.subtle} dashed />
      <T x={30} y={240} size={12} fill={C.fg}>
        判断に迷えば人に戻す
      </T>
      <T x={400} y={300} size={12.5} fill={C.fg} anchor="middle">
        自律的に動くぶん費用が高く、誤りが積み重なりうる。だからサンドボックスでの試験と防護柵が要る
      </T>
    </svg>
  );
}

/**
 * 間接的なプロンプトインジェクション。命令は利用者からではなく、エージェントが読む外部の内容から来る。
 * 被害の大きさは、そのあとに続くツールの権限で決まる。
 */
export function IndirectInjection() {
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="間接的なプロンプトインジェクションの流れと、止める場所">
      <Box x={20} y={30} w={170} h={64} label="攻撃者" sub="Web・文書・チケットに書き込む" size={13} tone="ng" />
      <Arrow from={[192, 62]} to={[248, 62]} color={C.ng} />
      <Box x={250} y={30} w={180} h={64} label="外部の内容" sub="「…を外部に送れ」と紛れ込む" size={13} />
      <Arrow from={[432, 62]} to={[488, 62]} color={C.subtle} />
      <Box x={490} y={30} w={140} h={64} label="エージェント" sub="ツールで読み込む" size={13} tone="accent" />
      <Arrow from={[632, 62]} to={[688, 62]} color={C.ng} />
      <Box x={690} y={30} w={94} h={64} label="操作" sub="送信・削除" size={13} tone="ng" />

      <Box x={20} y={150} w={250} h={34} label="利用者は善意。依頼は「要約して」だけ" size={12} tone="ghost" />
      <Arrow from={[145, 148]} to={[540, 96]} color={C.subtle} dashed />

      <T x={24} y={226} size={12.5} fill={C.fg} weight={700}>
        被害を小さくする場所
      </T>
      <Box x={250} y={208} w={180} h={50} label="データとして渡す" sub="tool_result・出所を明示" size={12.5} tone="ok" />
      <Box x={490} y={208} w={140} h={50} label="最小の権限" sub="使える道具を絞る" size={12.5} tone="ok" />
      <Box x={650} y={208} w={134} h={50} label="人の承認" sub="影響の大きい操作" size={12.5} tone="ok" />
      <T x={400} y={300} size={12} anchor="middle">
        完全に防ぐ方法があるかは分からない（OWASP）。被害を小さくする層を重ねる
      </T>
    </svg>
  );
}
