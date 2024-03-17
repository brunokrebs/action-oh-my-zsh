#!/bin/bash 

sudo -u runner /bin/zsh -c "autoload -Uz compaudit; compaudit" | grep -v 'There are insecure directories:' > /tmp/compaudit_list.txt
sudo xargs -a /tmp/compaudit_list.txt chmod g-w
sudo xargs -a /tmp/compaudit_list.txt chmod a-w
