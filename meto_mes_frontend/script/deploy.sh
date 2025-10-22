#!/bin/bash

MYSH_DIR=$(dirname $(realpath $BASH_SOURCE))
FRONTEND_DIR=${MYSH_DIR}/../
main(){
    # frontend
    cd ${FRONTEND_DIR}
    pnpm config set registry https://registry.npmmirror.com/
    pnpm install
    pnpm build
    sudo rm -rf /usr/share/nginx/html/LTS_MESv1
    mv LTS_MESv1 /usr/share/nginx/html/
}

main
