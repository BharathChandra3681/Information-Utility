'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { InformationUtilityContract } = require('../index.js');
const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;

describe('InformationUtilityContract', () => {
    let contract;
    let ctx;
    let stub;

    beforeEach(() => {
        contract = new InformationUtilityContract();
        ctx = sinon.createStubInstance(Context);
        stub = sinon.createStubInstance(ChaincodeStub);
        ctx.stub = stub;
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('#InitLedger', () => {
        it('should initialize the ledger with sample data', async () => {
            stub.putState.resolves();
            
            const result = await contract.InitLedger(ctx);
            
            expect(stub.putState).to.have.been.calledTwice;
            expect(result).to.equal('Information Utility ledger initialized successfully');
        });
    });

    describe('#CreateInformationRecord', () => {
        it('should create a new information record', async () => {
            const id = 'TEST001';
            const dataType = 'Identity';
            const owner = 'TestUser';
            const data = JSON.stringify({ name: 'Test User', id: '123' });
            const accessLevel = 'restricted';
            const permissions = JSON.stringify(['iu-gov', 'iu-data']);

            stub.getState.resolves(Buffer.from(''));
            stub.putState.resolves();
            stub.setEvent.resolves();

            const result = await contract.CreateInformationRecord(ctx, id, dataType, owner, data, accessLevel, permissions);
            
            expect(stub.putState).to.have.been.calledOnce;
            expect(stub.setEvent).to.have.been.calledOnce;
            
            const parsedResult = JSON.parse(result);
            expect(parsedResult.id).to.equal(id);
            expect(parsedResult.dataType).to.equal(dataType);
            expect(parsedResult.owner).to.equal(owner);
        });

        it('should throw error if record already exists', async () => {
            const id = 'EXISTING001';
            
            stub.getState.resolves(Buffer.from(JSON.stringify({ id: 'EXISTING001' })));

            await expect(contract.CreateInformationRecord(ctx, id, 'Identity', 'User', '{}', 'public', '[]'))
                .to.be.rejectedWith(`Information record ${id} already exists`);
        });
    });

    describe('#ReadInformationRecord', () => {
        it('should return an information record', async () => {
            const id = 'TEST001';
            const record = { id, dataType: 'Identity', owner: 'TestUser' };
            
            stub.getState.resolves(Buffer.from(JSON.stringify(record)));

            const result = await contract.ReadInformationRecord(ctx, id);
            
            expect(JSON.parse(result)).to.deep.equal(record);
        });

        it('should throw error if record does not exist', async () => {
            const id = 'NONEXISTENT001';
            
            stub.getState.resolves(Buffer.from(''));

            await expect(contract.ReadInformationRecord(ctx, id))
                .to.be.rejectedWith(`Information record ${id} does not exist`);
        });
    });

    describe('#UpdateInformationRecord', () => {
        it('should update an existing information record', async () => {
            const id = 'TEST001';
            const existingRecord = {
                id,
                dataType: 'Identity',
                owner: 'TestUser',
                data: { name: 'Old Name' },
                timestamp: '2023-01-01T00:00:00.000Z'
            };
            const newData = JSON.stringify({ name: 'New Name' });

            stub.getState.resolves(Buffer.from(JSON.stringify(existingRecord)));
            stub.putState.resolves();
            stub.setEvent.resolves();

            const result = await contract.UpdateInformationRecord(ctx, id, newData);
            
            expect(stub.putState).to.have.been.calledOnce;
            expect(stub.setEvent).to.have.been.calledOnce;
            
            const parsedResult = JSON.parse(result);
            expect(parsedResult.data.name).to.equal('New Name');
            expect(parsedResult.verificationStatus).to.equal('updated');
        });

        it('should throw error if record does not exist', async () => {
            const id = 'NONEXISTENT001';
            
            stub.getState.resolves(Buffer.from(''));

            await expect(contract.UpdateInformationRecord(ctx, id, '{}'))
                .to.be.rejectedWith(`Information record ${id} does not exist`);
        });
    });

    describe('#VerifyInformationRecord', () => {
        it('should verify an information record', async () => {
            const id = 'TEST001';
            const verifierOrg = 'iu-gov';
            const existingRecord = {
                id,
                permissions: ['iu-gov', 'iu-data'],
                verificationStatus: 'pending'
            };

            stub.getState.resolves(Buffer.from(JSON.stringify(existingRecord)));
            stub.putState.resolves();
            stub.setEvent.resolves();

            const result = await contract.VerifyInformationRecord(ctx, id, verifierOrg);
            
            const parsedResult = JSON.parse(result);
            expect(parsedResult.verificationStatus).to.equal('verified');
            expect(parsedResult.verifiedBy).to.equal(verifierOrg);
        });

        it('should throw error if organization does not have permission', async () => {
            const id = 'TEST001';
            const verifierOrg = 'unauthorized-org';
            const existingRecord = {
                id,
                permissions: ['iu-gov', 'iu-data']
            };

            stub.getState.resolves(Buffer.from(JSON.stringify(existingRecord)));

            await expect(contract.VerifyInformationRecord(ctx, id, verifierOrg))
                .to.be.rejectedWith(`Organization ${verifierOrg} does not have permission to verify this record`);
        });
    });

    describe('#GrantAccess', () => {
        it('should grant access to an organization', async () => {
            const id = 'TEST001';
            const organization = 'new-org';
            const existingRecord = {
                id,
                permissions: ['iu-gov']
            };

            stub.getState.resolves(Buffer.from(JSON.stringify(existingRecord)));
            stub.putState.resolves();
            stub.setEvent.resolves();

            const result = await contract.GrantAccess(ctx, id, organization);
            
            const parsedResult = JSON.parse(result);
            expect(parsedResult.permissions).to.include(organization);
        });

        it('should not duplicate permissions if organization already has access', async () => {
            const id = 'TEST001';
            const organization = 'iu-gov';
            const existingRecord = {
                id,
                permissions: ['iu-gov', 'iu-data']
            };

            stub.getState.resolves(Buffer.from(JSON.stringify(existingRecord)));

            const result = await contract.GrantAccess(ctx, id, organization);
            
            const parsedResult = JSON.parse(result);
            expect(parsedResult.permissions.filter(org => org === organization)).to.have.length(1);
        });
    });

    describe('#RevokeAccess', () => {
        it('should revoke access from an organization', async () => {
            const id = 'TEST001';
            const organization = 'iu-data';
            const existingRecord = {
                id,
                permissions: ['iu-gov', 'iu-data', 'iu-service']
            };

            stub.getState.resolves(Buffer.from(JSON.stringify(existingRecord)));
            stub.putState.resolves();
            stub.setEvent.resolves();

            const result = await contract.RevokeAccess(ctx, id, organization);
            
            const parsedResult = JSON.parse(result);
            expect(parsedResult.permissions).to.not.include(organization);
            expect(parsedResult.permissions).to.have.length(2);
        });
    });
});
