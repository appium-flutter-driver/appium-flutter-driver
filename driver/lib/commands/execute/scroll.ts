
// tslint:disable:object-literal-sort-keys

import _ from 'lodash';
import { FlutterDriver } from '../../driver';
import { waitFor, waitForTappable } from './wait';

export const scroll = async (
  self: FlutterDriver,
  elementBase64: string,
  opts: {
    dx: number;
    dy: number;
    durationMilliseconds: number;
    frequency?: number;
  },
) => {
  const { dx, dy, durationMilliseconds, frequency = 60 } = opts;

  if (
    typeof dx !== `number` ||
    typeof dy !== `number` ||
    typeof durationMilliseconds !== `number` ||
    typeof frequency !== `number`
  ) {
    // @todo BaseDriver's errors.InvalidArgumentError();
    throw new Error(`${opts} is not a valid options`);
  }

  if (dx === 0 && dy === 0) {
    // @todo BaseDriver's errors.InvalidArgumentError();
    throw new Error(`${opts} is not a valid options`);
  }

  return await self.executeElementCommand(`scroll`, elementBase64, {
    dx,
    dy,
    // 'scroll' expects microseconds
    // https://github.com/flutter/flutter/blob/master/packages/flutter_driver/lib/src/common/gesture.dart#L33-L38
    duration: durationMilliseconds * 1000,
    frequency,
  });
};

export const longTap = async (
  self: FlutterDriver,
  elementBase64: string,
  opts: {
    durationMilliseconds: number;
    frequency?: number;
  },
) => {
  const { durationMilliseconds, frequency = 60 } = opts;

  if (
    typeof durationMilliseconds !== `number` ||
    typeof frequency !== `number`
  ) {
    // @todo BaseDriver's errors.InvalidArgumentError();
    throw new Error(`${opts} is not a valid options`);
  }

  return await self.executeElementCommand(`scroll`, elementBase64, {
    dx: 0,
    dy: 0,
    // 'scroll' expects microseconds
    // https://github.com/flutter/flutter/blob/master/packages/flutter_driver/lib/src/common/gesture.dart#L33-L38
    duration: durationMilliseconds * 1000,
    frequency,
  });
};

const validateOps = (alignment, dxScroll, dyScroll) => {
  if (
    typeof alignment !== `number` ||
    typeof dxScroll !== `number` ||
    typeof dyScroll !== `number`
  ) {
    return false;
  }

  if (dxScroll === 0 && dyScroll === 0) {
    return false;
  }

  return true;
}

const shouldRetry = (startAt, waitTimeout) => {
  if (!waitTimeout) {
    return false;
  }

  if (Date.now() - startAt > _.toInteger(waitTimeout)) {
    return false;
  }

  return true;
}

export const scrollUntilVisible = async (
  self: FlutterDriver,
  elementBase64: string,
  opts: {
    item: string;
    alignment: number;
    dxScroll: number;
    dyScroll: number;
    durationMilliseconds: number;
    frequency?: number;
    waitTimeout?: number;
  },
) => {
  const { item, alignment = 0.0, dxScroll = 0, dyScroll = 0, durationMilliseconds = 100, frequency, waitTimeout } = opts;

  if (!validateOps(alignment, dxScroll, dyScroll)) {
    throw new Error(`${opts} is not a valid options`);
  }

  // An expectation for checking that an element, known to be present on the widget tree, is visible
  let isVisible = false;
  const startAt = Date.now()
  while (isVisible || shouldRetry(startAt, waitTimeout)) {
    try {
      waitFor(self, item).then((_) => {
        isVisible = true;
      });

      if (isVisible) {
        // the element is in the view
        break
      }

      await scroll(self, elementBase64,{
        dx: dxScroll,
        dy: dyScroll,
        durationMilliseconds: 100,
        frequency
      });
    } catch { /* go to the next scroll */ }
  }

  if (!isVisible) {
    throw new Error(`Stop scrolling as timeout ${durationMilliseconds}`);
  }

  return scrollIntoView(self, item, { alignment });
};

export const scrollUntilTapable = async (
  self: FlutterDriver,
  elementBase64: string,
  opts: {
    item: string;
    alignment: number;
    dxScroll: number;
    dyScroll: number;
    durationMilliseconds: number;
    frequency?: number;
    waitTimeout?: number;
  },
) => {
  const { item, alignment = 0.0, dxScroll = 0, dyScroll = 0, durationMilliseconds = 100, frequency, waitTimeout } = opts;

  if (!validateOps(alignment, dxScroll, dyScroll)) {
    throw new Error(`${opts} is not a valid options`);
  }

  // Kick off an (unawaited) waitForTappable that will complete when the item we're
  // looking for finally scrolls onscreen and can be hit-tested. We add an initial pause to give it
  // the chance to complete if the item is already onscreen; if not, scroll
  // repeatedly until we either find the item or time out.
  let isVisible = false;

  const startAt = Date.now()
  while (isVisible || shouldRetry(startAt, waitTimeout)) {
    try {
      waitForTappable(self, item).then((_) => {
        isVisible = true;
      });

      if (isVisible) {
        // the element is in the view
        break
      }

      await scroll(self, elementBase64,{
        dx: dxScroll,
        dy: dyScroll,
        durationMilliseconds: 100,
        frequency
      });
    } catch { /* go to the next scroll */ }
  }

  if (!isVisible) {
    throw new Error(`Stop scrolling as timeout ${durationMilliseconds}`);
  }

  return scrollIntoView(self, item, { alignment });
};

export const scrollIntoView = async (
  self: FlutterDriver,
  elementBase64: string,
  opts: {
    alignment: number;
    timeout?: number;
  },
) => {
  const { alignment = 0.0, timeout } = opts;
  if (typeof alignment !== `number` || (typeof timeout !== `undefined` && typeof timeout !== `number`)) {
    // @todo BaseDriver's errors.InvalidArgumentError();
    throw new Error(`${opts} is not a valid options`);
  }

  const args = typeof timeout === `number` ? { alignment, timeout } : { alignment };

  return await self.executeElementCommand(`scrollIntoView`, elementBase64, args);
};
