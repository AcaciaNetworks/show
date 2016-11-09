#!/usr/bin/env bash
rsync -av ./ root@api.cassianetworks.com:ichoice/

ssh root@api.cassianetworks.com "pm2 restart 2; pm2 logs 2"