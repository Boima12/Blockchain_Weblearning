# Blockchain Weblearning - Hardhat 3

## Compile
```
npx hardhat build
```

<br><br>

## Live deploy
```
npx hardhat ignition deploy ignition/modules/Counter.ts --network amoy
```

<br><br>

## Local network deploy
> Local network deploy is very UNSTABLE, sometime can deploy and sometime don't, use Built-in network deploy as last resort

In terminal 1, make sure the path is .\packages\hardhat (in the hardhat project folder)
```
npx hardhat node
```

In terminal 2, make sure the path is .\packages\hardhat (in the hardhat project folder)
```
npx hardhat ignition deploy ignition/modules/fileName.ts --network localhost
```

<br><br>

## Built-in network deploy

In terminal 1, make sure the path is .\packages\hardhat (in the hardhat project folder):
```
npx hardhat build
npx hardhat ignition deploy ignition/modules/fileName.ts
```