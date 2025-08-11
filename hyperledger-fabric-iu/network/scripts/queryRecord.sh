#!/usr/bin/env bash
# Query a financial record
set -euo pipefail
REC_ID=${1:-LOAN003}
CC_NAME=${CC_NAME:-iu-basic}
CHANNEL=${CHANNEL:-financial-operations-channel}

docker exec cli peer chaincode query -C ${CHANNEL} -n ${CC_NAME} -c "{\"Args\":[\"ReadFinancialRecord\",\"${REC_ID}\"]}" | jq . || true
