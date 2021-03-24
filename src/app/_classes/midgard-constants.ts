export interface MidgardConstants {
  int_64_values: {
    AsgardSize: number;
    BadValidatorRate: number,
    BadValidatorRedline: number,
    BlocksPerYear: number,
    ChurnInterval: number,
    ChurnRetryInterval: number,
    CliTxCost: number,
    DesiredValidatorSet: number,
    DoubleSignMaxAge: number,
    EmissionCurve: number,
    FailKeySignSlashPoints: number,
    FailKeygenSlashPoints: number,
    FullImpLossProtectionBlocks: number,
    FundMigrationInterval: number,
    IncentiveCurve: number,
    JailTimeKeygen: number,
    JailTimeKeysign: number,
    LackOfObservationPenalty: number,
    LiquidityLockUpBlocks: number,
    MaxAvailablePools: number,
    MaxSwapsPerBlock: number,
    MinRunePoolDepth: number,
    MinSlashPointsForBadValidator: number,
    MinSwapsPerBlock: number,
    MinimumBondInRune: number,
    MinimumNodesForBFT: number,
    MinimumNodesForYggdrasil: number,
    NativeTransactionFee: number,
    ObservationDelayFlexibility: number,
    ObserveSlashPoints: number,
    OldValidatorRate: number,
    OutboundTransactionFee: number,
    PoolCycle: number,
    SigningTransactionPeriod: number,
    StagedPoolCost: number,
    VirtualMultSynths: number,
    YggFundLimit: number
  };
  bool_values: {
    StrictBondLiquidityRatio: boolean,
  };
  string_values: {
    DefaultPoolStatus: string;
  };
}
