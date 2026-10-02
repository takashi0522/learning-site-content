import type { ComponentType } from "react";
import {
  AiStackLayers,
  IbCreditFlow,
  K8sDevicePlugin,
  NcclRingTree,
  NfsVsParallelFs,
  StorageAccessModels,
  TrainingStep,
} from "./ai";
import { CaHierarchy, OidcCodePkce } from "./auth";
import { RailOptimized } from "./buildout";
import {
  AbPowerFeed,
  BlankPanel,
  Breakout,
  CopperReachByLane,
  EthernetNaming,
  HotColdAisle,
  LiquidCoolingLoops,
  LiquidToLiquidVsAir,
  PatchPanel,
  PluggableLpoCpo,
  SpineLeaf,
  TorEorMor,
} from "./facility";
import { CudaStack, GpuContainerStack, GpuInterconnectPaths } from "./gpu";
import { DcqcnLoop, EcmpVsAdaptive, PfcPause } from "./gpunet";
import { NumaTopology, PcieNuma, PowerLossProtection } from "./hardware";
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
} satisfies Record<string, ComponentType>;

export type FigureName = keyof typeof FIGURES;
