import fs from "node:fs";
import path from "node:path";

/**
 * ラボもレッスンと同じく「コードではなくデータ」。
 * content/labs/<id>.json を置けばビルド時に拾われる。
 *
 * ラボはコースの中には埋めない。演習は縦に長く操作も要るので、
 * 1 枚 850px のスライド予算に収まらないため (CLAUDE.md の「スライド表示」を参照)。
 *
 * 形式は 2 つある。
 * - `walk`  … 1 手ずつ「次に何が起きるか」を選ぶ。読み物に近い
 * - `build` … 自分で組み立てて、制約を満たせたかを検証する。ゲームに近い
 */

export type LabStatus = "ready" | "planned";
export type LabMode = "walk" | "build" | "place";

// ---- walk 形式 --------------------------------------------------------

export type LabNode = {
  id: string;
  /** SVG 上の x 座標 (論理幅 880 のキャンバス) */
  x: number;
  w: number;
  /** 段。0 が最上段。省略時は 1 列に並べる (packet-walk のような直線トポロジ) */
  row?: number;
  /** storage / cpu / gpu は「どこで動くか」を示す (学習の手順を追うラボで使う) */
  kind: "host" | "switch" | "router" | "spine" | "leaf" | "storage" | "cpu" | "gpu";
  label: string;
  sub?: string;
};

/** ノード間のリンク。省略時は隣り合うノードを順に結ぶ。 */
export type LabLink = {
  from: string;
  to: string;
  /** この手順で選ばれている経路として強調するか */
  id?: string;
};

export type LabFrame = {
  srcMac: string;
  dstMac: string;
  srcIp: string;
  dstIp: string;
  ttl?: number;
};

export type LabOption = {
  label: string;
  correct?: boolean;
  /** 誤答したときに出す手がかり。正解を明かさずに考え直させる */
  hint: string;
};

export type LabStep = {
  id: string;
  /** この手順でハイライトするノード */
  at: string;
  /** この手順で通っている経路 (LabLink の id)。トポロジ上で太く描く */
  path?: string[];
  /** この手順で停止しているノード。障害の手順で使う */
  down?: string[];
  /** この手順で注目するコード。問いの上に等幅で出す */
  code?: string;
  prompt: string;
  options: LabOption[];
  explain: string;
  frame?: LabFrame | null;
  /** 直前の手順から変わったフィールド。図側で強調する */
  changed?: (keyof LabFrame)[];
};

// ---- build 形式 -------------------------------------------------------

export type RackFeed = {
  id: string;
  label: string;
  volts: number;
  amps: number;
  /** 単相なら 1、三相なら 3。三相の容量は √3 × V × A になる */
  phase?: 1 | 3;
  /** 連続負荷はブレーカ定格の何割までにするか (電気規格上の原則で 0.8) */
  derate: number;
};

export type RackItem = {
  id: string;
  label: string;
  /** 占有 U 数。side マウントの機器は 0 */
  u: number;
  watts: number;
  /** 見た目の区別と、チェックでの数え上げに使う */
  kind: "server" | "switch" | "blank" | "gpu" | "pdu";
  /**
   * 取り付け方。`side` はラック側面（0U）で、U を消費しない。
   * 縦型 PDU が「U を食わずに全高をカバーできる」のはこの性質による。
   */
  mount?: "u" | "side";
  /** PDU のとき: 使えるコンセント口数（1 機器あたり 1 口） */
  outlets?: number;
  /** ケーブルが届く範囲 (PDU / スイッチ)。"all" は全高 */
  reach?: number | "all";
  /** 質量 (kg)。フロア荷重と重心の判定に使う */
  kg?: number;
  note?: string;
};

/**
 * 検証ルール。閾値だけをデータに置き、判定そのものは lib/rack.ts が持つ。
 * 条件分岐を JSON で表現しようとすると、すぐに読めない設定ファイルになる。
 */
export type RackCheck = {
  id: string;
  label: string;
  kind:
    | "units"
    | "breaker"
    | "redundancy"
    | "count"
    | "blanks"
    | "outlets"
    | "reach"
    | "weight"
    | "balance"
    | "zone";
  /** kind: "count" / "zone" のとき、対象の機材種別 */
  target?: RackItem["kind"];
  min?: number;
  /** kind: "weight" のとき、ラック 1 本あたりの上限 (kg) */
  maxKg?: number;
  /** kind: "zone" のとき、最上段から何 U 以内に置くか */
  topWithin?: number;
  /** kind: "reach" のとき、ケーブルを供給する側の種別 (既定は pdu) */
  via?: RackItem["kind"];
  /** 満たせなかったときの手がかり */
  hint: string;
  /** 満たせたときに読ませたい一文 */
  insight?: string;
};

