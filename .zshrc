export ZSH="$HOME/.oh-my-zsh"
export JAVA_HOME=$(/usr/libexec/java_home)
ZSH_THEME="dracula"

ZSH_DISABLE_COMPFIX=true 
plugins=(git)
source $ZSH/oh-my-zsh.sh

alias zshconfig="code ~/.zshrc"
alias zshreset="source ~/.zshrc"
alias gitedit="vim ~/.gitconfig"
alias runMongo="mongod --dbpath ~/data/db"
alias startMongo="brew services start mongodb-community"
alias stopMongo="brew services stop mongodb-community"
alias runMongoInBackground="mongod --config /usr/local/etc/mongod.conf --fork"
alias isMongoRunning="ps aux | grep -v grep | grep mongod"
alias brewServices="brew services list"
alias config="/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME"

bindkey -v

bindkey '^P' up-history
bindkey '^N' down-history
bindkey '^?' backward-delete-char
bindkey '^h' backward-delete-char
bindkey '^w' backward-kill-word
bindkey '^r' history-incremental-search-backward
set -g mouse on



function zle-line-init zle-keymap-select {
	VIM_NORMAL="%{$FG[011]%} [% ~~ NORMAL ~~]%  %{$reset_color%}"
	VIM_INSERT="%{$FG[010]%} [% ~~ INSERT ~~]%  %{$reset_color%}"
    RPS1="${${KEYMAP/vicmd/$VIM_NORMAL}/(main|viins)/$VIM_INSERT}"
    RPS2=$RPS1
    zle reset-prompt
}

zle -N zle-line-init
zle -N zle-keymap-select
export KEYTIMEOUT=1

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
