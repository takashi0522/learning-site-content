import type { ComponentType } from "react";
import {
  AiStackLayers,
  GpuMonitoringPipeline,
  IbCreditFlow,
  K8sDevicePlugin,
  NcclRingTree,
  NfsVsParallelFs,
  StorageAccessModels,
  TrainingStep,
} from "./ai";
import { CaHierarchy, OidcCodePkce } from "./auth";
import { LiquidCommissioning, RailOptimized } from "./buildout";
import {
  AbPowerFeed,
  BlankPanel,
  Breakout,
  CopperReachByLane,
  EthernetNaming,
  HotColdAisle,
  ImmersionTypes,
  LiquidCoolingLoops,
  LiquidToLiquidVsAir,
  PatchPanel,
  PluggableLpoCpo,
  SpineLeaf,
  TorEorMor,
} from "./facility";
import { AgentLoop, ApiStateless, ContextWindowContents, IndirectInjection, McpParticipants, RagPipeline, ToolUseRoundTrip } from "./genai";
import { CudaStack, GpuContainerStack, GpuInterconnectPaths } from "./gpu";
import { DcqcnLoop, EcmpVsAdaptive, PfcPause } from "./gpunet";
import { NumaTopology, PcieNuma, PowerLossProtection } from "./hardware";
import { CephLayers, CephPlacement, FileVsObject, LustreFileLayout, NfsClientCaches, NfsCloseToOpen, PflComponents, ProtectionLayers, StoragePerfAxes } from "./storage";
import { DeviceAssignment, GpuSharingModes, K8sControlFlow, NetbootFlow, RequestsLimits, ServiceRouting } from "./platform";
import { ContainerParts, DemandPaging, FdToInode, SyscallBoundary } from "./linux";
import {
  CheckpointContents,
  DcpShards,
  DdpOverlap,
  GenerationLoop,
  HandoverPipeline,
  LoraAdapter,
  ModelStateBytes,
  ParallelismLayout,
  TrainingLoop,
  TwoCheckpoints,
  VllmServing,
} from "./mlwork";
import { LvmStack } from "./ops";
import { RxPacketPath, TcpQueues, TcpTeardown, TlsHandshakeRtt } from "./network";
import {
  EpollVsPoll,
  KafkaPartitions,
  ProxyBuffering,
  WalCheckpoint,
} from "./middleware";

/**
 * MDX から `<Figure name="..." />` で呼べる図の一覧。
 * 教材側はここの ID だけを知っていればよく、SVG の実装には依存しない。
 */
export const FIGURES = {
  "fd-to-inode": FdToInode,
  "demand-paging": DemandPaging,
  "numa-topology": NumaTopology,
  "lvm-stack": LvmStack,
  "ab-power-feed": AbPowerFeed,
  breakout: Breakout,
  "rx-packet-path": RxPacketPath,
  "cuda-stack": CudaStack,
  "nccl-ring-tree": NcclRingTree,
  "oidc-code-pkce": OidcCodePkce,
  "epoll-vs-poll": EpollVsPoll,
  "wal-checkpoint": WalCheckpoint,
  "kafka-partitions": KafkaPartitions,
  "proxy-buffering": ProxyBuffering,
  "tcp-queues": TcpQueues,
  "container-parts": ContainerParts,
  "gpu-interconnect-paths": GpuInterconnectPaths,
  "hot-cold-aisle": HotColdAisle,
  "liquid-cooling-loops": LiquidCoolingLoops,
  "liquid-to-liquid-vs-air": LiquidToLiquidVsAir,
  "copper-reach-by-lane": CopperReachByLane,
  "pluggable-lpo-cpo": PluggableLpoCpo,
  "ca-hierarchy": CaHierarchy,
  "k8s-device-plugin": K8sDevicePlugin,
  "ai-stack-layers": AiStackLayers,
  "storage-access-models": StorageAccessModels,
  "training-loop": TrainingLoop,
  "model-state-bytes": ModelStateBytes,
  "two-checkpoints": TwoCheckpoints,
  "ddp-overlap": DdpOverlap,
  "parallelism-layout": ParallelismLayout,
  "checkpoint-contents": CheckpointContents,
  "dcp-shards": DcpShards,
  "lora-adapter": LoraAdapter,
  "generation-loop": GenerationLoop,
  "vllm-serving": VllmServing,
  "handover-pipeline": HandoverPipeline,
  "nfs-vs-parallel-fs": NfsVsParallelFs,
  "training-step": TrainingStep,
  "ib-credit-flow": IbCreditFlow,
  "tor-eor-mor": TorEorMor,
  "patch-panel": PatchPanel,
  "ethernet-naming": EthernetNaming,
  "blank-panel": BlankPanel,
  "pcie-numa": PcieNuma,
  "power-loss-protection": PowerLossProtection,
  "syscall-boundary": SyscallBoundary,
  "tcp-teardown": TcpTeardown,
  "tls-handshake-rtt": TlsHandshakeRtt,
  "gpu-container-stack": GpuContainerStack,
  "spine-leaf": SpineLeaf,
  "rail-optimized": RailOptimized,
  "pfc-pause": PfcPause,
  "dcqcn-loop": DcqcnLoop,
  "ecmp-vs-adaptive": EcmpVsAdaptive,
  "nfs-client-caches": NfsClientCaches,
  "nfs-close-to-open": NfsCloseToOpen,
  "lustre-file-layout": LustreFileLayout,
  "pfl-components": PflComponents,
  "file-vs-object": FileVsObject,
  "storage-perf-axes": StoragePerfAxes,
  "ceph-layers": CephLayers,
  "ceph-placement": CephPlacement,
  "protection-layers": ProtectionLayers,
  "context-window-contents": ContextWindowContents,
  "api-stateless": ApiStateless,
  "rag-pipeline": RagPipeline,
  "tool-use-round-trip": ToolUseRoundTrip,
  "mcp-participants": McpParticipants,
  "agent-loop": AgentLoop,
  "indirect-injection": IndirectInjection,
  "k8s-control-flow": K8sControlFlow,
  "service-routing": ServiceRouting,
  "requests-limits": RequestsLimits,
  "netboot-flow": NetbootFlow,
  "device-assignment": DeviceAssignment,
  "gpu-sharing-modes": GpuSharingModes,
  "liquid-commissioning": LiquidCommissioning,
  "immersion-types": ImmersionTypes,
  "gpu-monitoring-pipeline": GpuMonitoringPipeline,
} satisfies Record<string, ComponentType>;

export type FigureName = keyof typeof FIGURES;
