import { LDOptions, platform } from '@launchdarkly/js-server-sdk-common';
import FastlyCrypto from './FastlyCrypto';
import NodeInfo from './FastlyInfo';
import FastlyRequests from './FastlyRequests';

export default class FastlyPlatform implements platform.Platform {
  info: platform.Info = new NodeInfo();

  crypto: platform.Crypto = new FastlyCrypto();

  requests: platform.Requests;

  constructor(options: LDOptions) {
    // @ts-ignore
    this.requests = new FastlyRequests(options);
  }
}
