import { Arrow, Band, Box, C, Elbow, T } from "./primitives";

/**
 * select/poll と epoll の違い。
 * 「毎回全部を渡して全部を調べる」か「登録済みのものから準備できた分だけ受け取る」か、
 * という往復の形の差が O(n) と O(1) の正体なので、そこを並べている。
 */
export function EpollVsPoll() {
  const cells = Array.from({ length: 18 }, (_, i) => i);
  const ready = new Set([4, 11]);

  return (
    <svg viewBox="0 0 800 336" role="img" aria-label="select/poll と epoll の比較">
      <line x1={400} y1={14} x2={400} y2={322} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />

      <T x={24} y={22} size={13} weight={700} fill={C.ng}>
        select / poll
      </T>
      <Box x={24} y={34} w={340} h={40} label="アプリケーション" size={13} />
      <Band x={24} y={104} w={340} h={158} label="カーネル" />
      {cells.map((i) => (
        <rect
          key={i}
          x={40 + (i % 6) * 54}
          y={140 + Math.floor(i / 6) * 38}
          width={44}
          height={28}
          rx={5}
          fill={ready.has(i) ? C.accentSoft : C.surface2}
          stroke={ready.has(i) ? C.accent : C.border}
          strokeWidth={1.4}
        />
      ))}
      <Arrow from={[150, 78]} to={[150, 132]} color={C.ng} />
      <T x={158} y={98} size={12} fill={C.ng} weight={600}>
        監視したい fd を毎回すべて渡す
      </T>
      <Arrow from={[300, 132]} to={[300, 78]} color={C.subtle} />
      <T x={24} y={284} size={12} weight={600} fill={C.ng}>
        呼ぶたびに全件を走査する
      </T>
      <T x={24} y={304} size={12} fill={C.muted}>
        コストは監視数に比例する O(n)
      </T>

      <T x={436} y={22} size={13} weight={700} fill={C.ok}>
        epoll
      </T>
      <Box x={436} y={34} w={340} h={40} label="アプリケーション" size={13} />
      <Band x={436} y={104} w={340} h={158} label="カーネル" />
      <Box x={452} y={132} w={190} h={112} label="監視リスト" sub="登録は最初の 1 回だけ" size={12.5} tone="ghost" dashed />
      <Box x={660} y={152} w={100} h={72} label="ready" sub="2 件" size={12.5} tone="accent" />
      <Elbow points={[[642, 188], [656, 188]]} color={C.accent} head={6} />
      <Arrow from={[520, 78]} to={[520, 128]} color={C.subtle} />
      <T x={528} y={100} size={12} fill={C.subtle}>
        epoll_ctl（登録）
      </T>
      <Arrow from={[710, 148]} to={[710, 78]} color={C.ok} width={2} />
      <T x={724} y={96} size={12} fill={C.ok} weight={600}>
        epoll_wait
      </T>
      <T x={436} y={284} size={12} weight={600} fill={C.ok}>
        準備できた分だけが返る
      </T>
      <T x={436} y={304} size={12} fill={C.muted}>
        コストは準備できた数に比例する O(1)
      </T>

      <T x={400} y={330} size={12} fill={C.subtle} anchor="middle">
        C10K が現実になったのは、この往復の形が変わったから
      </T>
    </svg>
  );
}

/**
 * WAL とチェックポイント。
 * コミットが速いのは「順次書き込みの WAL しか同期しないから」で、
 * 重いランダム書き込みは後ろのチェックポイントにまとめて逃がしている、という分担を描く。
 */
export function WalCheckpoint() {
  return (
    <svg viewBox="0 0 800 342" role="img" aria-label="WAL とチェックポイントの書き込み経路">
      <Box x={24} y={40} w={176} h={56} label="UPDATE / INSERT" size={12.5} />
      <Arrow from={[204, 68]} to={[244, 68]} />
      <Box x={248} y={40} w={196} h={56} label="WAL に追記" sub="順次書き込み・速い" size={13} tone="accent" />
      <Arrow from={[448, 68]} to={[488, 68]} color={C.accent} />
      <Box x={492} y={40} w={180} h={56} label="WAL セグメント" sub="ディスク" size={12.5} />
      <T x={582} y={114} size={12} weight={600} fill={C.accent} anchor="middle">
        コミットで fsync するのはここだけ
      </T>

      <Elbow points={[[112, 100], [112, 150], [180, 150]]} color={C.subtle} />
      <Box x={184} y={126} w={392} h={56} label="共有バッファ上のページを変更（ダーティ化）" size={12.5} />
      <T x={596} y={154} size={12} fill={C.muted} middle>
        まだディスクには出ていない
      </T>

      <Arrow from={[380, 186]} to={[380, 238]} color={C.ng} width={2} />
      <T x={394} y={208} size={12.5} weight={600} fill={C.ng}>
        チェックポイント
      </T>
      <T x={394} y={226} size={12} fill={C.muted}>
        ランダム書き込み・重い。まとめて実行される
      </T>
      <Box x={184} y={242} w={392} h={56} label="データファイル" sub="テーブル・インデックスの実体" size={13} />

      <T x={400} y={330} size={12} fill={C.subtle} anchor="middle">
        クラッシュ後は「最後のチェックポイント + それ以降の WAL」で復元する — だから WAL は消してはいけない
      </T>
    </svg>
  );
}

