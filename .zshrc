# Path to oh-my-zsh installation.
export ZSH="/Users/noralezl/.oh-my-zsh"

export NVM_DIR=~/.nvm

source $(brew --prefix nvm)/nvm.sh

ZSH_THEME="dracula"

plugins=(git)

source $ZSH/oh-my-zsh.sh

tmuxDev(){

	DEFAULT_SESSION_NAME="WORKING_SESSION"

	[ -d $1 ]
	DIRECTORY_VALID=$?

	[ -n $2 ]
	SESSION_NAME_PROVIDED=$?

	if ((!$SESSION_NAME_PROVIDED)); then
		echo "Using $2 as session name!"
		SESSION_NAME=$2
	else 
		echo "No session name provided using $DEFAULT_SESSION_NAME!"
		SESSION_NAME=$DEFAULT_SESSION_NAME
	fi

	if ((!$DIRECTORY_VALID)); then
		echo "Setting session directory to $1"
		SESSION_DIR=$1
	else 
		echo "$1 is not valid directory!"
	fi

	## setup new tmux session
	if [[ ! "$TMUX" && $SESSION_NAME_PROVIDED && $DIRECTORY_VALID ]]; then
		echo "Tmux Session doesn't exists"
		cd $SESSION_DIR 
		tmux new-session -s $SESSION_NAME -d 
		tmux splitw -h 
		tmux splitw -v 
		tmux select-pane -t 0
		tmux attach-session
	else
		echo "tmux session already started"
	fi
}

alias config='/usr/local/bin/git --git-dir=$HOME/dotfiles/ --work-tree=$HOME'

alias wip="git add . && git commit -m 'wip [skip ci]'"
alias zshconfig="code ~/.zshrc"
alias zshreset="source ~/.zshrc"
alias serverLogin="sudo ssh $SERVER_CREDENTIALS"
alias gitedit="vim ~/.gitconfig"
alias startMongo="brew services start mongodb-community@4.2"
alias stopMongo="brew services stop mongodb-community@4.2"
alias runMongoInBackground="mongod --config /usr/local/etc/mongod.conf --fork"
alias isMongoRunning="ps aux | grep -v grep | grep mongod"

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



# The next line updates PATH for the Google Cloud SDK.
if [ -f '/Users/noralezl/google-cloud-sdk/path.zsh.inc' ]; then . '/Users/noralezl/google-cloud-sdk/path.zsh.inc'; fi

# The next line enables shell command completion for gcloud.
if [ -f '/Users/noralezl/google-cloud-sdk/completion.zsh.inc' ]; then . '/Users/noralezl/google-cloud-sdk/completion.zsh.inc'; fi
