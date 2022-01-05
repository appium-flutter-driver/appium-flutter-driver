import { FlutterDriver } from '../driver';
import { log } from '../logger';

import { DRIVER_NAME as ANDROID_DEVICE_NAME, startAndroidSession } from './android';
import { DRIVER_NAME as IOS_DEVICE_NAME, startIOSSession } from './ios';

// tslint:disable-next-line:variable-name
export const createSession = async function(this: FlutterDriver, sessionId, caps, ...args)  {
    try {
      // setup proxies - if platformName is not empty, make it less case sensitive
      if (caps.platformName !== null) {
        const appPlatform = caps.platformName.toLowerCase();
        switch (appPlatform) {
          case `ios`:
            [this.proxydriver, this.socket] = await startIOSSession(caps, ...args);
            this.proxydriver.relaxedSecurityEnabled = this.relaxedSecurityEnabled;
            this.proxydriver.denyInsecure = this.denyInsecure;
            this.proxydriver.allowInsecure = this.allowInsecure;
            this.proxydriverName = IOS_DEVICE_NAME;
            break;
          case `android`:
            [this.proxydriver, this.socket] = await startAndroidSession(caps, ...args);
            this.proxydriver.relaxedSecurityEnabled = this.relaxedSecurityEnabled;
            this.proxydriver.denyInsecure = this.denyInsecure;
            this.proxydriver.allowInsecure = this.allowInsecure;
            this.proxydriverName = ANDROID_DEVICE_NAME;
            break;
          default:
            log.errorAndThrow(
              `Unsupported platformName: ${caps.platformName}`,
            );
        }
      }

      return [sessionId, this.opts];
    } catch (e) {
      await this.deleteSession();
      throw e;
    }
  };

export const deleteSession = async function(this: FlutterDriver) {
    log.debug(`Deleting Flutter Driver session`);

    if (this.proxydriver !== null) {
      await this.proxydriver.deleteSession();
      this.proxydriver = null;
    }
  };
