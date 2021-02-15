const { assert } = require('chai');

const votingPower = artifacts.require('VotingPower');

require('chai')
    .use(require('chai-as-promised'))
    .should();

//helper function to convert human readble numbers to wei units
function tokens(n){
    return web3.utils.toWei(n, 'ether');    
}

contract ('SmartContract VotingPower', ([deployer, Bob, Lucy, Ed])=>{
    let contract;    

    before (async ()=>{
        contract = await votingPower.new('1000');        
        await contract.transfer(Bob, '20', {from : deployer});
        await contract.transfer(Lucy, '10', {from : deployer});
    })

    describe('\n Describe: Testing -> Basic deployment', async ()=>{
        let balance;
        it('Contract has a name', async ()=> {
            const name = await contract.name();
            assert.equal(name, 'Mock XRP');
        })
        it('Initial token transfer to Bob', async ()=> {            
            balance = await contract.balanceOf(Bob);            
            assert.equal(balance.toString(), '20');
        })      
        it('Initial token transfer to Lucy', async ()=> {            
            balance = await contract.balanceOf(Lucy);
            assert.equal(balance.toString(), '10');
        })      

    })

    describe ('\n Describe: Testing -> Delegate function', async () =>{
        it('Bob delegates 50% to Lucy', async () => {
            let rv, vp;            
            await contract.delegate(Lucy, '50', {from : Bob});
            vp = await contract.votePowerNow(Lucy);
            assert.equal(vp.toString(), '20', 'VotePower for Lucy should be 20');
            vp = await contract.votePowerNow(Bob);
            assert.equal(vp.toString(), '10', "VotePower for Bob should be 10");            

        })        

        it('Bob delegates 25% to Ed', async () => {
            let rv, vp;                      
            vp = await contract.votePowerNow(Ed);            
            assert.equal(vp.toString(), '5', 'VotePower for Ed should be 5');
            let dv = await contract.delegatedVotesNow(Bob);            
            assert.equal(dv.toString(), '15');
            vp = await contract.votePowerNow(Bob);            
            assert.equal(vp.toString(), '5', "VotePower for Bob should be 5");            

        })
        
    })

    describe ('\n Describe: Testing -> Remove Delegate', async () => {
        it ('Bob Removes delegation to Lucy', async ()=> {
            let dv, vp;  
            await contract.delegate(Lucy, '0', {from : Bob});
            vp = await contract.votePowerNow(Lucy);
            assert.equal(vp.toString(), '10', 'VotePower for Lucy after removed delegation should be 10');
            dv = await contract.delegatedVotesNow(Bob);
            assert.equal(dv.toString(), '0');
            vp = await contract.votePowerNow(Bob);
            assert.equal(vp.toString(), '20', "VotePower for Bob should be 20");            
        })
        /*
        it('Bob removes delegation to Ed', async () => {
            let rv, vp, dv;                      
            await contract.delegate(Ed, '0', {from : Bob});
            rv = await contract.receivedVotesNow(Ed);            
            assert.equal(rv.toString(), '0');
            vp = await contract.votePowerNow(Ed);            
            assert.equal(vp.toString(), '0');
            dv = await contract.delegatedVotesNow(Bob);            
            assert.equal(dv.toString(), '0');
            vp = await contract.votePowerNow(Bob);            
            assert.equal(vp.toString(), '20', "VotePower for Bob should be 20");            
        })
        */
    })
})

