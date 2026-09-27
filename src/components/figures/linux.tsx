import { Arrow, Band, Box, Brace, C, Elbow, Step, T } from "./primitives";

/**
 * fd → file 構造体 → inode → データブロック。
 * 「rm しても容量が戻らない」「df と du が食い違う」の根拠になる図なので、
 * 名前 (dentry) が inode とは別物であることを明示している。
 */
export function FdToInode() {
  const fds = [0, 1, 2];
  return (
    <svg viewBox="0 0 800 302" role="img" aria-label="ファイル記述子から inode を経てデータブロックに至る経路">
      <line x1={186} y1={30} x2={186} y2={272} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />
      <T x={24} y={20} size={12} weight={700} fill={C.subtle}>
        プロセスごと
      </T>
      <T x={198} y={20} size={12} weight={700} fill={C.subtle}>
        カーネル（プロセス間で共有される）
      </T>

      {/* fd 表 */}
      <Box x={24} y={34} w={140} h={230} tone="ghost" r={10} />
      <T x={94} y={54} size={13} weight={700} fill={C.fg} anchor="middle">
        fd 表
      </T>
      {fds.map((n, i) => (
        <g key={n}>
          <Box x={42} y={70 + i * 34} w={104} h={26} label={`fd ${n}`} mono size={12} r={6} />
        </g>
      ))}
      <Box x={42} y={196} w={104} h={26} label="fd 3" mono size={12} r={6} tone="accent" />
      <T x={94} y={244} size={12} fill={C.subtle} anchor="middle">
        プロセスごとに独立
      </T>

      {/* file 構造体 */}
      <Box x={222} y={74} w={158} h={62} label="file 構造体" sub="オフセット・フラグ" size={13} />
      <Box x={222} y={182} w={158} h={62} label="file 構造体" sub="オフセット・フラグ" size={13} tone="accent" />

      {/* inode */}
      <Box x={438} y={96} w={150} h={126} r={10} />
      <T x={513} y={120} size={14} weight={700} fill={C.fg} anchor="middle">
        inode
      </T>
      {["サイズ", "権限・所有者", "リンク数 (nlink)", "データブロック位置"].map((s, i) => (
        <T key={s} x={456} y={146 + i * 20} size={12.5} fill={C.muted}>
          {s}
        </T>
      ))}

      {/* データブロック */}
      <Box x={644} y={120} w={132} h={78} label="データ" sub="ディスク上の実体" size={13} />

      {fds.map((n, i) => (
        <Elbow
          key={n}
          points={[
            [146, 83 + i * 34],
            [190, 83 + i * 34],
            [190, 105],
            [218, 105],
          ]}
        />
      ))}
      <Elbow
        points={[
          [146, 209],
          [190, 209],
          [190, 213],
          [218, 213],
        ]}
        color={C.accent}
      />
      <Elbow points={[[380, 105], [410, 105], [410, 134], [434, 134]]} />
      <Elbow points={[[380, 213], [410, 213], [410, 184], [434, 184]]} color={C.accent} />
      <Arrow from={[588, 159]} to={[640, 159]} />

      <T x={301} y={158} size={12} fill={C.subtle} anchor="middle">
        dup / fork で共有される
      </T>
      <T x={400} y={288} size={12.5} fill={C.ng} anchor="middle" weight={600}>
        名前を消しても、開いている限り inode は消えない
      </T>
    </svg>
  );
}

/**
 * デマンドページング。malloc が返った時点では物理メモリがまだ無い、という
 * この図が、RSS と VSZ の差や OOM の起き方を理解する前提になる。
 */
export function DemandPaging() {
  const steps: { text: string; tone: "plain" | "accent" | "ng" }[] = [
    { text: "プロセスが p[0] に書き込む", tone: "plain" },
    { text: "そのアドレスに対応する物理ページが存在しない", tone: "ng" },
    { text: "CPU がページフォルト例外を発生させ、カーネルへ制御が移る", tone: "accent" },
    { text: "カーネルが空き物理ページを 1 枚確保し、ページテーブルに登録", tone: "accent" },
    { text: "書き込み命令をやり直す（プロセスからは何も起きていないように見える）", tone: "plain" },
  ];
  const top = 22;
  const h = 44;
  const gap = 16;
  // カーネルに入る手前だけ余白を広げる。帯のラベルを置く場所を作るため。
  const KERNEL_GAP = 24;
  const yOf = (i: number) => top + i * (h + gap) + (i >= 2 ? KERNEL_GAP : 0);

  return (
    <svg viewBox="0 0 800 358" role="img" aria-label="デマンドページングの流れ">
      <Band x={112} y={yOf(2) - 32} w={548} h={2 * h + gap + 40} label="カーネル空間" />
      {steps.map((s, i) => {
        const y = yOf(i);
        return (
          <g key={s.text}>
            <Step x={86} y={y + h / 2} n={i + 1} tone={s.tone === "plain" ? "ghost" : s.tone} />
            <Box x={128} y={y} w={524} h={h} label={s.text} tone={s.tone} size={13} />
            {i < steps.length - 1 ? (
              <Arrow from={[390, y + h + 2]} to={[390, y + h + gap - 2]} head={6} />
            ) : null}
          </g>
        );
      })}
      <Brace x={670} y1={yOf(2)} y2={yOf(3) + h} label="ここは μ 秒単位" />
      <T x={390} y={348} size={12.5} fill={C.subtle} anchor="middle">
        malloc() が返った時点では ② までしか終わっていない — VSZ は増えるが RSS は増えない
      </T>
    </svg>
  );
}

