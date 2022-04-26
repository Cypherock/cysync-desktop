## Introduction
The CySync application allows you to securly communicate with the Cypherock X1 hardware wallet for a multitude of things, like signing a transaction, sending and receiving coins, and managing and upgrading the hardware wallet.

### Responsible disclosure policy
At cypherock, we believe that coordinated vulnerability disclosure is the right approach to better protect users. When submitting a vulnerability report, you enter a form of coorporation in which you allow cypherock the opportunity to diagnose and remedy the vulnerability before disclosing its details to third parties and/or general public. We will ensure that you get proper credits for all your works

You should use PGP encrypted emails. Please use our [PGP public key](https://github.com/Cypherock/x1wallet_firmware/blob/main/0x70D75D95C3A16AA7.asc), as necessary. Start with a cleartext message with your public key, and we'll reply appropriately.

Please include:
- Code which reproduces the issue as a proof of concept.
- Detailed description and potential impact of your bug.
- Your name and link for attribution (or a comment if you don't want that).


## Table of contents
1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Run and Clean build](#run-and-clean-build)
4. [Run static analysis](#run-static-analysis)
5. [build packages after local changes](#build-packages-after-local-changes)
6. [Understanding the directory structure](#understanding-the-directory-structure)
7. [Application Flow and Packages](#application-flow-and-packages)
8. [Test and release builds](#test-and-release-builds)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)


## Prerequisites
Before you get started, please make sure you have the following setup -
- Node.js v14.18 (use [nvm][1] if already using a different Node version).
- [`yarn`][2]
- Python >=3.6
    - [Download][7] and install the latest Python version.
    - Run `npm config set python /path/to/executable/python` to configure.
- Install and set up [node-gyp][6] -
    - `npm i -g node-gyp` to install.
    - For Windows, follow an additional step -
        - Install Visual C++ Build Environment: [Visual Studio Build Tools][3] (using "Visual C++ build tools" workload) or [Visual Studio Community][4] (using the "Desktop development with C++" workload).
    - For more details, please refer to the [node-gyp documentation][5].


## Development Setup

> The repository contains submodules, which need to be downloaded as well.
Clone the repository along with its submodules using -
```sh
git clone git@gitlab.com:cypherock-tech/cycync-desktop.git --recurse-submodules
```
root: master
submodules: beta

## Run and clean build

Once you have cloned the repository, follow these steps -
```sh
cd cysync-desktop
yarn                # Install package dependencies

yarn start            # Launch the app in dev mode
```
clean build:
```
yarn make
```
> make by default packages the distributable to platform specific;<br> Output directory : `cysync/out/make`, to skip package: `--skip-package`


## Run static analysis

Runs the source with predefined rules and results in non functional errors.
```
yarn lint
```

## Build packages after local changes
### Prerequisite:

```
yarn install-pkgs # Runs `yarn` inside all submodules
```

***

To build all packages run in project root:
```
yarn build-pkgs # Builds all submodules and adds it to the cysync
```
To build individually, run in project root:
```
node build.js <PACKAGE_NAME>
```


## Understanding the directory structure
```
├── cysync              # Desktop application root directory
│   └── src             # Contains the core of the app
│       └── assets              # Static assets
│       └── components          # Reusable component directory
│       └── config              # Application theme preferences
│       └── constants           # Routes setup
│       └── designSystem            # Visual components used in the application
│           └── designComponents            # UI components definition
│           └── designConstants             # Default theme and UI config
│           └── genericComponents           # Custom UI components
│           └── iconGroups                  # Application icons
│       └── errorBoundary           # Error display cmoponent
│       └── mainProcess             # Modules for the Electron main process
│       └── pages                   # UI views for application flows
│           └── deviceStatePrompt           # UI view device connection status
│           └── initialApp                  # Initial setup flow (add device, set password etc.)
│           └── lockscreen                  # Application lock screen when password is set
│           └── mainApp                     # Contains sidebar items, app update, notifications
│       └── store                   # Contains most hooks, Context providers & database helpers
│           └── database                    # Database setup and helpers
│           └── hooks                       # Hooks for all flows and operations (eg. transactions and coin helpers)
│           └── providers                   # Context providers for different operations (notification, network, addCoin etc)
│       └── utils                   # Application-wide utility modules
│
├── packages            # Holds packages used by the desktop app
│   └── communication           # Handle low-level protocols and communication with the device
│   └── database                # Handles all database-related operations for the app
│   └── protocols               # Contains all device flows (e.g. add wallet, add/send/receive coins & upgrade)
│   └── server-wrapper          # Perform all to the server-related operations for the client
│   └── wallet                  # Perform blockchain-related tasks (fetching coins and generating receive addresses)
│
├── docs
│   └── CONTRIBUTING.md
│   └── DEVELOPMENT.md
├── package.json

```

- The root directory has two directories of concern - `cysync` and `packages`.
- The source code for the core desktop application is located in `cysync/app` directory.
- The `packages/` directory holds locally built dependencies for the desktop application.
- `cysync/app/index.tsx` is entry point of the application.


## Application Flow and Packages
An overview of various application flows and packages can be found in our [developer guidelines](docs/DEVELOPMENT.md).



## Troubleshooting
1. When making changes to a file that runs in the main process (e.g. *main.dev.ts*), make sure to restart the server to see changes in effect. This is because hot reloading works only for renderer processes and not the main process.
2. If launching the app gives an error similar to `@cypherock/communication` not found, run `yarn build-pkgs` from the project root.
3. If node-gyp throws build errors, try the following -
    1. Make sure Node is `v14.18.2`
    2. Update `node-sass` to the latest version with `yarn add node-sass`.
4. For the error - `TypeError: fs.rmSync is not a function`, upgrade to Node [`v14.18`][8] to fix.


## Test and release builds
###  <b>Development</b>
* The app runs on development env when you start the app using yarn start
* Here `NODE_ENV` is set to development.
* Certain features are disabled while on this mode including:
    * Disable crash report
    * Disable analytics
    * Refresh of balances/txns on startup
    * Real time API's (websockets etc)
### <b>Production</b>
* When the app runs after being packaged, i.e., when you run the app after installing from .exe, .dmg, .deb etc.
* Here `NODE_ENV` is set to production.
* Here all the features are enabled which were disabled on development.

<h3>Types of production builds</h3>

#### 1. Test build
* This build is only for internal testing.
* For creating this build, you need to export the `test` config in the file cysync/src/config.ts.
* The versions are in the format `1.x.x.test-stm.x`.
* Certain extra features are added here for easier testing. Ex:
    * You can skip the initial screen on the app entirely by using Ctrl + T. (Note: Initial screen is where you are asked to perform Card Auth, Device Auth and Device upgrade just after opening the app for the first time)
    * You can skip the initial screen incrementally by using Ctrl + S.
    * You can enable/disable mock device/card auth via General Setting.
    * You will have to add your custom firmware for device upgrade (app_dfu_package.bin) inside the app's user data folder.

#### 2. Release Build
* This build is for release.
* For creating this build, you need to export the `release` config in the file cysync/src/config.ts.
* All the extra features from Test Build are removed.
* The versions are in the format `1.x.x.beta-stm.x`.


## Contributing
Please consider making a contribution to the project. Contributions can include bug fixes, feature proposal, or optimizations to the current code. See our [contributing guidelines](docs/CONTRIBUTING.md) and submit a pull request to get started!


[1]: https://nodejs.org/en/download/package-manager/#nvm "How to use NVM"
[2]: https://classic.yarnpkg.com/lang/en/docs/install "Yarn documentation"
[3]: https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools "MS VS Build Tools"
[4]: https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community "MS VS Community"
[5]: https://github.com/nodejs/node-gyp "node-gyp documentation"
[6]: https://github.com/nodejs/node-gyp#on-windows "Configure node-gyp on Windows"
[7]: https://www.python.org/downloads "Download Python"
[8]: https://nodejs.org/api/fs.html#fsrmsyncpath-options "fs.rmSync was introduced in v14.14.0"
