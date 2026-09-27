import { Arrow, Box, C, Elbow, T } from "./primitives";

const LANES = [
  { x: 92, label: "ユーザー", sub: "ブラウザ" },
  { x: 400, label: "クライアント", sub: "アプリ" },
  { x: 708, label: "IdP", sub: "Authorization Server" },
];

type Msg = { y: number; from: number; to: number; text: string; tone: string; note?: string };

const MSGS: Msg[] = [
  { y: 92, from: 0, to: 1, text: "① ログインボタンを押す", tone: C.subtle },
  {
    y: 138,
    from: 1,
    to: 2,
    text: "② code_challenge（verifier のハッシュ）を付けてリダイレクト",
    tone: C.accent,
    note: "code_verifier を生成し、手元に保持",
  },
  { y: 190, from: 0, to: 2, text: "③ IdP で認証（パスワード・MFA）", tone: C.subtle },
  { y: 236, from: 2, to: 1, text: "④ 認可コードを付けてリダイレクト（フロントチャネル）", tone: C.ng },
  { y: 282, from: 1, to: 2, text: "⑤ 認可コード + code_verifier（バックチャネル）", tone: C.accent },
  { y: 328, from: 2, to: 1, text: "⑥ ハッシュを照合し、一致すればトークンを発行", tone: C.ok },
];

/**
 * Authorization Code + PKCE。
 * ④ がフロントチャネル（盗まれうる）で ⑤ がバックチャネルである、という
 * 経路の違いが PKCE の存在理由なので、そこを色で分けている。
 */
export function OidcCodePkce() {
  return (
    <svg viewBox="0 0 800 380" role="img" aria-label="Authorization Code + PKCE のフロー">
      {LANES.map((l) => (
        <g key={l.label}>
          <Box x={l.x - 86} y={8} w={172} h={44} label={l.label} sub={l.sub} size={13} />
          <line
            x1={l.x}
            y1={54}
            x2={l.x}
            y2={352}
            stroke={C.border}
            strokeWidth={1.2}
            strokeDasharray="4 6"
          />
        </g>
      ))}

      {MSGS.map((m) => {
        const x1 = LANES[m.from].x;
        const x2 = LANES[m.to].x;
        const dir = x2 > x1 ? 1 : -1;
        return (
          <g key={m.text}>
            <T
              x={x1 + dir * 8}
              y={m.y - 10}
              size={12.5}
              fill={m.tone}
              weight={600}
              anchor={dir > 0 ? "start" : "end"}
            >
              {m.text}
            </T>
            <Arrow from={[x1 + dir * 4, m.y]} to={[x2 - dir * 4, m.y]} color={m.tone} width={1.8} />
            {m.note ? (
              <T x={x1 + dir * 8} y={m.y + 15} size={11.5} fill={C.subtle}>
                {m.note}
              </T>
            ) : null}
          </g>
        );
      })}

      <T x={400} y={372} size={12.5} fill={C.subtle} anchor="middle">
        ④ の認可コードを盗まれても、code_verifier を知らなければ ⑥ の照合で弾かれる
      </T>
    </svg>
  );
}

const LEAVES = [
  { label: "サーバー証明書", sub: "api.internal" },
  { label: "クライアント証明書", sub: "mTLS 用" },
  { label: "機器証明書", sub: "BMC / NW 機器" },
];

/**
 * CA の階層。
 * ルートを分ける理由は運用の綺麗さではなく「漏洩したときに復旧できるかどうか」なので、
 * 各段の右に、そこが漏れたときに何が起きるかを添えている。
 */
export function CaHierarchy() {
  return (
    <svg viewBox="0 0 800 340" role="img" aria-label="ルート CA と中間 CA の階層">
      <Box x={130} y={24} w={320} h={68} label="ルート CA" sub="オフライン保管・HSM / 金庫・有効期限 10〜20 年" size={14} />
      <T x={470} y={48} size={12} weight={600} fill={C.ng}>
        ここが漏れたら
      </T>
      <T x={470} y={68} size={12} fill={C.muted}>
        全クライアントのトラストストアを入れ替える
      </T>
      <T x={470} y={86} size={12} fill={C.muted}>
        （その間、何も信頼できない）
      </T>

      <Arrow from={[290, 96]} to={[290, 130]} color={C.accent} width={2} />
      <T x={302} y={118} size={12} fill={C.accent} weight={600}>
        署名
      </T>

      <Box x={130} y={134} w={320} h={68} label="中間 CA" sub="オンライン・実際の発行はここ・3〜5 年" size={14} tone="accent" />
      <T x={470} y={158} size={12} weight={600} fill={C.ok}>
        ここが漏れたら
      </T>
      <T x={470} y={178} size={12} fill={C.muted}>
        その中間 CA を失効させ、作り直して再発行するだけで済む
      </T>

      <Arrow from={[290, 206]} to={[290, 240]} color={C.accent} width={2} />

      {LEAVES.map((l, i) => (
        <Box
          key={l.label}
          x={40 + i * 246}
          y={244}
          w={228}
          h={62}
          label={l.label}
          sub={l.sub}
          size={12.5}
        />
      ))}
      <Elbow points={[[290, 228], [154, 228], [154, 240]]} color={C.subtle} head={6} />
      <Elbow points={[[290, 228], [532, 228], [532, 240]]} color={C.subtle} head={6} />

      <T x={400} y={330} size={12} fill={C.subtle} anchor="middle">
        末端は 90 日〜1 年。短いほど失効の仕組みに頼らずに済む
      </T>
    </svg>
  );
}
