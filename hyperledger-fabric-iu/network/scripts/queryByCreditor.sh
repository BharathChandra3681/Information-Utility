#!/usr/bin/env bash
set -euo pipefail
CC_NAME=${CC_NAME:-iu-basic}
CHANNEL=${CHANNEL:-financial-operations-channel}
CREDITOR=${1:-CREDITOR003}

docker exec cli peer chaincode query -C ${CHANNEL} -n ${CC_NAME} -c "{\"Args\":[\"QueryFinancialRecordsByCreditor\",\"${CREDITOR}\"]}" | jq .
