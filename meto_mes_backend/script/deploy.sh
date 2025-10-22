fuser -k 3000/tcp || true
pnpm install
pnpm prisma generate 
nohup pnpm start > pnpm.log 2>&1 &