/**
 * コンテナの正体。
 * 「コンテナ」という実体はカーネルに無く、普通のプロセスに 4 つの仕組みを
 * かけ合わせているだけ、という構図をそのまま図にしている。
 */
export function ContainerParts() {
  const parts: { x: number; y: number; label: string; sub: string; detail: string }[] = [
    { x: 24, y: 24, label: "namespace", sub: "見える範囲を狭める", detail: "PID / NET / MNT / UTS / IPC / USER" },
    { x: 516, y: 24, label: "cgroup v2", sub: "使える量を制限する", detail: "memory.max / cpu.max / io.max" },
    { x: 24, y: 216, label: "pivot_root + overlayfs", sub: "ルートを差し替える", detail: "イメージの層を重ねて 1 つに見せる" },
    { x: 516, y: 216, label: "capabilities / seccomp", sub: "できることを削る", detail: "特権とシステムコールを絞る" },
  ];

  return (
    <svg viewBox="0 0 800 340" role="img" aria-label="コンテナを構成する 4 つのカーネル機能">
      {parts.map((p) => (
        <g key={p.label}>
          <Box x={p.x} y={p.y} w={260} h={86} label={p.label} sub={p.sub} size={13} />
          <T x={p.x + 130} y={p.y + 75} size={12} fill={C.subtle} anchor="middle">
            {p.detail}
          </T>
        </g>
      ))}

      <Box
        x={280}
        y={120}
        w={240}
        h={84}
        label="ただのプロセス"
        sub="execve(&quot;/usr/sbin/nginx&quot;)"
        size={14}
        tone="accent"
        r={12}
      />

      <Arrow from={[204, 114]} to={[286, 128]} color={C.accent} head={6} />
      <Arrow from={[596, 114]} to={[514, 128]} color={C.accent} head={6} />
      <Arrow from={[204, 212]} to={[286, 198]} color={C.accent} head={6} />
      <Arrow from={[596, 212]} to={[514, 198]} color={C.accent} head={6} />

      <T x={400} y={332} size={12.5} fill={C.subtle} anchor="middle">
        カーネルに「コンテナ」という物はない。この 4 つを普通のプロセスにかけ合わせているだけ
      </T>
    </svg>
  );
}

/**
 * システムコール。境界を越える方法が 1 つしかないこと、
 * そして越えた先で必ず引数の検証が入ることを、2 本の矢印として描く。
 */
export function SyscallBoundary() {
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="システムコールによるユーザー空間とカーネル空間の行き来">
      <Band x={16} y={20} w={362} h={290} label="ユーザー空間（Ring 3）" />
      <Band x={422} y={20} w={362} h={290} label="カーネル空間（Ring 0）" />

      <Box x={36} y={52} w={322} h={122} r={10} />
      <T x={197} y={76} size={12.5} weight={700} fill={C.fg} anchor="middle">
        レジスタに引数を並べる
      </T>
      {[
        "rax = 1        write の番号",
        "rdi = 1        fd",
        "rsi = 0x7ffd…  バッファ",
        "rdx = 13       長さ",
      ].map((line, i) => (
        <T key={line} x={56} y={100 + i * 18} size={12} fill={C.muted} mono>
          {line}
        </T>
      ))}
      <Box x={36} y={190} w={322} h={42} label="syscall 命令" size={13} mono tone="accent" />

      <Box x={442} y={52} w={322} h={140} r={10} />
      <T x={603} y={76} size={12.5} weight={700} fill={C.fg} anchor="middle">
        カーネルがすること
      </T>
      {["① 引数を検証する", "② fd からデバイスを解決する", "③ データをコピーする"].map((line, i) => (
        <T key={line} x={462} y={102 + i * 24} size={12.5} fill={C.muted}>
          {line}
        </T>
      ))}

      <Arrow from={[362, 211]} to={[438, 211]} color={C.accent} width={2.5} />
      <T x={400} y={200} size={12} fill={C.accent} weight={600} anchor="middle">
        Ring 0 へ
      </T>
      <Arrow from={[438, 266]} to={[362, 266]} color={C.subtle} width={2} />
      <T x={400} y={256} size={12} fill={C.subtle} anchor="middle">
        Ring 3 へ復帰
      </T>
      <T x={400} y={288} size={12} fill={C.muted} anchor="middle">
        rax = 戻り値
      </T>

      <T x={400} y={324} size={12} fill={C.subtle} anchor="middle">
        境界を越える道はこれ 1 本だけ。だから strace で全部見える
      </T>
    </svg>
  );
}
