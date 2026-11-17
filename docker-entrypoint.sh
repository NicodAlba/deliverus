#!/bin/sh
set -eu
# Railway mounts volumes as root. Prepare the mount, then run Express as node.
mkdir -p /data/public
chown node:node /data /data/public
exec gosu node "$@"
