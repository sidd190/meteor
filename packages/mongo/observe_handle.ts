import { ObserveHandleCallback, ObserveMultiplexer } from './observe_multiplex';

let nextObserveHandleId = 1;

export type ObserveHandleCallbackInternal = '_added' | '_addedBefore' | '_changed' | '_movedBefore' | '_removed';

/**
 * The "observe handle" returned from observeChanges.
 * Contains a reference to an ObserveMultiplexer.
 * Used to stop observation and clean up resources.
 */
export class ObserveHandle {
  _id: number;
  _multiplexer: ObserveMultiplexer;
  nonMutatingCallbacks: boolean;
  _stopped: boolean;

  public initialAddsSentResolver: (value: void) => void = () => {};
  public initialAddsSent: Promise<void>

  _added?: (...args: any[]) => Promise<void>;
  _addedBefore?: (...args: any[]) => Promise<void>;
  _changed?: (...args: any[]) => Promise<void>;
  _movedBefore?: (...args: any[]) => Promise<void>;
  _removed?: (...args: any[]) => Promise<void>;

  constructor(multiplexer: any, callbacks: Record<ObserveHandleCallback, any>, nonMutatingCallbacks: boolean) {
    this._multiplexer = multiplexer;

    multiplexer.callbackNames().forEach((name: ObserveHandleCallback) => {
      if (callbacks[name]) {
        this[`_${name}` as ObserveHandleCallbackInternal] = callbacks[name];
        return;
      }

      if (name === "addedBefore" && callbacks.added) {
        this._addedBefore = async function (id, fields, before) {
          await callbacks.added(id, fields);
        };
      }
    });

    this._stopped = false;
    this._id = nextObserveHandleId++;
    this.nonMutatingCallbacks = nonMutatingCallbacks;

    this.initialAddsSent = new Promise(resolve => {
      return this.initialAddsSentResolver = () => {
        resolve();
        this.initialAddsSent = Promise.resolve();
      };
    });
  }

  async stop() {
    if (this._stopped) return;
    this._stopped = true;
    await this._multiplexer.removeHandle(this._id);
  }
}