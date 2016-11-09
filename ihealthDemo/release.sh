#!/usr/bin/env bash
rsync -av ./ root@demo.cassianetworks.com:/root/ihealth

ssh root@demo.cassianetworks.com "pm2 restart ihealth; pm2 logs ihealth"