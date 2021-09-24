const { ElvClient } = require("elv-client-js")
const { EluvioLive } = require("../src/EluvioLive.js")

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const networks = {
  "main": "https://main.net955305.contentfabric.io",
  "demo": "https://demov3.net955210.contentfabric.io",
  "demov3": "https://demov3.net955210.contentfabric.io",
  "test": "https://test.net955203.contentfabric.io"
};

var elvlv;

const Init = async () => {

  elvlv = new EluvioLive({
	configUrl: networks.demov3,
	mainObjectId: "iq__2gkNh8CCZqFFnoRpEUmz7P3PaBQG"
  });
  await elvlv.Init();

}

const CmfNftTemplateAddNftContract = async ({argv}) => {

  console.log("NFT Template - set contract",
			  argv.library, argv.object, argv.tenant, argv.minthelper, argv.cap, argv.name, argv.symbol,
			  argv.nftAddress)
  await Init();

  var c = await elvlv.NftTemplateAddNftContract({
	libraryId: argv.library,
	objectId: argv.object,
	//nftAddr,
	tenantId: argv.tenant,
	mintHelperAddr: argv.minthelper, //"0x59e79eFE007F5208857a646Db5cBddA82261Ca81",
	totalSupply: argv.cap,
	collectionName: argv.name,
	collectionSymbol: argv.symbol,
	contractUri: "",
	proxyAddress: ""
  })

}

const CmdNftBalanceOf = async ({argv}) => {

  console.log("NFT - call", argv.addr, argv.owner);

  await Init();

  var res = await elvlv.NftBalanceOf({
	addr: argv.addr,
	ownerAddr: argv.owner
  })

  console.log(res);
}

const CmdNftShow = async ({argv}) => {

  console.log("NFT - show", argv.addr);

  await Init();

  var res = await elvlv.NftShow({
	addr: argv.addr,
  })

  console.log(res);
}


yargs(hideBin(process.argv))

  .command('nft_add_contract <library> <object> <tenant> [minthelper] [cap] [name] [symbol] [nftaddr]',
		   'Add a new or existing NFT contract to an NFT Template object', (yargs) => {
			 yargs
			   .positional('library', {
				 describe: 'NFT Template library ID',
				 type: 'string'
			   })
			   .positional('object', {
				 describe: 'NFT Template object ID',
				 type: 'string'
			   })
			   .positional('tenant', {
				 describe: "Tenant ID",
				 type: 'string'
			   })
			   .option('minthelper', {
				 describe: "Mint helper address (hex)",
				 type: 'string'
			   })
			   .option('cap', {
				 describe: "NFT total supply cap",
				 type: 'number'
			   })
			   .option('name', {
				 describe: "NFT collection name",
				 type: 'string'
			   })
			   .option('symbol', {
				 describe: "NFT collection symbol",
				 type: 'string'
			   })
			   .option('nftaddr', {
				 describe: "NFT contract address (will not create a new one)",
				 type: 'string'
			   })
		   }, (argv) => {

			 CmfNftTemplateAddNftContract({argv});

		   })

  .command('nft_balance_of <addr> <owner>',
		   'Call NFT ownerOf - determine if this is an owner', (yargs) => {
			 yargs
			   .positional('addr', {
				 describe: 'NFT address (hex)',
				 type: 'string'
			   })
			   .positional('owner', {
				 describe: 'Owner address to check (hex)',
				 type: 'string'
			   })
		   }, (argv) => {

			 CmdNftBalanceOf({argv});

		   })

  .command('nft_show <addr>',
		   'Show info on this NFT', (yargs) => {
			 yargs
			   .positional('addr', {
				 describe: 'NFT address (hex)',
				 type: 'string'
			   })
		   }, (argv) => {

			 CmdNftShow({argv});

		   })

  .help()
  .demandCommand(1)
  .argv