const PARTITIONS = [
  { name: "Partition 0", cells: 6 },
  { name: "Partition 1", cells: 4 },
  { name: "Partition 2", cells: 5 },
];

/**
 * Kafka のパーティションとコンシューマグループ。
 * パーティション数が並列度の上限であることを、
 * 割り当てのないコンシューマ D を描くことで見せている。
 */
export function KafkaPartitions() {
  return (
    <svg viewBox="0 0 800 330" role="img" aria-label="Kafka のパーティションとコンシューマグループの対応">
      <T x={24} y={24} size={13} weight={700} fill={C.fg}>
        Topic: orders
      </T>

      {PARTITIONS.map((p, row) => {
        const y = 44 + row * 62;
        return (
          <g key={p.name}>
            <T x={24} y={y + 22} size={12} fill={C.muted} mono middle>
              {p.name}
            </T>
            {Array.from({ length: p.cells }, (_, i) => (
              <g key={i}>
                <rect
                  x={120 + i * 44}
                  y={y}
                  width={38}
                  height={44}
                  rx={5}
                  fill={C.surface2}
                  stroke={C.border}
                  strokeWidth={1.4}
                />
                <T x={139 + i * 44} y={y + 22} size={12} fill={C.fg} anchor="middle" middle mono>
                  {i}
                </T>
              </g>
            ))}
            <T x={124 + p.cells * 44} y={y + 22} size={12} fill={C.subtle} middle>
              追記
            </T>
            <Elbow
              points={[
                [190 + p.cells * 44, y + 22],
                [520, y + 22],
                [520, 60 + row * 62],
                [556, 60 + row * 62],
              ]}
              color={C.accent}
              head={6}
            />
          </g>
        );
      })}

      <T x={560} y={24} size={12.5} weight={700} fill={C.accent}>
        Consumer Group: order-processor
      </T>
      {["Consumer A", "Consumer B", "Consumer C"].map((name, i) => (
        <Box key={name} x={560} y={38 + i * 62} w={216} h={44} label={name} size={12.5} tone="accent" />
      ))}
      <Box x={560} y={224} w={216} h={44} label="Consumer D" sub="割り当てなし・遊ぶ" size={12.5} tone="ghost" dashed />

      <T x={400} y={300} size={12.5} weight={600} fill={C.fg} anchor="middle">
        パーティション数が、そのグループで出せる並列度の上限
      </T>
      <T x={400} y={320} size={12} fill={C.subtle} anchor="middle">
        コンシューマを増やしても、パーティションより多い分は何もしない
      </T>
    </svg>
  );
}

/**
 * リバースプロキシのバッファリング。
 * 「遅いクライアントが上流のワーカーを何秒占有するか」という一点に絞っている。
 */
export function ProxyBuffering() {
  return (
    <svg viewBox="0 0 800 300" role="img" aria-label="バッファリングの有無による上流ワーカーの占有時間の違い">
      <T x={24} y={22} size={12.5} weight={700} fill={C.ok}>
        バッファリング ON（既定）
      </T>
      <Box x={24} y={34} w={170} h={52} label="上流サーバー" size={12.5} />
      <Box x={310} y={34} w={180} h={52} label="nginx" sub="応答を保持する" size={12.5} tone="ok" />
      <Box x={606} y={34} w={170} h={52} label="遅いクライアント" size={12.5} />
      <Arrow from={[198, 60]} to={[306, 60]} color={C.ok} width={2.5} />
      <T x={252} y={48} size={12} fill={C.ok} anchor="middle" weight={600}>
        速い
      </T>
      <Arrow from={[494, 60]} to={[602, 60]} color={C.subtle} dashed />
      <T x={548} y={48} size={12} fill={C.subtle} anchor="middle">
        遅い
      </T>
      <T x={109} y={104} size={12} weight={600} fill={C.ok} anchor="middle">
        すぐ解放される
      </T>

      <line x1={24} y1={134} x2={776} y2={134} stroke={C.border} strokeWidth={1} strokeDasharray="4 5" />

      <T x={24} y={164} size={12.5} weight={700} fill={C.ng}>
        バッファリング OFF（proxy_buffering off）
      </T>
      <Box x={24} y={176} w={170} h={52} label="上流サーバー" size={12.5} tone="ng" />
      <Box x={310} y={176} w={180} h={52} label="nginx" sub="素通しする" size={12.5} tone="ghost" dashed />
      <Box x={606} y={176} w={170} h={52} label="遅いクライアント" size={12.5} />
      <Arrow from={[198, 202]} to={[602, 202]} color={C.ng} width={2.5} />
      <T x={400} y={252} size={12} fill={C.ng} anchor="middle" weight={600}>
        クライアントの速度に律速される
      </T>
      <T x={109} y={252} size={12} weight={600} fill={C.ng} anchor="middle">
        その間ずっと占有される
      </T>

      <T x={400} y={286} size={12} fill={C.subtle} anchor="middle">
        OFF にしてよいのは SSE やストリーミングなど、保持されると困る応答だけ
      </T>
    </svg>
  );
}
