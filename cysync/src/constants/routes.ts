const routes = {
  portfolio: {
    index: '/'
  },
  wallet: {
    index: '/wallet'
  },
  transactions: {
    index: '/transactions'
  },
  settings: {
    index: '/settings',
    general: {
      index: '/settings/general'
    },
    about: {
      index: '/settings/about'
    },
    device: {
      index: '/settings/device',
      upgrade: '/settings/device/upgrade',
      auth: '/settings/device/auth',
      cardAuth: '/settings/device/cardAuth',
      errorReport: '/settings/device/errorReport'
    }
  },
  tutorial: {
    index: '/tutorial'
  }
};

export default routes;
