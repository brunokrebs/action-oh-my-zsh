import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Octokit } from '@octokit/rest';
import * as github from '@actions/github';
import { exec } from '@actions/exec';
import  { createActionAuth } from '@octokit/auth-action';
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
core.info('Configure ssh');
core.info('====================================');
await exec('sudo -u runner mkdir -p /home/runner/.ssh');
const sshPath = path.join(os.homedir(), ".ssh");
fs.appendFileSync(path.join(sshPath, "config"), "Host *\nStrictHostKeyChecking no\nCheckHostIP no\n" +
      "TCPKeepAlive yes\nServerAliveInterval 30\nServerAliveCountMax 180\nVerifyHostKeyDNS yes\nUpdateHostKeys yes\n")

core.info('\n====================================');
core.info('Add authorized keys');
core.info('====================================');
const allowedUsers = core.getInput('allowed-github-users') ? core.getInput('allowed-github-users').split(',') : [];
if (core.getInput('allow-pr-owner') === 'true') {
  allowedUsers.push(github.context.actor);
}
const uniqueAllowedUsers = [...new Set(allowedUsers)]
if (!uniqueAllowedUsers.length) {
  core.setFailed('No allowed users');
  process.exit(1);
}
core.info(`Allowed users: ${uniqueAllowedUsers.join(',')}`);

const octokit = new Octokit({
  authStrategy: createActionAuth
});
const allowedKeys = [];
for (const allowedUser of uniqueAllowedUsers) {
  if (allowedUser) {
    try {
      let keys = await octokit.users.listPublicKeysForUser({
        username: allowedUser
      });
      for (const item of keys.data) {
        allowedKeys.push(item.key);
      }
    } catch (error) {
      core.info(`Error fetching keys for ${allowedUser}. Error: ${error.message}`);
    }
  }
}
const authorizedKeysPath = path.join(sshPath, "authorized_keys");

core.info(`Allowed keys: ${allowedKeys.join(',')}`);
fs.appendFileSync(authorizedKeysPath, allowedKeys.join('\n'));

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
fs.appendFileSync('/home/runner/.zshrc', 'source /home/runner/env_setup.sh');

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
