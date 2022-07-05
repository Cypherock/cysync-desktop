import { CyError, ErrorsSet, getMap } from '../../errors';
import { useI18n } from '../provider';

export interface UseErrorValues {
  createError: (code: ErrorsSet, meta?: string) => CyError;
}
export type UseError = () => UseErrorValues;

export const useError: UseError = () => {
  const { langStrings } = useI18n();
  CyError.map = getMap(langStrings);

  const createError = (code: ErrorsSet, meta?: string) => {
    return new CyError(code, meta);
  };

  return { createError };
};
