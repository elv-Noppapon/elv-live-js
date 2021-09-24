const { ElvClient } = require("elv-client-js")
const Utils = require("elv-client-js/src/Utils.js")

const Ethers = require("ethers");
const fs = require('fs');
const path = require('path');

class EluvioLive {

  /**
   * Instantiate the EluvioLive SDK
   *
   * @namedParams
   * @param {string} tenantObjectId - The ID of the tenant specific EluvioLive object (optional)
   *
   * @return {EluvioLive} - New EluvioLive object connected to the specified content fabric and blockchain
   */
  constructor({
	configUrl,
	mainObjectId,
	tenantObjectId
  }) {

    this.configUrl = configUrl || ElvClient.main;
	this.mainObjectId = mainObjectId;

    this.debug = false;
  }

  async Init() {
	this.client = await ElvClient.FromConfigurationUrl({
      configUrl: this.configUrl
    });
	let wallet = this.client.GenerateWallet();
    let signer = wallet.AddAccount({
      privateKey: process.env.PRIVATE_KEY
    });
    this.client.SetSigner({signer});
	this.client.ToggleLogging(false);
  }

  /**
   * Show info about this NFT
   */
  async TenantShow({tenantId, libraryId, objectId, eventId, marketplaceId}) {

	const abiNft = fs.readFileSync("/Users/serban/ELV/CODE/contracts/dist/ElvTradable.abi");
	const abiTenant = fs.readFileSync("/Users/serban/ELV/CODE/contracts/dist/BaseTenantSpace.abi");

	var tenantInfo = {};

	console.log("Read EluvioLive tenant metadata");
	var m = await this.client.ContentObjectMetadata({
	  libraryId,
	  objectId,
	  metadataSubtree: "/public/asset_metadata",
	  select: "",
	  resolveLinks: true,
	  resolveIncludeSource: true,
	  resolveIgnoreError: true,
	  linkDepthLimit: 5
	});

	tenantInfo.marketplaces = {};
	for (var key in m.marketplaces) {
	  tenantInfo.marketplaces[key] = {};
	  tenantInfo.marketplaces[key].items = {}
	  for (var i in m.marketplaces[key].info.items) {

		const item = m.marketplaces[key].info.items[i];

		tenantInfo.marketplaces[key].items[i] = {};
		tenantInfo.marketplaces[key].items[i].name = item.name;
		tenantInfo.marketplaces[key].items[i].description = item.description;
		tenantInfo.marketplaces[key].items[i].mint_cauth = item.nft_template.mint.cauth_id;
		tenantInfo.marketplaces[key].items[i].nft_addr = item.nft_template.nft.address;
		tenantInfo.marketplaces[key].items[i].nft_template = item.nft_template["."].source;

		tenantInfo.marketplaces[key].items[i].sku = item.sku;

	  }
	}

	tenantInfo.sites = {};

	return tenantInfo;
  }

  /**
   * Show info about this NFT Template
   */
  async NftTemplateShow({object}) {

	// TODO

  }

  /**
   * TODO
   */
  async ListEvents({}) {
  }

  /**
   *
   * Create a new NFT contract (ElvTradable, ERC-721-based) and set it up for this tenant
   * - create a new contract
   * - add minter
   * - add NFT address to tenant 'tenant_nfts' group
   *
   * TODO: preflight - ensure signer is a tenant admin
   */
  async CreateNftContract({
	tenantId,
	mintHelperAddr,
	collectionName,
	collectionSymbol,
	contractUri,
	proxyAddress,
  	totalSupply
  }) {

	const abistr = fs.readFileSync(path.resolve(__dirname, "../contracts/v3/ElvTradable.abi"));
	const bytecode = fs.readFileSync(path.resolve(__dirname, "../contracts/v3/ElvTradable.bin"));

	var c = await this.client.DeployContract({
	  abi: JSON.parse(abistr),
	  bytecode: bytecode.toString('utf8').replace('\n', ''),
	  constructorArgs: [
		collectionName,
		collectionSymbol,
		contractUri || "",
		proxyAddress || "0x0000000000000000000000000000000000000000",
		0,
		totalSupply
	  ]
	});

	console.log("NFT contract address:", c.contractAddress);

	await this.NftAddMinter({addr: c.contractAddress, mintHelperAddr});
	console.log("- minter added", mintHelperAddr);

	await this.TenantAddNft({tenantId, nftAddr: c.contractAddress});
	console.log("- tenant_nfts added", tenantId);

	return c.contractAddress;
  }

  /**
   *  WIP
   */
  async ContractCallMintHelper(client) {

    const addrHelper = "0xf194bBC68369Fb140330570D822071f2A6949A77";
    const abi = fs.readFileSync("/Users/serban/ELV/CODE/contracts/dist/ElvTokenHelper.abi");

    const nft1 = "0xAB27731bb16C0B2cBCdaDD62Fb17e7b09CD387f3"; // beachball
    const user1 = "0xb6de95156c47bfe7f9414420e6e59b25f871f102"; // serban+elvmw@eluv.io

    const nft2 = "0xfC4C73C2b44dcF9e21cdc40a3e135a0e160a44c4";

    var res = await client.CallContractMethodAndWait({
      contractAddress: addrHelper,
      abi: JSON.parse(abi),
      methodName: "mintWithTokenURIMany",
      methodArgs: [
        [nft2],
        [user1],
        [770],
        [""]
      ],
      formatArguments: true
    });

    console.log(res);
  }