contract ('Testsuite for DelegateAt functions', ([deployer, Bob, Lucy, Ed])=>{
    let contract;    
    let block8, block95, block9, block10, block11, power, vp, rd, rv, balance, length, nowBlock, nowVotePower;
    
    before (async ()=>{               
        console.log('\n in 2nd Before -> new instance of contract\n');
        contract = await votingPower.new('1000');        

        await contract.transfer(Bob, '20', {from : deployer});
        balance = await contract.balanceOf(Bob);
        block8 = await contract.getCurrentBlock();
        console.log('-> Before: Deployer transfer 20 to Bob. Bob Balance:' + balance + ' at Block8: ' + block8);                
        length = await contract.checkPointLegthNow(Lucy);
        nowBlock = await contract.memberBlockNow(Lucy);
        nowVotePower = await contract.votePowerNow(Lucy);
        console.log('   CheckPoint Length(Lucy): ', length.toString() + ' nowBlock: ' + nowBlock + ' nowVotePower: ' + nowVotePower);

        await contract.transfer(Lucy, '10', {from : deployer});
        balance = await contract.balanceOf(Lucy);
        block9 = await contract.getCurrentBlock();
        console.log('-> Before: Deployer transfer 10 to Lucy. Lucy Balance:' + balance + ' at Block9: ' + block9);
        length = await contract.checkPointLegthNow(Lucy);
        nowBlock = await contract.memberBlockNow(Lucy);
        nowVotePower = await contract.votePowerNow(Lucy);
        console.log('   CheckPoint Length(Lucy): ', length.toString() + ' nowBlock: ' + nowBlock + ' nowVotePower: ' + nowVotePower);
                    
        await contract.delegate(Lucy, '50', {from : Bob});
        block10 = await contract.getCurrentBlock();
        rv = await contract.receivedVotesNow(Lucy);
        console.log('-> Before: Bob delegates 10 to Lucy. Lucy received votes:' + rv + '  at Block10: ' + block10);                        
        length = await contract.checkPointLegthNow(Lucy);
        nowBlock = await contract.memberBlockNow(Lucy);
        nowVotePower = await contract.votePowerNow(Lucy);
        console.log('   CheckPoint Length(Lucy): ', length.toString() + ' nowBlock:' + nowBlock + ' nowVotePower: ' + nowVotePower);

        await contract.transfer(Ed, '10', {from : deployer});        
        block11 = await contract.getCurrentBlock();        
        console.log('-> Before: Deployer sends 10 to Ed at block11: ' + block11);                        
        length = await contract.checkPointLegthNow(Lucy);
        nowBlock = await contract.memberBlockNow(Lucy);
        nowVotePower = await contract.votePowerNow(Lucy);
        console.log('   CheckPoint Length(Lucy): ', length.toString() + ' nowBlock:' + nowBlock + ' nowVotePower: ' + nowVotePower);

    })

    describe ('\n Describe: Testing -> VotePowerOfAt\n', async ()=> {        
        let step, passedBlock, foundBlock, length, balance, vp;
        it ('On block 9 Lucy has VotingPower = 10', async ()=>{
            result = await contract.balanceOfAt2(Lucy, block8);
            console.log('***balanceOfAt2(Lucy, block8) returned step: ' + result[0] + '  passedBlock: ' + result[1] + '  foundBlock: ' + result[2]);
            balance = await contract.balanceOfAt(Lucy, block8);            
            vp = await contract.votePowerOfAt(Lucy, block8);
            console.log('***balanceOfAt(Lucy, block8) returned:' + balance + ' and votePowerOfAt(Lucy, block8) returned: ' + vp);

            console.log('->Testing balanceOfAt from block9: ' + block9);
            length = await contract.checkPointLegthNow(Lucy);
            console.log('   CheckPointLength(Lucy): ', length.toString());
            power = await contract.votePowerOfAt(Lucy, block9);            
            console.log('   VotePowerOfAt(Lucy, block9): ' + power + ' for block9: ' + block9);
            balance = await contract.balanceOfAt(Lucy, block9);
            console.log('   balanceOfAt(Lucy, block9): ' + balance + ' for block9: ' + block9);
            result = await contract.balanceOfAt2(Lucy, block9);
            console.log('***balanceOfAt2(Lucy, block9) returned step: ' + result[0] + '  passedBlock: ' + result[1] + '  foundBlock: ' + result[2]);            result = await contract.balanceOfAt2(Lucy, block9);                        
            console.log('\n');
            balance = await contract.balanceOfAt(Lucy, block9);            
            vp = await contract.votePowerOfAt(Lucy, block9);
            console.log('***balanceOfAt(Lucy, block8) returned:' + balance + ' and votePowerOfAt(Lucy, block8) returned: ' + vp);
            //assert.equal(power.toString(), '10', 'Lucy VotePower should be 10');
        })

        it ('On block 10 Lucy has VotingPower = 20', async ()=>{
            result = await contract.balanceOfAt2(Lucy, block10);
            console.log('***balanceOfAt2(Lucy, block10) returned step: ' + result[0] + '  passedBlock: ' + result[1] + '  foundBlock: ' + result[2]);            
            console.log('\n');
            balance = await contract.balanceOfAt(Lucy, block10);            
            vp = await contract.votePowerOfAt(Lucy, block10);
            console.log('***balanceOfAt(Lucy, block10) returned:' + balance + ' and votePowerOfAt(Lucy, block10) returned: ' + vp);
            power = await contract.votePowerOfAt(Lucy, block10);  
            assert.equal(power.toString(), '20', 'Lucy VotePower should be 20');

        })
        
        it ('On block 11 Lucy has VotingPower = 20', async ()=>{
            balance = await contract.balanceOfAt(Lucy, block11);            
            vp = await contract.votePowerOfAt(Lucy, block11);
            console.log('***balanceOfAt(Lucy, block11) returned:' + balance + ' and votePowerOfAt(Lucy, block11) returned: ' + vp);
            power = await contract.votePowerOfAt(Lucy, block11);            
            assert.equal(power.toString(), '20', 'Lucy VotePower should be 20');
        })
        
    })
})
