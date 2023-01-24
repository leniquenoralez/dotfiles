# import variable specific to workstation
if [ -f ~/.variables ]; then
    source ~/.variables
fi

ZSH_THEME="dracula"
plugins=(git)

source $ZSH/oh-my-zsh.sh

# import aliases specific to workstation
if [ -f ~/.aliases ]; then
    source ~/.aliases
fi

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


[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"

[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
