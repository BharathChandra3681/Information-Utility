'use strict';

const LoanContract = require('./lib/loan-contract');
const GovernanceContract = require('./lib/governance-contract');

module.exports.LoanContract = LoanContract;
module.exports.GovernanceContract = GovernanceContract;
module.exports.contracts = [LoanContract, GovernanceContract];
