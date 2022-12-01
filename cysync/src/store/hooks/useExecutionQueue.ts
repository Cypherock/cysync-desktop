import React, { useEffect, useRef } from 'react';

import logger from '../../utils/logger';

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
  BATCH_SIZE: number;
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
  executeNextInQueue?: () => void;
  executeNextClientItemInQueue?: () => void;
  executeNextBatchItemInQueue?: () => void;
  updateAllExecutedItems?: (
    executionResults: Array<ExecutionResult<T>>
  ) => void;
}

export interface UseExecutionQueueOptions<T> {
  connection: boolean;
  executeInterval: number;
  nextBatchItemExecutor?: () => void;
  nextClientItemExecutor?: () => void;
  updateItemsInQueue?: (executionResults: Array<ExecutionResult<T>>) => void;
}

export type UseExecutionQueue = <T extends ExecutionQueueItem>({
  connection,
  executeInterval,
  nextBatchItemExecutor,
  nextClientItemExecutor,
  updateItemsInQueue
}: UseExecutionQueueOptions<T>) => UseExecutionQueueInterface<T>;

export const useSyncQueue: UseExecutionQueue = <T extends ExecutionQueueItem>({
  connection,
  executeInterval,
  nextBatchItemExecutor,
  nextClientItemExecutor,
  updateItemsInQueue
}: UseExecutionQueueOptions<T>) => {
  const BATCH_SIZE = 5;
  const [syncQueue, setSyncQueue] = React.useState<T[]>([]);
  const [modulesInExecutionQueue, setModuleInExecutionQueue] = React.useState<
    string[]
  >([]);

  const [isExecutingTask, setIsExecutingTask] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isWaitingForConnection, setWaitingForConnection] =
    React.useState(false);
  const [isInitialSetupDone, setInitialSetupDone] = React.useState(false);

  const queueExecuteInterval = executeInterval;

  const connected = connection;
  const connectedRef = useRef<boolean | null>(connected);

  const timeThreshold = 60000; // log every 1 minute
  const offsetTime = useRef(0);
  const startTime = useRef(0);

  const addToQueue = (item: T) => {
    setSyncQueue(currentSyncQueue => {
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

  const executeNextInQueue = async () => {
    setIsExecutingTask(true);
    const timeStart = performance.now();
    const array = await Promise.all([
      executeNextClientItemInQueue(),
      executeNextBatchItemInQueue()
    ]);
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

  const executeNextBatchItemInQueue = nextBatchItemExecutor;

  const executeNextClientItemInQueue = nextClientItemExecutor;

  const updateAllExecutedItems = updateItemsInQueue;

  const updateQueueItems = (
    updateOperations: Array<{
      item: T;
      operation: 'remove' | 'update';
      updatedItem?: T;
    }>,
    allCompletedModulesSet: Set<string>
  ) => {
    setSyncQueue(currentSyncQueue => {
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
    if (syncQueue.length > 0) {
      if (connected && isInitialSetupDone) {
        if (isWaitingForConnection) {
          setWaitingForConnection(false);
        }

        setIsSyncing(true);
      } else if (isInitialSetupDone) {
        setWaitingForConnection(true);
      }
    } else {
      setIsSyncing(false);
    }
  }, [connected, isInitialSetupDone, syncQueue]);

  // Execute the syncItems if it is syncing
  useEffect(() => {
    if (isSyncing && !isWaitingForConnection && !isExecutingTask) {
      executeNextInQueue();
    }
  }, [isSyncing, isExecutingTask, isWaitingForConnection]);

  // queue execution performance logging
  useEffect(() => {
    if (syncQueue.length > 0) {
      if (startTime.current > 0) {
        const peek = performance.now();
        if (peek - startTime.current > timeThreshold + offsetTime.current) {
          offsetTime.current = peek;
          logger.info(`Threshold exceeded at ${peek} milliseconds`);
          logger.info({
            queue: syncQueue.slice(0, 3).map(item => {
              return {
                ...item,
                walletId: undefined,
                xpub: undefined,
                zpub: undefined
              };
            }),
            totalLength: syncQueue.length
          });
        }
      } else {
        startTime.current = performance.now();
        logger.info(
          `Sync queue started executing with ${syncQueue.length} items`
        );
      }
    } else {
      if (startTime.current > 0) {
        const stop = performance.now();
        logger.info(
          `Sync completed total time: ${stop - startTime.current} milliseconds`
        );
        offsetTime.current = 0;
        startTime.current = 0;
      }
    }
  }, [syncQueue]);

  return {
    BATCH_SIZE,
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
    queue: syncQueue,
    setQueue: setSyncQueue,
    modulesInExecutionQueue,
    setModuleInExecutionQueue,
    addToQueue,
    executeNextInQueue,
    updateQueueItems
  } as UseExecutionQueueInterface<T>;
};
