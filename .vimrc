call plug#begin()
Plug 'junegunn/fzf'
Plug 'junegunn/fzf.vim'
Plug 'morhetz/gruvbox'
Plug 'jlanzarotta/bufexplorer'
Plug 'preservim/nerdtree'
call plug#end()

filetype plugin on
autocmd vimenter * ++nested colorscheme gruvbox
set number
syntax enable

set hlsearch
set relativenumber
set runtimepath^=~/.vim/bundle/ctrlp.vim
set shiftwidth=4
set softtabstop=4
set expandtab
set spell

let g:ctrl_map = '<c-p>'
let g:ctrl_cmd = '<CtrlP>'
let g:ctrlp_working_path_mode = 'ra'
set wildchar=<Tab> wildmenu wildmode=full

nnoremap <leader>n :NERDTreeFocus<CR>
nnoremap <C-n> :NERDTree<CR>
nnoremap <C-t> :NERDTreeToggle<CR>
nnoremap <C-f> :NERDTreeFind<CR>

" TODO: auto compelet
" TODO: symbol search
" Ctrl-P search
" Search entire project for keyword
" symbol rename
" Autocorrect
" Vue snippets
" React Snippets
" JS Snippets
" Git Support
" NerdTree Icons
