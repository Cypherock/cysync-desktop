import { DeviceErrorType } from '@cypherock/communication';
import { WalletErrorType } from '@cypherock/wallet';

import { CysyncError } from './types';

type ErrorsSet = CysyncError | DeviceErrorType | WalletErrorType;
interface ErrorObject {
  parent?: ErrorsSet;
  message: string;
}
type codeToErrorMap = {
  [key in ErrorsSet]-?: ErrorObject;
};

const map: codeToErrorMap = {
  [DeviceErrorType.CONNECTION_CLOSED]: {
    parent: DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW,
    message: 'Device connection closed'
  },
  [DeviceErrorType.CONNECTION_NOT_OPEN]: {
    parent: DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW,
    message: 'Device connection not open'
  },
  [DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW]: {
    message: ''
  },
  DS_CONN_3001: undefined,
  DS_CONN_3002: undefined,
  DS_CONN_2001: undefined,
  HD_SEC_0001: undefined,
  HD_UACT_1504: undefined,
  DS_MISC_5505: undefined,
  HD_UACT_1505: undefined,
  HD_FIRM_5001: undefined,
  HD_FIRM_5002: undefined,
  HD_FIRM_5501: undefined,
  DS_MISC_5506: undefined,
  HD_COM_1001: undefined,
  HD_COM_1002: undefined,
  DS_MISC_5504: undefined,
  HD_UACT_1501: undefined,
  HD_OPS_1001: undefined,
  HD_OPS_1002: undefined,
  HD_OPS_1005: undefined,
  HD_OPS_1006: undefined,
  HD_OPS_1007: undefined,
  HD_OPS_1008: undefined,
  DS_MISC_5508: undefined,
  HD_OPS_1011: undefined,
  HD_OPS_1004: undefined,
  HD_OPS_1003: undefined,
  CRD_SEC_1001: undefined,
  HD_OPS_1010: undefined,
  HD_UACT_1502: undefined,
  HD_OPS_5250: undefined,
  HD_OPS_5251: undefined,
  HD_OPS_5252: undefined,
  HD_OPS_1501: undefined,
  DS_MISC_5509: undefined,
  CRD_SEC_5500: undefined,
  DS_MISC_5507: undefined,
  DS_OPTS_1001: undefined,
  HD_UACT_1510: undefined,
  HD_UACT_1511: undefined,
  HD_UACT_1512: undefined,
  HD_UACT_1513: undefined,
  HD_UACT_1519: undefined,
  DS_OPTS_1005: undefined,
  DS_OPTS_1007: undefined,
  DS_OPTS_1003: undefined,
  DS_OPTS_1002: undefined,
  DS_MISC_5501: undefined,
  HD_OPS_1502: undefined,
  DS_OPTS_2500: undefined,
  DS_OPTS_1510: undefined,
  DS_OPTS_1511: undefined,
  DS_OPTS_1507: undefined,
  DS_MISC_5502: undefined,
  HD_INIT_2100: undefined,
  HD_INIT_2101: undefined,
  HD_INIT_2102: undefined,
  HD_INIT_2103: undefined,
  HD_INIT_2104: undefined,
  HD_INIT_2106: undefined,
  HD_INIT_5501: undefined,
  SYS_VER_1011: undefined,
  SYS_VER_1012: undefined,
  SYS_VER_1013: undefined,
  HD_MISC_2001: undefined,
  HD_UACT_1506: undefined,
  HD_MISC_1002: undefined,
  HD_MISC_1001: undefined,
  HD_UACT_1503: undefined,
  CRD_SEC_1005: undefined,
  CRD_SEC_1004: undefined,
  DS_SYNC_1001: undefined,
  DS_SYNC_3001: undefined,
  DS_SYNC_5501: undefined,
  DS_SYNC_5502: undefined,
  DS_SYNC_5503: undefined,
  DS_SYNC_1002: undefined,
  DS_MISC_5503: undefined,
  HD_INIT_1001: undefined,
  HD_COM_1007: undefined,
  HD_COM_1050: undefined,
  HD_COM_1051: undefined,
  HD_COM_1052: undefined,
  HD_FIRM_1001: undefined,
  HD_FIRM_1002: undefined,
  HD_FIRM_1003: undefined,
  HD_FIRM_1004: undefined,
  HD_FIRM_1005: undefined,
  HD_FIRM_1006: undefined,
  HD_INIT_2006: undefined,
  HD_COM_5500: undefined,
  HD_COM_5001: undefined,
  HD_COM_5002: undefined,
  DS_OPTS_1011: undefined,
  DS_OPTS_1010: undefined
};

class DisplayError {
  protected code: string;
  protected message: string;
  public isSet: boolean;
  constructor(code: string, message: string) {
    this.isSet = Boolean(code && message);
    this.code = code;
    this.message = message;
  }
  /**
   * used to display errors to the user
   * @returns formatted error string
   */
  public showError() {
    if (this.isSet) return this.getCode() + ' : ' + this.getMessage();
    return '';
  }
  /**
   * Use this only when the error message text is needed
   * @returns error message
   */
  public getMessage() {
    return this.message || '';
  }
  /**
   * Use this only when the error code is needed
   * @returns error code
   */
  public getCode() {
    return this.code || '';
  }
}
/* tslint:disable-next-line */
class CyError extends DisplayError {
  public childErrors: DisplayError[];
  constructor(code?: ErrorsSet, message?: string) {
    super(code, message);
    if (code && message === undefined) {
      const parentError = map[code].parent;
      if (parentError) {
        this.setError(parentError, map[parentError].message);
      }
    }
    this.childErrors = [];
  }
  public setError(code: string, message: string) {
    this.isSet = true;
    this.code = code;
    this.message = message;
  }
  public pushSubErrors(code: string, message: string) {
    this.childErrors.push(new DisplayError(code, message));
  }
}

export { DisplayError, CyError };
