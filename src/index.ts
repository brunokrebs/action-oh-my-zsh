import * as core from '@actions/core';
// import github from '@actions/github';
import { exec } from '@actions/exec';
import { nanoid } from 'nanoid'
import { getTunnelsWithTimeout } from './get-tunnels';

core.info('\n====================================');
core.info('Install openssh-server and zsh');
core.info('====================================');
await exec('sudo apt-get update');
await exec('sudo apt-get install -y openssh-server zsh');
await exec('wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz');
await exec('tar -xvzf ngrok-v3-stable-linux-amd64.tgz');
await exec('sudo mv ngrok /usr/local/bin/');
await exec(`echo "PasswordAuthentication yes" | sudo tee -a /etc/ssh/sshd_config`);
await exec('sudo service ssh start');

core.info('\n====================================');
core.info('Generate random password and set as runner password');
core.info('====================================');
// const password = nanoid();
await exec(`echo "runner:brunooo" | sudo chpasswd`);
core.info(`Runner password: brunooo`);

core.info('\n====================================');
core.info('Install oh-my-zsh and set ZSH as default shell for runner');
core.info('====================================');
await exec('sudo -u runner sh -c "cd /home/runner && curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh | sh"');
await exec('sudo chsh -s /bin/zsh runner');

core.info('\n====================================');
core.info('Fix compinit issues')
core.info('====================================');
await exec('wget -q https://raw.githubusercontent.com/brunokrebs/action-oh-my-zsh/main/bin/fix-compinit.sh');
await exec('chmod +x fix-compinit.sh');
await exec('./fix-compinit.sh');

core.info('\n====================================');
core.info('Append env_setup.sh to .zshrc')
core.info('====================================');
await exec('echo "source /home/runner/env_setup.sh" | sudo tee -a /home/runner/.zshrc')

core.info('\n====================================');
core.info('Start Ngrok')
core.info('====================================');
const ngrokToken = core.getInput('ngrok-auth-token');
await exec(`ngrok authtoken ${ngrokToken}`);
await exec('/bin/bash', ['-c', 'ngrok tcp 22 &']);
await exec('sleep 10');

core.info('\n====================================');
core.info('Get Ngrok URL')
core.info('====================================');
const tunnelsResponse = await getTunnelsWithTimeout();
const url = tunnelsResponse.tunnels[0]?.public_url;
core.info(`Ngrok URL: ${url}`);
