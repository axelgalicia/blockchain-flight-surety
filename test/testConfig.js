
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        '0x442f137cae07fd6c7c62b0fad2e6e447dd765412',
        '0xfb735d642d2373ad12d55f416eaf70917532b3f2',
        '0x637883062856b76326ef1232e88356b42573b4f4',
        '0x562f9706bcb6a59ccc008b234b6463bcfb073be2',
        '0x323833d1c996e53a33fd1f38567544a7fd8f4d22',
        '0xbf51f68a553b12c6faced07d2636d49ab76b4e7e',
        '0x8044102ce738c58f189dce8499916f61e7e5eb67',
        '0x0bbd50e445877d481820981bc49b2699b6cf6d45',
        '0x65a1aede3cda88680a90e4858abae871a9608a27',
        '0xdd66b7a2c04c4ec4b76c0f4bccfb05deb856d8eb',
        '0xb976bd19311f670751e618c986f0351afaff679c',
        '0x9f1fabe4590ce38fffd7b5e40d95b9edeaa735c7',
        '0x79a8735dd380ead73adae705b1166e8307a7f6a2',
        '0x18d1265dc9b0050d0c88a0f61b0f0c755abcf670',
        '0x444786070742d0d9a5510e01612a763f675706ce',
        '0xfa318ecde39da45e3130f6c5e2edb9ef809aeaf5',
        '0x29fe8ade3e00f4ad3230f82456c03866843b2153',
        '0x05907be80231f19563662b4c1a76d7e0f3aa6919',
        '0x2d0f7fa196324066e92d9393016068e09557682a',
        '0x5293302a559e4f449ec903be070c0202087b5af8',
        '0xc58e5f02fc0a49c76002264da57652448da2c806',
        '0x2c897fab583f973cffa438e1f420796ab234dfd3',
        '0xd29edef1cac94a31140c92623f45e3c1252529ec',
        '0x37f4995694aa01206cc628f045e08e37071f2577',
        '0xa935e91a5eb2c0635a0b99c048a61734ac7954f0',
        '0x1998d81984912702fd65c01a84eaa1e8186a002b',
        '0x09b7d6ac80273c286505691da7743ba811a0401b',
        '0x3e78d32dc51cc2f5aeb78af7386e790dcbd2767b',
        '0x621a3ace652669dbee2581cf305a2b8d974f5d19',
        '0xd340bfe477cae0ab3a2615302e8570b73c35e5f7',
        '0x794cee426621295c837d61160221afbb1221f1dd',
        '0x2de6e1f2df1e94ed5fc0f390d2cc44246f1ac572',
        '0x935520dd68d42e9525ba739e31565b5c2a801517',
        '0x1c2c601040728699f46b69ac2d3b2a5e5f2a543b',
        '0x9fdfdf1e2b59a0926657ac844ce0f8352d38547f',
        '0xbecef938a91e34dd1c5507013023c9eac583f54d',
        '0x6ecd1198b7795b4920230ea7612ea0ee685028b3',
        '0xb81cd2850cc778ad70438c9d12f53a6a9a274b4c',
        '0xbd47a6c18782becefeace9d10a33ad66e830ec7b',
        '0x71d3e9851a98f498708881c561bd89e8e2076072',
        '0xd569c95db5a629b69afd11e31cd0ec1323edebd7',
        '0xfd0a81ff41d1609b0529077300fde021125e1ea4',
        '0xec1fbf83cee3213013a987ea7a607dcfc82d2672',
        '0xdb103277de79f657b4b9d5699d55ecb34762919e',
        '0x561d37b057daada82511e283916e42650e1597b0',
        '0x3128e87d38c5ba806a128e0484cbe5a3638c2d9c',
        '0x94ce36654d45aca6834e34346bfd1db678fb6ed2',
        '0x8eb07001613e3cc4a66bcffaf3ac833674624cab',
        '0x5e1d24e5f9bac16d30d25f08ed1d57b3fde01a82',
        '0x9f0f02147e34646591415fb5cad1d0821468dca1',
        '0x4d752976ef30f41dbef22117f8d4a093647b5de8',
        '0x7e1d802f1e508be32945565202859a0a3e6f6b65',
        '0xf09f0d85e7a2b2283ca4957b55774f2d90ef4508',
        '0x1e03c478a246548db4527530da006446b4574f6d',
        '0x3f614288b76baf5f2602eab81ec7b7b90f56f76f',
        '0x2c698a1fe9c06c7e09e5b2f394d8c18b3280d910',
        '0x40122419514ed26076c9e81243815268a94b64bd',
        '0x76c64f2b397486e3a9b5eade59ff0bd30e1825fb',
        '0x41342a7c38b5366164b37245051f6eb98e017cd9',
        '0xf1d3a14b5c8eb54d343589b9258f3b38bff022a0',
        '0x763b54b361db8389f6b68bffc790187f5687f093',
        '0x8dd80262570c56fa8414315a31f398b0333e2236',
        '0x881b8fa93ab644b603249098fb4cfc5a3773fe2a',
        '0xc3954ec713007217e44158a2626d66b35273bcbd',
        '0x99b0e9cb0c7becfd6a2e25992fdc7f5b8319c7d3',
        '0x0c58ad4fb58433375acfc69d6ab7d7d117e59d05',
        '0xa7094d585e62fc0b28dd43b508e7eb9c8f14dac7',
        '0xfc6eec19eae1eecc83dc6b0d8d905c4c13efa564',
        '0x9a2857bafe830e7363dc119c6358cb9d15d9c1c4',
        '0x0ba41428d25063db1d7f418f7a4040eae4226684',
        '0xd3118fd51f5f6708801f5a7040edd377d911f817',
        '0x0423c1aae89152efded2d66e34acaab212d22e9f',
        '0xb6696d3eb512e671f34c5af929608a3162b503a9',
        '0xba3e43a7d2419c1555a5c864defa85f1c7d627b4',
        '0x678d6171469faea2d43bfb639122aa1d5e3b74f8',
        '0x0e8dd271b69eb1c636d858869747a059b55e5266',
        '0x5dd170ca96849ae2b564900c6471cc21840c6f9d',
        '0x97344809fc9aaba0e60911970188791e8bd99faa',
        '0xddf4e8b2b7447ed9ae618cf73cd77508b6db5c0c',
        '0xaff4694834af542fd25ce6f984a1598f0c259568',
        '0xcae71d7f301481e0767e30841f266fb4e59cdd4d',
        '0x9e5482d774de2cdd36feae7e8ac7d89b54822f35',
        '0x1ab43ce9fe916ace6621063e5051ae839ca9575e',
        '0xe2f769adb4c15dd3d5ab01fb28884582915f9e5f',
        '0x7236a1e260ad4a66345f7e0093627766ad7558e2',
        '0xba0e76aff3fab6cc0f68563576bf29fc143b3c87',
        '0x116f84d66d2a25e7d99736587c38afdeb8696ab9',
        '0x4b20f3e5763c0bad0f747a0d3949be4b0d5232e6',
        '0x302c6154cd7e8e15c6a90add8a33fd0906689bd1',
        '0xc3504ed10715555e03413cb9e639481ac9fe8f7e',
        '0xb03a734a3365cc7f9277ae3591f85fc18ac858a7',
        '0xee4a28adebf08bb4ee3a495f76b1a341684e3dcb',
        '0x3bdf48b60f598e1bfb9624e6421e51adafe77042',
        '0x151f574e0a5f415fb86535fe1383479a651b1d44',
        '0xbd56d1528b24b6568e502735a9d09a249d6109b5',
        '0x00952e418b3e42e43be2b702304184ff186c5ec7',
        '0x0c53058878c88854bafc7b501857588819ea4b78',
        '0x669a6a05795d7086aef5cd94262754f12fef4c17',
        '0xb1a3129c250136b339de929d5522a4fbadbd370b',
        '0x10d98c0229e68d80a57d0db5815df45e70c5222c'
      ];


    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    
    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};