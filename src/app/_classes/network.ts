export interface NetworkSummary {
  activeBonds: string[];
  activeNodeCount: string;
  blockRewards: {
    blockReward: string,
    bondReward: string,
    poolReward: string
  };
  bondMetrics: {
    averageActiveBond: string,
    averageStandbyBond: string,
    maximumActiveBond: string,
    maximumStandbyBond: string,
    medianActiveBond: string,
    medianStandbyBond: string,
    minimumActiveBond: string,
    minimumStandbyBond: string,
    totalActiveBond: string,
    totalStandbyBond: string
  };
  bondingAPY: string;
  liquidityAPY: string;
  nextChurnHeight: string;
  poolActivationCountdown: string;
  poolShareFactor: string;
  standbyBonds: string[];
  standbyNodeCount: string;
  totalPooledRune: string;
  totalReserve: string;
}
