# Blockchain Weblearning - Hardhat 3

## Compile
```
npx hardhat build
```

<br><br>

## Local network deploy (external node)
Note: Local node can be unstable on some Windows setups. If it fails, use the built-in network deploy below.

Terminal 1 (start node):
```
npx hardhat node --hostname 127.0.0.1 --port 8545
```

Terminal 2 (deploy):
```
npx hardhat ignition deploy ignition/modules/CourseStack.ts --network localhost
```

<br><br>

## Built-in network deploy (in-process)
This uses an in-process Hardhat network. No node needed.
```
npx hardhat build
npx hardhat ignition deploy ignition/modules/CourseStack.ts
```

<br><br>

## Live deploy to Polygon Amoy
Prereqs (in .env):
- POLYGON_AMOY_RPC_URL
- PRIVATE_KEY

Deploy:
```
npx hardhat ignition deploy ignition/modules/CourseStack.ts --network amoy
```

<br><br>

## Package summary

### Contracts (packages/hardhat/contracts)
- CourseRegistry.sol: creates and updates course records (metadata CID, price, active).
- CoursePurchase.sol: handles MATIC payments and enrollments.
- CertificateNFT.sol: soulbound ERC721 certificate NFT with IPFS metadata.

### Tests (packages/hardhat/test)
- courseContracts.ts: unit tests for registry, purchase, and certificate behavior.

### Ignition modules (packages/hardhat/ignition/modules)
- CourseStack.ts: deploys CourseRegistry, CoursePurchase, CertificateNFT.

<br><br>

## How the frontend will connect later (summary)
- Deployments output addresses under packages/hardhat/ignition/deployments/chain-31337 (local) or chain-80002 (Amoy).
- ABI artifacts are produced by Hardhat during build; these are used by Ethers or Wagmi to call the contracts.
- The frontend will read the contract addresses + ABIs and connect via Wagmi/Ethers on the active chain.
- Course creation will call CourseRegistry.createCourse and store the metadata CID on-chain.
- Purchases will call CoursePurchase.buyCourse with MATIC and record enrollments.
- Certificates will call CertificateNFT.mintCertificate and set IPFS metadata.