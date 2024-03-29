set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 16
npm install yarn -g
rm -rf ./cysync/node_modules
yarn install
yarn install-pkgs
node scripts/prebuild.js
yarn install
yarn build-pkgs
yarn make
nvm deactivate
nvm uninstall 16
