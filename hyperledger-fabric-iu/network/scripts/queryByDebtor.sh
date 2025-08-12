#!/usr/bin/env bash
set -euo pipefail
CC_NAME=${CC_NAME:-iu-basic}
CHANNEL=${CHANNEL:-financial-operations-channel}
DEBTOR=${1:-DEBTOR003}

docker exec cli peer chaincode query -C ${CHANNEL} -n ${CC_NAME} -c "{\"Args\":[\"QueryFinancialRecordsByDebtor\",\"${DEBTOR}\"]}" | jq .
