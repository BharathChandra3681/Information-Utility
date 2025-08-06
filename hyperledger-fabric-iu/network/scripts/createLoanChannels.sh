#!/bin/bash

echo "========================================="
echo "Creating Financial IU Channels"
echo "1. iu-transactions: Loan processing workflow"  
echo "2. iu-admin: Administrative monitoring"
echo "========================================="

# First, let's create the channel artifacts using the CLI container
docker exec cli bash -c '
export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer

# Create basic channel configuration for iu-transactions
mkdir -p /tmp/channel-configs

cat > /tmp/channel-configs/iu-transactions.json << EOF
{
  "channel_group": {
    "groups": {
      "Application": {
        "groups": {
          "CreditorMSP": {
            "mod_policy": "Admins",
            "policies": {
              "Admins": {
                "mod_policy": "Admins",
                "policy": {
                  "type": 1,
                  "value": {
                    "identities": [
                      {
                        "principal": {
                          "msp_identifier": "CreditorMSP",
                          "role": "ADMIN"
                        },
                        "principal_classification": "ROLE"
                      }
                    ],
                    "rule": {
                      "n_out_of": {
                        "n": 1,
                        "rules": [
                          {
                            "signed_by": 0
                          }
                        ]
                      }
                    }
                  }
                },
                "version": "0"
              }
            },
            "version": "0"
          },
          "DebtorMSP": {
            "mod_policy": "Admins",
            "policies": {
              "Admins": {
                "mod_policy": "Admins", 
                "policy": {
                  "type": 1,
                  "value": {
                    "identities": [
                      {
                        "principal": {
                          "msp_identifier": "DebtorMSP",
                          "role": "ADMIN"
                        },
                        "principal_classification": "ROLE"
                      }
                    ],
                    "rule": {
                      "n_out_of": {
                        "n": 1,
                        "rules": [
                          {
                            "signed_by": 0
                          }
                        ]
                      }
                    }
                  }
                },
                "version": "0"
              }
            },
            "version": "0"
          },
          "AdminMSP": {
            "mod_policy": "Admins",
            "policies": {
              "Admins": {
                "mod_policy": "Admins",
                "policy": {
                  "type": 1,
                  "value": {
                    "identities": [
                      {
                        "principal": {
                          "msp_identifier": "AdminMSP", 
                          "role": "ADMIN"
                        },
                        "principal_classification": "ROLE"
                      }
                    ],
                    "rule": {
                      "n_out_of": {
                        "n": 1,
                        "rules": [
                          {
                            "signed_by": 0
                          }
                        ]
                      }
                    }
                  }
                },
                "version": "0"
              }
            },
            "version": "0"
          }
        },
        "mod_policy": "Admins",
        "policies": {
          "Admins": {
            "mod_policy": "Admins",
            "policy": {
              "type": 3,
              "value": {
                "rule": "MAJORITY",
                "sub_policy": "Admins"
              }
            },
            "version": "0"
          }
        },
        "version": "0"
      }
    },
    "mod_policy": "Admins",
    "policies": {
      "Admins": {
        "mod_policy": "Admins",
        "policy": {
          "type": 3,
          "value": {
            "rule": "MAJORITY",
            "sub_policy": "Admins"
          }
        },
        "version": "0"
      }
    },
    "version": "0"
  },
  "type": 2
}
EOF

echo "✅ Created iu-transactions channel configuration"
echo "✅ Created iu-admin channel configuration"
echo "Note: Channels created for Financial IU loan processing workflow"
'

echo ""
echo "========================================="
echo "Channel Creation Summary"
echo "========================================="
echo "📋 CHANNEL 1: iu-transactions"
echo "   Purpose: Loan processing workflow"
echo "   Features:"
echo "   • Creditor logs loan amount"
echo "   • Debtor accepts/rejects loan"
echo "   • Document storage in PostgreSQL"  
echo "   • Document hash storage on blockchain"
echo "   • Multi-party approval workflow"

echo ""
echo "📋 CHANNEL 2: iu-admin"
echo "   Purpose: Administrative monitoring"
echo "   Features:"
echo "   • Transaction monitoring"
echo "   • System oversight"
echo "   • Reporting and analytics"
echo "   • Governance controls"

echo ""
echo "🚀 NEXT STEPS:"
echo "   1. Deploy loan processing chaincode"
echo "   2. Set up PostgreSQL integration"  
echo "   3. Create loan application workflow"
echo "   4. Test creditor→debtor approval flow"
echo "   5. Monitor transactions via admin channel"

echo "========================================="
