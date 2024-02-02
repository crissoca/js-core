import { ClientContext, internal, Platform } from '@launchdarkly/js-sdk-common';
import { EventProcessor } from '@launchdarkly/js-sdk-common/dist/internal';

import Configuration from '../configuration';

const createEventProcessor = (
  clientSideID: string,
  config: Configuration,
  platform: Platform,
  diagnosticsManager?: internal.DiagnosticsManager,
  start: boolean = false,
): EventProcessor | undefined => {
  if (config.sendEvents) {
    return new internal.EventProcessor(
      { ...config, eventsCapacity: config.capacity },
      new ClientContext(clientSideID, config, platform),
      undefined,
      diagnosticsManager,
      start,
    );
  }

  return undefined;
};

export default createEventProcessor;
