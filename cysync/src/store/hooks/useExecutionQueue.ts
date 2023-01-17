import React, { useEffect, useRef } from 'react';

import logger from '../../utils/logger';
import { useNetwork } from '../provider';

import { ExecutionResult } from './types';

export abstract class ExecutionQueueItem {
  public module: string;

  equals(_item: ExecutionQueueItem) {
    throw new Error('equals not implemented for this class');
  }
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface UseExecutionQueueInterface<T> {
  queue: T[];
  setQueue: React.Dispatch<React.SetStateAction<T[]>>;
  queueExecuteInterval: number;
  modulesInExecutionQueue: string[];
  setModuleInExecutionQueue: React.Dispatch<React.SetStateAction<string[]>>;
  addToQueue: (item: T) => void;
  connected: boolean;
  connectedRef: React.MutableRefObject<boolean>;
  isSyncing: boolean;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  isInitialSetupDone: boolean;
  setInitialSetupDone: React.Dispatch<React.SetStateAction<boolean>>;
  isWaitingForConnection: boolean;
  isExecutingTask: boolean;
  setIsExecutingTask: React.Dispatch<React.SetStateAction<boolean>>;
  updateQueueItems: (
    updateOperations: Array<{
      item: T;
      operation: 'remove' | 'update';
      updatedItem?: T;
    }>,
    allCompletedModulesSet: Set<string>
  ) => void;
}

export interface UseExecutionQueueOptions<T> {
  queueName: string;
  executeInterval: number;
  queueExecutor: () => Promise<Array<Array<ExecutionResult<T>>>>;
  updateItemsInQueue: (executionResults: Array<ExecutionResult<T>>) => void;
}

export type UseExecutionQueue = <T extends ExecutionQueueItem>({
  queueName,
  executeInterval,
  queueExecutor,
  updateItemsInQueue
}: UseExecutionQueueOptions<T>) => UseExecutionQueueInterface<T>;

export const useExecutionQueue: UseExecutionQueue = <
  T extends ExecutionQueueItem
>({
  queueName,
  executeInterval,
  queueExecutor,
  updateItemsInQueue
}: UseExecutionQueueOptions<T>) => {
  const { connected } = useNetwork();
  const name = queueName;
  const [queue, setQueue] = React.useState<T[]>([]);
  const [modulesInExecutionQueue, setModuleInExecutionQueue] = React.useState<
    string[]
  >([]);

  const [isExecutingTask, setIsExecutingTask] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isWaitingForConnection, setWaitingForConnection] =
    React.useState(false);
  const [isInitialSetupDone, setInitialSetupDone] = React.useState(false);

  const queueExecuteInterval = executeInterval;

  const connectedRef = useRef<boolean | null>(connected);

  const timeThreshold = 60000; // log every 1 minute
  const offsetTime = useRef(0);
  const startTime = useRef(0);

  const addToQueue = (item: T) => {
    setQueue(currentSyncQueue => {
      if (currentSyncQueue.findIndex(elem => elem.equals(item)) === -1) {
        // Adds the current item to ModuleExecutionQueue
        setModuleInExecutionQueue(currentModuleQueue => {
          if (!currentModuleQueue.includes(item.module)) {
            return [...currentModuleQueue, item.module];
          }
          return currentModuleQueue;
        });

        return [...currentSyncQueue, item];
      }
      return currentSyncQueue;
    });
  };

  const executeQueue = async () => {
    setIsExecutingTask(true);
    const timeStart = performance.now();
    const array = await executeNextInQueue();
    if (array.length > 0)
      updateAllExecutedItems(array.reduce((acc, item) => acc.concat(item), []));
    const timeStop = performance.now();
    if (timeStop - timeStart > 5000) {
      logger.info(`Batch execution took ${timeStop - timeStart} milliseconds`);
      logger.info({
        queue: array
          .reduce((acc, item) => acc.concat(item), [])
          .map(item => {
            return {
              ...item,
              item: {
                ...item.item,
                walletId: undefined,
                xpub: undefined,
                zpub: undefined
              }
            };
          })
      });
    }
    await sleep(queueExecuteInterval);
    setIsExecutingTask(false);
  };

