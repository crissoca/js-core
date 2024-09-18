import { Context, internal, LDLogger } from '@launchdarkly/js-sdk-common';

import FlagManager from '../flag-manager/FlagManager';
import { ItemDescriptor } from '../flag-manager/ItemDescriptor';
import { DeleteFlag, Flags, PatchFlag } from '../types';
import DataSourceStatusManager from './DataSourceStatusManager';

type LDStreamingError = internal.LDStreamingError;
type LDPollingError = internal.LDPollingError;

export default class DataSourceEventHandler {
  constructor(
    private readonly flagManager: FlagManager,
    private readonly statusManager: DataSourceStatusManager,
    private readonly logger: LDLogger,
  ) {}

  async handlePut(context: Context, flags: Flags) {
    this.logger.debug(`Got PUT: ${Object.keys(flags)}`);

    // mapping flags to item descriptors
    const descriptors = Object.entries(flags).reduce(
      (acc: { [k: string]: ItemDescriptor }, [key, flag]) => {
        acc[key] = { version: flag.version, flag };
        return acc;
      },
      {},
    );
    await this.flagManager.init(context, descriptors).then();
  }

  async handlePatch(context: Context, patchFlag: PatchFlag) {
    this.logger.debug(`Got PATCH ${JSON.stringify(patchFlag, null, 2)}`);
    this.flagManager.upsert(context, patchFlag.key, {
      version: patchFlag.version,
      flag: patchFlag,
    });
  }

  async handleDelete(context: Context, deleteFlag: DeleteFlag) {
    this.logger.debug(`Got DELETE ${JSON.stringify(deleteFlag, null, 2)}`);

    this.flagManager.upsert(context, deleteFlag.key, {
      version: deleteFlag.version,
      flag: {
        ...deleteFlag,
        deleted: true,
        // props below are set to sensible defaults. they are irrelevant
        // because this flag has been deleted.
        flagVersion: 0,
        value: undefined,
        variation: 0,
        trackEvents: false,
      },
    });
  }

  handleStreamingError(error: LDStreamingError) {
    this.statusManager.setError(error.kind, error.message, error.code);
  }

  handlePollingError(error: LDPollingError) {
    this.statusManager.setError(error.kind, error.message, error.status);
  }
}
