export interface MidgardConstants {
  int_64_values: {
    BadValidatorRate: number,
    BlocksPerYear: number,
    DesireValidatorSet: number,
    DoubleSignMaxAge: number,
    EmissionCurve: number,
    FailKeySignSlashPoints: number,
    FailKeygenSlashPoints: number,
    FundMigrationInterval: number,
    JailTimeKeygen: number,
    JailTimeKeysign: number,
    LackOfObservationPenalty: number,
    MinimumBondInRune: number,
    MinimumNodesForBFT: number,
    MinimumNodesForYggdrasil: number,
    NewPoolCycle: number,
    ObserveSlashPoints: number,
    OldValidatorRate: number,
    RotatePerBlockHeight: number,
    RotateRetryBlocks: number,
    SigningTransactionPeriod: number,
    StakeLockUpBlocks: number,
    TransactionFee: number,
    ValidatorRotateInNumBeforeFull: number,
    ValidatorRotateNumAfterFull: number,
    ValidatorRotateOutNumBeforeFull: number,
    WhiteListGasAsset: number,
    YggFundLimit: number
  };
  bool_values: {
    StrictBondStakeRatio: boolean;
  };
  string_values: {
    DefaultPoolStatus: string;
  };
}