/**
 * お題。1 つを短く保ち、少しずつ制約を足していく。
 * 初級者にとっては、全部の制約を一度に出されると長すぎる。
 */
export type RackMission = {
  id: string;
  title: string;
  brief: string;
  requirements: string[];
  /** このお題で使える機材 (catalog の id)。省略時は全部 */
  available?: string[];
  /**
   * このお題だけ給電を差し替える。省略時は spec.feeds。
   * 「単相では載らない → 三相にする → さらに上げる」のように、
   * 同じラックで給電だけを変えて比べさせるために使う。
   */
  feeds?: RackFeed[];
  /** 最初から置いてある機器 (catalog の id を並べた順) */
  preset?: string[];
  checks: RackCheck[];
  /** 達成後に出す、次に試してほしいこと */
  afterword?: string;
};

export type RackSpec = {
  units: number;
  feeds: RackFeed[];
  catalog: RackItem[];
  missions: RackMission[];
};

// ---- place 形式 -------------------------------------------------------

export type GpuSlot = {
  id: string;
  label: string;
  /** free = 使える / busy = 他のジョブが使用中 / faulty = 故障 */
  status: "free" | "busy" | "faulty";
  note?: string;
};

export type GpuNode = {
  id: string;
  label: string;
  sub?: string;
  gpus: GpuSlot[];
};

export type PlacementMission = {
  id: string;
  title: string;
  brief: string;
  requirements: string[];
  /** このお題で必要な GPU 数 */
  need: number;
  /**
   * このお題でのノードの状態。指定した GPU を故障 / 使用中に差し替える。
   * 「使いたいノードが埋まっている」状況を作るために使う。
   */
  unavailable?: { gpu: string; status: "busy" | "faulty" }[];
  /** 達成条件: 使ってよい最も遅い経路。これより遅い経路を含むと不合格 */
  requireLink?: "intra" | "inter";
  /** 達成条件を満たせなかったときの手がかり */
  hint: string;
  afterword?: string;
};

export type PlacementSpec = {
  nodes: GpuNode[];
  /** ノード内 (NVLink) とノード間 (InfiniBand) の帯域 */
  links: { intra: { label: string; gbps: number }; inter: { label: string; gbps: number } };
  /** All-Reduce する勾配の大きさ (GB) */
  gradientGb: number;
  missions: PlacementMission[];
};

// ---- 共通 -------------------------------------------------------------

export type Lab = {
  id: string;
  title: string;
  subtitle: string;
  goal: string;
  minutes: number;
  status: LabStatus;
  mode?: LabMode;
  accent: string;
  requirements?: string[];
  summary?: string[];
  next?: { label: string; href: string }[];
  /**
   * 本題に入る前に読ませる導入。
   * 前提の構成そのものが初見のときは、問いから始めると答えようがない。
   */
  intro?: { title: string; body: string[] };
  /** walk 形式 */
  nodes?: LabNode[];
  links?: LabLink[];
  /** 段ごとの役割ラベル (ファブリック図のとき) */
  rowLabels?: { label: string; sub?: string }[];
  segments?: { label: string; from: string; to: string }[];
  macs?: Record<string, string>;
  steps?: LabStep[];
  /** build 形式 */
  rack?: RackSpec;
  /** place 形式 */
  placement?: PlacementSpec;
  /** status: "planned" のとき、何を作る予定か */
  plan?: string[];
};

const ORDER: Record<string, number> = {
  "packet-walk": 1,
  "fabric-walk": 2,
  "gpu-network": 3,
  "rack-design": 4,
  "rack-gpu": 5,
  "rack-cabling": 6,
  "gpu-placement": 7,
  "pytorch-training": 8,
};

export function getLabs(): Lab[] {
  const dir = path.join(process.cwd(), "content", "labs");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as Lab)
    .sort((a, b) => (ORDER[a.id] ?? 99) - (ORDER[b.id] ?? 99));
}

export function getLab(id: string): Lab | undefined {
  return getLabs().find((lab) => lab.id === id);
}

/** ページを生成するのは中身のあるラボだけ。 */
export function getReadyLabs(): Lab[] {
  return getLabs().filter((lab) => lab.status === "ready");
}
