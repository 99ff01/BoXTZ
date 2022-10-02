import React, { useEffect } from 'react';
import { Button, TextField } from "@material-ui/core";
import axios from 'axios';
import loading from './Infinity.svg';

function CreateBox({ address, createBox }) {
    const [selectedTokens, setSelectedTokens] = React.useState([]);
    const [tokens, setTokens] = React.useState([]);
    const [price, setPrice] = React.useState("");
    const [creatingBox, setCreatingBox] = React.useState(false);

    useEffect(() => {
        console.log(address)

        //get tokens 
        async function getTokens() {
            const response = await axios.get(
                `https://api.ghostnet.tzkt.io/v1/tokens/balances?account=${address}&&balance.ne=0`
            );
            console.log(response)
            console.log(response.data)
            if (response.data) {
                setTokens(response.data)
            }
        }
        getTokens();
    }, [address]);

    return (
        <div>
            <div style={{ border: "5px solid green", padding: 3 }}>
                <div style={{ textAlign: "center" }}>
                    select tokens you want to sell and fill the box
                </div>
                <div style={{ display: "flex", overflowY: "auto", paddingBlock: 10, margin: 10 }}>
                    {
                        selectedTokens && selectedTokens.map((token, index) => (
                            token.balance > 0 &&
                            <Button key={token.id} style={{ border: "2px solid black", minWidth: "17.4vw", maxWidth: "17.4vw", maxHeight: "17.4vw" }}
                                onClick={() => {
                                    let found = false;

                                    for (let i = 0; i < tokens.length; i++) {
                                        if (tokens[i].token.contract.address === token.token.contract.address && tokens[i].token.tokenId === token.token.tokenId) {
                                            setTokens(
                                                [
                                                    ...tokens.slice(0, i),
                                                    {
                                                        ...token,
                                                        balance: tokens[i].balance + 1,
                                                    },
                                                    ...tokens.slice(i + 1)
                                                ]
                                            );
                                            found = true;
                                        }
                                    }

                                    if (!found) {
                                        setTokens(tokens.concat([{ ...token, balance: 1 }]))
                                    }

                                    setSelectedTokens(
                                        [
                                            ...selectedTokens.slice(0, index),
                                            {
                                                ...token,
                                                balance: token.balance - 1,
                                            },
                                            ...selectedTokens.slice(index + 1)
                                        ]
                                    )
                                }}
                            >
                                <div>
                                    {token.token.metadata.displayUri && <img style={{ width: "90%", maxHeight: "15.5vw" }} alt={token.token.metadata.name} src={token.token.metadata.displayUri.replace('ipfs://', 'https://ipfs.io/ipfs/')}></img>}
                                    <div style={{ textAlign: "center" }}>
                                        {(token.token && token.token.metadata) && token.token.metadata.name.length > 30 ? token.token.metadata.name.slice(4, 27) + "..." : token.token.metadata.name}({token.balance})
                                    </div>
                                </div>
                            </Button>

                        ))
                    }
                </div>

                <div style={{ display: "flex", justifyContent: "center" }}>

                    <TextField
                        label="Enter price"
                        variant="outlined"
                        value={price}
                        onChange={
                            (event) => {
                                setPrice(event.target.value);
                            }
                        }
                    >
                    </TextField>

                    <Button
                        style={{
                            border: "1px solid black",
                            margin: 5
                        }}
                        onClick={async () => {
                            setCreatingBox(true)
                            console.log("price")
                            console.log(price)

                            console.log("mutez")
                            let mutez = parseFloat(price) * 1000000;
                            console.log(mutez)

                            let wrappedTokens = [];
                            selectedTokens.forEach(token => {
                                wrappedTokens.push(
                                    {
                                        cAddress: token.token.contract.address,
                                        tokenId: token.token.tokenId,
                                        amount: token.balance
                                    }
                                )
                            });

                            console.log(wrappedTokens)

                            await createBox(
                                mutez,
                                wrappedTokens
                            );
                            setSelectedTokens([]);
                            setPrice("");
                            setCreatingBox(false)
                        }}
                    >
                        {creatingBox ? <img alt={"loading"} src={loading} style={{ height: 24.5 }}></img> : "create box"}
                    </Button>
                </div>
            </div>
            <br></br>
            <br></br>
            <br></br>
            <div style={{ border: "3px solid darkblue" }}>
                {
                    tokens && tokens.map((token, index) => (
                        token.balance > 0 &&
                        <Button
                            key={token.id}
                            style={{ border: "2px solid black", width: "17.4vw", height: "17.4vw" }}
                            onClick={() => {
                                let found = false;

                                for (let i = 0; i < selectedTokens.length; i++) {
                                    if (selectedTokens[i].token.contract.address === token.token.contract.address && selectedTokens[i].token.tokenId === token.token.tokenId) {
                                        setSelectedTokens(
                                            [
                                                ...selectedTokens.slice(0, i),
                                                {
                                                    ...token,
                                                    balance: selectedTokens[i].balance + 1,
                                                },
                                                ...selectedTokens.slice(i + 1)
                                            ]
                                        );
                                        found = true;
                                    }
                                }

                                if (!found) {
                                    setSelectedTokens(selectedTokens.concat([{ ...token, balance: 1 }]))
                                }

                                setTokens(
                                    [
                                        ...tokens.slice(0, index),
                                        {
                                            ...token,
                                            balance: token.balance - 1,
                                        },
                                        ...tokens.slice(index + 1)
                                    ]
                                )
                            }}
                        >
                            <div>
                                {token.token && token.token.metadata && token.token.metadata.displayUri && <img alt={token.token.metadata.name} style={{ width: "90%", maxHeight: "15.5vw" }} src={token.token.metadata.displayUri.replace('ipfs://', 'https://ipfs.io/ipfs/')}></img>}
                                <div style={{ textAlign: "center" }}>
                                    {token.token && token.token.metadata && (token.token.metadata.name.length > 30 ? token.token.metadata.name.slice(4, 27) + "..." : token.token.metadata.name)}({token.balance})
                                </div>
                            </div>
                        </Button>

                    ))
                }
            </div>
        </div >
    );
}

export default CreateBox;