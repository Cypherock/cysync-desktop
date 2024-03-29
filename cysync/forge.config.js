const windowsSigning = {};
if (process.env.WINDOWS_PFX_FILE && process.env.WINDOWS_PFX_PASSWORD) {
  windowsSigning.certificateFile = process.env.WINDOWS_PFX_FILE;
  windowsSigning.certificatePassword = process.env.WINDOWS_PFX_PASSWORD;
}
const config = {
  packagerConfig: {
    asr: true,
    icon: 'src/icon',
    appCopyright: 'Cypherock',
    appBundleId: 'com.hodl.cypherock',
    osxSign: {
      identity:
        'Developer ID Application: HODL Tech Private Limited (664633TYV2)',
      'hardened-runtime': true,
      entitlements: 'entitlements.plist',
      'entitlements-inherit': 'entitlements.plist',
      'signature-flags': 'library'
    },
    packagerConfig: {
      protocols: [
        {
          protocol: 'cypherock',
          name: 'cypherock',
          schemes: 'cypherock'
        }
      ]
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: 'src/icon.ico',
        iconUrl: 'https://www.cypherock.com/favicon.ico',
        title: 'Cypherock CySync',
        ...windowsSigning
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        // name: 'Cypherock CySync',
        contents: [
          {
            x: 500,
            y: 350,
            type: 'link',
            path: '/Applications'
          },
          {
            x: 192,
            y: 350,
            type: 'file',
            name: 'Cypherock Cysync.app',
            path: '${process.env.PWD}/out/cypherock-cysync-darwin-${process.arch}/cypherock-cysync.app'
          }
        ]
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        icon: 'src/icon.png',
        maintainer: 'Cypherock',
        homepage: 'https://cypherock.com',
        productName: 'Cypherock CySync',
        name: 'cypherock-cysync',
        mimeType: ['x-scheme-handler/cypherock']
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        icon: 'src/icon.png',
        maintainer: 'Cypherock',
        homepage: 'https://cypherock.com',
        productName: 'Cypherock CySync',
        name: 'cypherock-cysync'
      }
    },
    {
      name: '@electron-forge/maker-zip'
    }
  ],
  plugins: [
    [
      '@electron-forge/plugin-webpack',
      {
        mainConfig: './webpack.main.config.js',
        devContentSecurityPolicy: '',
        renderer: {
          nodeIntegration: true,
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/loading/index.html',
              js: './src/loading/index.ts',
              name: 'loading_window'
            },
            {
              html: './src/index.html',
              js: './src/renderer.ts',
              name: 'main_window'
            }
          ]
        }
      }
    ],
    [
      '@electron-forge/plugin-electronegativity',
      {
        output: 'security.sarif',
        isSarif: true
      }
    ]
  ]
};

if (process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD) {
  config.packagerConfig.osxNotarize = {
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD
  };
}

if (process.platform === 'win32') {
  config.packagerConfig.name = 'Cypherock CySync';
}

module.exports = config;
