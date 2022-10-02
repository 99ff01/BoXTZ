import './App.css';
import { TezosToolkit, OpKind } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { NetworkType } from "@airgap/beacon-sdk";
import React, { useState, useEffect } from 'react';
import { Button } from "@material-ui/core";
import axios from 'axios';
import CreateBox from './CreateBox.js';
import toast, { Toaster } from 'react-hot-toast';
import loading from './Infinity.svg';

const Tezos = new TezosToolkit("https://rpc.ghostnet.teztnets.xyz");
const wallet = new BeaconWallet({ name: "Tezos Secrets", preferredNetwork: NetworkType.CUSTOM });
const contractAddress = "KT1Tmo6GTcPztKxGxCRP6ptdHVjgH6kL1pTj";

Tezos.setWalletProvider(wallet);

function App() {
  const [activeAccount, setActiveAccount] = useState();

  const [boxes, setBoxes] = React.useState([]);
  const [tab, setTab] = React.useState(0);
  const [openingBox, setOpeningBox] = React.useState(false);


  useEffect(() => {
    async function getAcc() {

      if (activeAccount) {
        //console.log(activeAccount.address)
      } else {
        console.log(" trying to get active acc")
        setActiveAccount(await wallet.client.getActiveAccount());
      }
    }
    getAcc();
  }, [activeAccount]);

  useEffect(() => {
    async function getBoxes() {
      const response = await axios.get(
        `https://api.ghostnet.tzkt.io/v1/contracts/${contractAddress}/bigmaps/boxes/keys`
      );
      let boxes = response.data.reverse();
      console.log(boxes)



      for (let i = 0; i < response.data.length; i++) {
        for (let j = 0; j < response.data[i].value.tokens.length; j++) {
          let token = await axios.get(
            `https://api.ghostnet.tzkt.io/v1/tokens?contract=${response.data[i].value.tokens[j].cAddress}&&tokenId=${response.data[i].value.tokens[j].tokenId}`
          );
          console.log(token.data[0].metadata)

          boxes[i].value.tokens[j].metadata = token.data[0].metadata;

        }
      }
      console.log(boxes)

      setBoxes(boxes)
    }
    getBoxes();
  }, []);



  useEffect(() => {
    async function getTokens() {
      const response = await axios.get(
        `https://api.ghostnet.tzkt.io/v1/tokens/balances?account=tz1TCyS6Gp2JQo1XoSU2WMjqyjMz6iRdn8fD&&balance.ne=0`
      );
      console.log(response)
      console.log(response.data)

    }

    getTokens();
  }, []);

  async function sync() {
    try {
      const permissions = await wallet.client.requestPermissions({
        network: {
          type: NetworkType.CUSTOM,
          name: "Ghostnet",
          rpcUrl: "https://rpc.ghostnet.teztnets.xyz",
        },
      });
      console.log("Got permissions:", permissions.address);
      setActiveAccount(await wallet.client.getActiveAccount());
    } catch (error) {
      console.log("Got error:", error);
    }
  }

  async function unsync() {
    await wallet.clearActiveAccount();
    setActiveAccount(await wallet.client.getActiveAccount());
  }


  const createBox = async (price, tokens) => {

    const contract = await Tezos.wallet.at(contractAddress);
    console.log(price)
    console.log(tokens)

    let list = [];

    // add operators
    for (let i = 0; i < tokens.length; i++) {
      let tContract = await Tezos.wallet.at(tokens[i].cAddress);
      list.push(
        {
          kind: OpKind.TRANSACTION,
          ...tContract.methods.update_operators([{ add_operator: { operator: contractAddress, token_id: tokens[i].tokenId, owner: activeAccount.address } }])
            .toTransferParams({ amount: 0, mutez: true, storageLimit: 175 })
        }
      )
    }
    // ready to contract call
    list.push(
      {
        kind: OpKind.TRANSACTION,
        ...contract.methods.createBox(price, tokens).toTransferParams({ amount: 0, mutez: true })
      }
    )
    // remove operators
    for (let i = 0; i < tokens.length; i++) {
      let tContract = await Tezos.wallet.at(tokens[i].cAddress);
      list.push(
        {
          kind: OpKind.TRANSACTION,
          ...tContract.methods.update_operators([{ remove_operator: { operator: contractAddress, token_id: tokens[i].tokenId, owner: activeAccount.address } }])
            .toTransferParams({ amount: 0, mutez: true, storageLimit: 175 })
        },
      )
    }

    console.log(list)

    try {
      let batch = await Tezos.wallet.batch(list);
      const operation = await batch.send({ mutez: true, amount: price })

      const result = await operation.confirmation();
      const resultas = await contract.storage();
      console.log(result);
      console.log(resultas);
      toast('New box successfully created !')

    } catch (error) {
      console.log(error);
      toast('something unexpected happened, more details in console')
    }
  };

  return (
    <div>
      <Toaster />
      <div style={{ display: "flex" }}>
        <Button
          style={{
            border: "3px solid black",
            margin: 5
          }}
          fullWidth
          onClick={async () => {
            setTab(0)
          }}
        >
          EXPLORE
        </Button>

        <Button
          style={{
            border: "3px solid black",
            margin: 5
          }}
          fullWidth
          onClick={async () => {
            setTab(1)
          }}
        >
          Create Box
        </Button>


        <Button
          style={{
            border: "3px solid black",
            margin: 5
          }}
          fullWidth
          onClick={async () => {
            setTab(2)
          }}
        >
          ABOUT
        </Button>
        <Button
          style={{
            border: "3px solid black",
            margin: 5
          }}
          fullWidth
          onClick={async () => {
            setTab(3)
          }}
        >
          NFT FAUCET
        </Button>

        {//activeAccount && <div style={{ textAlign: "right", width: "100%", padding: 5 }}>{activeAccount.address}</div>
        }

        <Button
          style={{
            border: "3px solid black",
            margin: 5
          }}
          fullWidth
          onClick={async () => {
            if (activeAccount) {
              unsync()
            } else {
              sync()
            }
          }}
        >
          {activeAccount ? <div
            style={{ textAlign: "right", width: "100%", padding: 5, fontSize: "0.8em" }}>{activeAccount.address} unsync</div> : "sync"}
        </Button>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>

        <div style={{ width: "70vw", marginTop: 20 }}>

          {
            tab === 0 &&
            <div>
              <div>
                <br></br>
                {
                  boxes && boxes.map((box, index) => (
                    box.active &&
                    <div key={box.key} style={{ border: "4px black solid", marginBlock: 10 }}>
                      <div style={{ textAlign: "center" }}>
                        <h2>Box #{box.key}</h2>
                      </div>
                      <div style={{ display: "flex", paddingBlock: 10, margin: 10, justifyContent: "center" }}>
                        <div style={{ display: "flex", overflowY: "auto" }}>
                          {
                            box.value.tokens && box.value.tokens.map((token, index) => (
                              token.amount > 0 &&
                              <Button
                                key={token.id} style={{ border: "2px solid black", minWidth: "17.4vw", maxWidth: "17.4vw", maxHeight: "17.4vw" }}>
                                <div>
                                  {token.metadata.displayUri && <img style={{ width: "90%", maxHeight: "15.5vw" }} alt={token.metadata.title} src={token.metadata.displayUri.replace('ipfs://', 'https://ipfs.io/ipfs/')}></img>}
                                  <div style={{ textAlign: "center" }}>
                                    {(token.metadata) && token.metadata.name.length > 30 ? token.metadata.name.slice(4, 27) + "..." : token.metadata.name}({token.amount})
                                  </div>
                                </div>
                              </Button>

                            ))
                          }
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <Button style={{ border: "2px solid black" }}
                          onClick={async () => {
                            setOpeningBox(true)
                            const contract = await Tezos.wallet.at(contractAddress);
                            try {
                              const operation = await contract.methods.openBox(
                                box.key
                              ).send({ mutez: true, amount: box.value.price });

                              const result = await operation.confirmation();
                              const resultas = await contract.storage();
                              console.log(result);
                              console.log(resultas);


                              var newBoxes = [...boxes];
                              newBoxes.splice(index, 1);
                              setBoxes(newBoxes)

                              toast('Successfully opened the box !')
                              setOpeningBox(false)

                            } catch (error) {
                              console.log(error)
                              toast('failed to open box, check console for details')
                              setOpeningBox(false)
                            }
                          }}
                        >
                          {openingBox ? <img alt={"loading"} src={loading} style={{ height: 24.5 }}></img> : <>open for {box.value.price / 1000000} xtz</>}
                        </Button>
                      </div>


                      <br></br>
                      <div style={{ textAlign: "center" }}>
                        <b>seller: {box.value.owner}</b>
                      </div>


                    </div>

                  ))
                }
              </div>
            </div>
          }

          {
            tab === 1 &&
            <div>
              <CreateBox
                address={activeAccount && activeAccount.address}
                createBox={createBox}
              >

              </CreateBox>
            </div>
          }
          {
            tab === 2 &&
            <div>


              Collectibles gain more value if they are sold as a set just like pokemon cards. Imagine a box containing all NFT’s your favorite artist released.
              <br></br>
              <br></br>
              Another use for BoXTZ is that box creators can add their messages as an NFT, which is similar to author pre-signing books or putting souvenirs along with the main order as a gesture.
              <br></br>
              <br></br>
              Artists can benefit from BoXTZ by making the collecting process easier and faster for collectors.
              <br></br>
              <br></br>
              Overall BoXTZ aims to provide more options for both artists and collectors for trading their NFTs.

              <br></br>
              <br></br>
              <br></br>
              <b>backlog / roadmap:</b> <a href="https://whimsical.com/boxtz-GmWSy9iqjh5xhhD5dy8kxn@2Ux7TurymN7CSfRrhrF9"> https://whimsical.com/boxtz-GmWSy9iqjh5xhhD5dy8kxn@2Ux7TurymN7CSfRrhrF9</a>
              <br></br>
              <b>Contract Address:</b> KT1Tmo6GTcPztKxGxCRP6ptdHVjgH6kL1pTj
              <br></br>
              <a href="https://better-call.dev/ghostnet/KT1Tmo6GTcPztKxGxCRP6ptdHVjgH6kL1pTj/operations">https://better-call.dev/ghostnet/KT1Tmo6GTcPztKxGxCRP6ptdHVjgH6kL1pTj/operations</a>
              <br></br>
              <br></br>
              <br></br>
              <h2>How to Use</h2>

              <br></br>
              install temple wallet
              <br></br>
              get testnet tezos <a href=" https://faucet.ghostnet.teztnets.xyz/"> https://faucet.ghostnet.teztnets.xyz/</a>
              <br></br>
              mint testnet nfts from top "NFT FAUCET" tab
              <br></br>
              now ready to create a Box ! with "CREATE BOX tab"
              <br></br>
              select nfts you want to sell andd enter the price you want then create !
              <br></br>
              use explore tab to open boxes !
            </div>
          }
          {
            tab === 3 &&
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <Button style={{ border: "2px solid black" }}
                onClick={async () => {
                  const contract = await Tezos.wallet.at("KT1Pn5P6oiVBsZS2xZcq9aLr9wbymhw7WHtz");
                  try {
                    const operation = await contract.methods.mint_ZONK(
                      activeAccount.address,
                      10,
                      "697066733a2f2f516d4e54336951464479377a4c71747a4a6a383668743574546639535879316d3833466f577357795932666a7937",
                      100
                    ).send({ mutez: true, amount: 0 });

                    const result = await operation.confirmation();
                    const resultas = await contract.storage();
                    console.log(result);
                    console.log(resultas);


                  } catch (error) {
                    console.log(error)
                  }
                }}
              >
                <div>
                  <img src={"https://ipfs.io/ipfs/QmQ3mdCLzoQ1pVEFD1RvyvisDcPWj5CStzrFNAHmUs2c6E"} alt={"LUZI HAIKU"} style={{ width: "20vw" }}></img>
                  <br></br>
                  mint LUZI HAIKU x 10
                </div>
              </Button>
              <Button style={{ border: "2px solid black" }}
                onClick={async () => {
                  const contract = await Tezos.wallet.at("KT1Pn5P6oiVBsZS2xZcq9aLr9wbymhw7WHtz");
                  try {
                    const operation = await contract.methods.mint_ZONK(
                      activeAccount.address,
                      10,
                      "697066733a2f2f516d4e54336951464479377a4c71747a4a6a383668743574546639535879316d3833466f577357795932666a7937",
                      100
                    ).send({ mutez: true, amount: 0 });

                    const result = await operation.confirmation();
                    const resultas = await contract.storage();
                    console.log(result);
                    console.log(resultas);


                  } catch (error) {
                    console.log(error)
                  }
                }}
              >
                <div>
                  <img src={"https://ipfs.io/ipfs/QmdhMjXu7Q7AHguiwPDyqhwPWvsRWVtYVFCK5WwqRrRLer"} alt={"Doll House"} style={{ width: "20vw" }}></img>
                  <br></br>
                  mint Doll House x 10
                </div>
              </Button>
            </div>
          }

        </div>
      </div>
    </div>
  );
}

export default App;