  /**
   *
   */
  async NftBalanceOf({addr, ownerAddr}) {

    const abi = fs.readFileSync("/Users/serban/ELV/CODE/contracts/dist/ElvTradable.abi");

    var res = await this.client.CallContractMethod({
      contractAddress: addr,
      abi: JSON.parse(abi),
      methodName: "balanceOf",
      methodArgs: [
		ownerAddr
      ],
      formatArguments: true
    });

	return res;
  }

  /**
   * Show info about this NFT
   */
  async NftShow({addr, ownerAddr}) {

	const abi = fs.readFileSync("/Users/serban/ELV/CODE/contracts/dist/ElvTradable.abi");
	var nftInfo = {};
    nftInfo.name = await this.client.CallContractMethod({
      contractAddress: addr,
      abi: JSON.parse(abi),
      methodName: "name",
      formatArguments: true
    });
    nftInfo.symbol = await this.client.CallContractMethod({
      contractAddress: addr,
      abi: JSON.parse(abi),
      methodName: "symbol",
      formatArguments: true
    });
    const totalSupply = await this.client.CallContractMethod({
      contractAddress: addr,
      abi: JSON.parse(abi),
      methodName: "totalSupply",
      formatArguments: true
    });
	nftInfo.totalSupply = Number(totalSupply);

	nftInfo.tokens = [];

	for (var i = 0; i < nftInfo.totalSupply; i ++) {
	  nftInfo.tokens[i] = {};
      nftInfo.tokens[i].tokenId = await this.client.CallContractMethod({
		contractAddress: addr,
		abi: JSON.parse(abi),
		methodName: "tokenByIndex",
		methodArgs: [i],
		formatArguments: true
      });
      nftInfo.tokens[i].owner = await this.client.CallContractMethod({
		contractAddress: addr,
		abi: JSON.parse(abi),
		methodName: "ownerOf",
		methodArgs: [nftInfo.tokens[i].tokenId],
		formatArguments: true
      });
	}

	return nftInfo;
  }

  /**
   *
   */
  async NftAddMinter({addr, mintHelperAddr}) {

	console.log("Add minter", addr, mintHelperAddr);
    const abi = fs.readFileSync("/Users/serban/ELV/CODE/contracts/dist/ElvTradable.abi");

    var res = await this.client.CallContractMethodAndWait({
      contractAddress: addr,
      abi: JSON.parse(abi),
      methodName: "addMinter",
      methodArgs: [
        mintHelperAddr
      ],
      formatArguments: true
    });
  }

  async TenantAddNft({tenantId, nftAddr}) {

    const abi = fs.readFileSync("/Users/serban/ELV/CODE/contracts/dist/BaseTenantSpace.abi");

	const addr = Utils.HashToAddress(tenantId);

    var res = await this.client.CallContractMethodAndWait({
      contractAddress: addr,
      abi: JSON.parse(abi),
      methodName: "addGroup",
      methodArgs: [
        "tenant_nfts",
		nftAddr
      ],
      formatArguments: true
    });
  }


  /**
   * Create a new NFT contract and set it in the NFT Template object's metadata.
   *
   */
  async NftTemplateAddNftContract({
	libraryId,
	objectId,
	nftAddr,
	tenantId,
	mintHelperAddr,
	collectionName,
	collectionSymbol,
	contractUri,
	proxyAddress,
  	totalSupply
  }) {

	console.log("Create NFT contract");

	if (nftAddr == null) {
	  nftAddr = await this.CreateNftContract({
		tenantId,
		mintHelperAddr,
		totalSupply,
		collectionName,
		collectionSymbol,
		contractUri,
		proxyAddress
	  });
	};

	// Update object metadata
	console.log("Update object metadata");
	var m = await this.client.ContentObjectMetadata({
	  libraryId,
	  objectId
	});

	m.permissioned.mint_private.address = nftAddr;
	m.public.asset_metadata.nft.address = nftAddr;
	m.public.asset_metadata.nft.total_supply = totalSupply;

	var e = await this.client.EditContentObject({
	  libraryId,
	  objectId
	});

	await this.client.ReplaceMetadata({
	  libraryId,
	  objectId,
	  writeToken: e.write_token,
	  metadata: m
	});

	var f = await this.client.FinalizeContentObject({
	  libraryId,
	  objectId,
	  writeToken: e.write_token,
	  commitMessage: "Set NFT contract address " + nftAddr
	});

	console.log("Finalized", f);

	return nftAddr;
  }

}

exports.EluvioLive = EluvioLive;