  const executeNextInQueue = queueExecutor;

  const updateAllExecutedItems = updateItemsInQueue;

  const updateQueueItems = (
    updateOperations: Array<{
      item: T;
      operation: 'remove' | 'update';
      updatedItem?: T;
    }>,
    allCompletedModulesSet: Set<string>
  ) => {
    setQueue(currentSyncQueue => {
      const duplicate = [...currentSyncQueue];

      for (const operation of updateOperations) {
        const index = duplicate.findIndex(elem => elem.equals(operation.item));
        if (index === -1) {
          logger.warn('Cannot find item index while updating sync queue');
          continue;
        }

        if (operation.operation === 'remove') {
          duplicate.splice(index, 1);
        } else if (operation.operation === 'update' && operation.updatedItem) {
          duplicate[index] = operation.updatedItem;
        }
      }

      const allCompletedModules: string[] = [];
      for (const [module] of allCompletedModulesSet.entries()) {
        if (duplicate.findIndex(elem => elem.module === module) === -1) {
          allCompletedModules.push(module);
        }
      }

      setModuleInExecutionQueue(currentModules => {
        const duplicateModules = [...currentModules];

        return duplicateModules.filter(
          elem => !allCompletedModules.includes(elem)
        );
      });

      return duplicate;
    });
  };

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  // Sets if the sync is 'on' or 'off'
  useEffect(() => {
    if (queue.length > 0) {
      if (connected && isInitialSetupDone) {
        if (isWaitingForConnection) {
          setWaitingForConnection(false);
        }

        setIsSyncing(true);
      } else if (isInitialSetupDone) {
        if (!isWaitingForConnection) {
          logger.info(`${name}: Waiting for internet`);
        }
        setWaitingForConnection(true);
      }
    } else {
      setIsSyncing(false);
    }
  }, [connected, isInitialSetupDone, queue]);

  // Execute the syncItems if it is syncing
  useEffect(() => {
    if (isSyncing && !isWaitingForConnection && !isExecutingTask) {
      executeQueue();
    }
  }, [isSyncing, isExecutingTask, isWaitingForConnection]);

  // queue execution performance logging
  useEffect(() => {
    if (queue.length > 0) {
      if (startTime.current > 0) {
        const peek = performance.now();
        if (peek - startTime.current > timeThreshold + offsetTime.current) {
          offsetTime.current = peek;
          logger.info(`${name}: Threshold exceeded at ${peek} milliseconds`);
          logger.info(`${name}: `, {
            queue: queue.slice(0, 3).map(item => {
              return {
                ...item,
                walletId: undefined,
                xpub: undefined,
                zpub: undefined
              };
            }),
            totalLength: queue.length
          });
        }
      } else {
        startTime.current = performance.now();
        const modules = Array.from(
          new Set(queue.map(elem => elem.module))
        ).join(',');
        logger.info(
          `${name}: started executing with ${queue.length} items, ${modules}}`
        );
      }
    } else {
      if (startTime.current > 0) {
        const stop = performance.now();
        logger.info(
          `${name}: Sync completed total time: ${
            stop - startTime.current
          } milliseconds`
        );
        offsetTime.current = 0;
        startTime.current = 0;
      }
    }
  }, [queue]);

  return {
    sleep,
    queueExecuteInterval,
    connected,
    connectedRef,
    isSyncing,
    setIsSyncing,
    isExecutingTask,
    setIsExecutingTask,
    isInitialSetupDone,
    setInitialSetupDone,
    isWaitingForConnection,
    queue,
    setQueue,
    modulesInExecutionQueue,
    setModuleInExecutionQueue,
    addToQueue,
    updateQueueItems
  } as UseExecutionQueueInterface<T>;
};
