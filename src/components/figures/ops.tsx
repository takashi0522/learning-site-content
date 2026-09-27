import { Box, C, Elbow, T } from "./primitives";

const ROWS = [
  { y: 26, name: "ファイルシステム", cmd: "mkfs / xfs_growfs" },
  { y: 86, name: "LV（論理ボリューム）", cmd: "lvcreate / lvextend" },
  { y: 146, name: "VG（ボリュームグループ）", cmd: "vgcreate / vgextend" },
  { y: 206, name: "PV（物理ボリューム）", cmd: "pvcreate" },
  { y: 266, name: "物理ディスク", cmd: "lsblk で確認" },
];

/**
 * LVM の 4 階層。容量拡張は下から順に「空きがあるか」を見ていく作業なので、
 * 各層に対応するコマンドを右に並べて、どこを触っているのかを対応させている。
 */
export function LvmStack() {
  const h = 42;
  return (
    <svg viewBox="0 0 800 332" role="img" aria-label="物理ディスクからファイルシステムまでの LVM の階層">
      {ROWS.map((r) => (
        <g key={r.name}>
          <T x={620} y={r.y + 16} size={12} weight={700} fill={C.fg}>
            {r.name}
          </T>
          <T x={620} y={r.y + 33} size={12} fill={C.subtle} mono>
            {r.cmd}
          </T>
        </g>
      ))}

      {/* ファイルシステム */}
      <Box x={40} y={26} w={166} h={h} label="xfs" sub="/" size={12} />
      <Box x={214} y={26} w={186} h={h} label="xfs" sub="/var" size={12} tone="accent" />
      <Box x={408} y={26} w={124} h={h} label="swap" size={12} />

      {/* LV */}
      <Box x={40} y={86} w={166} h={h} label="vg0-root" mono size={12} />
      <Box x={214} y={86} w={186} h={h} label="vg0-var" mono size={12} tone="accent" />
      <Box x={408} y={86} w={124} h={h} label="vg0-swap" mono size={12} />
      <Box x={540} y={86} w={60} h={h} label="空き" size={12} tone="ghost" dashed />

      {/* VG */}
      <Box x={40} y={146} w={560} h={h} label="vg0" sub="ここに空き (VFree) があれば無停止で拡張できる" mono size={13} />

      {/* PV */}
      <Box x={40} y={206} w={340} h={h} label="/dev/sda2" mono size={12} />
      <Box x={392} y={206} w={208} h={h} label="/dev/sdb" mono size={12} tone="ghost" dashed />

      {/* 物理ディスク */}
      <Box x={40} y={266} w={340} h={h} label="内蔵ディスク" size={12} />
      <Box x={392} y={266} w={208} h={h} label="増設ディスク" sub="② で追加する分" size={12} tone="ghost" dashed />

      <Elbow points={[[28, 302], [28, 30]]} color={C.accent} width={2} />
      <g transform="rotate(-90 13 168)">
        <T x={13} y={168} size={12.5} weight={600} fill={C.accent} anchor="middle" middle>
          下から順に空きを確認する
        </T>
      </g>

      <T x={400} y={324} size={12.5} fill={C.subtle} anchor="middle">
        lvextend -r は「LV の拡張」と「ファイルシステムの追従」を 1 コマンドでまとめて行う
      </T>
    </svg>
  );
}
