import type { NextPage } from 'next';

import { useSigningClient } from 'contexts/client';

import {
  Box,
  Grid,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';

import { useContext, useRef, useState } from 'react';
import { GuildContext } from 'contexts/guildContext';

import styled from '@emotion/styled';

import { Web3Storage } from "web3.storage";


import {AssetNFT as AssetNFTTx, NFT as NFTTx} from "../coreum/tx";
import { AuthContext } from 'contexts/AuthContext';

const GuildProfile: NextPage = () => {
  const ctx = useContext(GuildContext);
  const { walletAddress, signingClient, coreumQueryClient } = useSigningClient();
  const authContext = useContext(AuthContext);
  let fileRef = useRef();
  const client = new Web3Storage({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFBNkEwNTZBYTc2NjZDMkZiMURjOEQ4RkQzMEExQzFmQjdmRTg5ZjkiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2OTgxNDQ3MDI3MDgsIm5hbWUiOiJlYmM5In0.yCE_2UaE2uGtu7DuVIP0KL-3o974k-v5aVmrGGnL1oc" });
  let cid = "";
  const [nftList, setNftList] = useState([])


  const sendTx = async (msgs: readonly EncodeObject[]) => {
    try {
      console.log("SendTx walletAddress " + authContext.loggedAddress[0])
      const resp = await signingClient
        ?.signAndBroadcast(authContext.loggedAddress[0], msgs, 'auto')
      console.log(`Tx hash: ${resp?.transactionHash}`)
      console.log(resp)

      return true
    } catch (error: any) {
      console.error(error)
      console.log(error)
      return false
    }
  }

  const createNFTClass = () => {
    sendTx([AssetNFTTx.MsgIssueClass({
      issuer: authContext.loggedAddress[0],
      symbol: ctx.guildContract.label,
      description: "The PIRaTeS BCN is a guild of elite warriors...",
      features:[0,3]
    })]).then((passed) => {
      console.log(passed)

    })
  }

  const mintNFT = (cidMetadata) => {
    const nftClassID = ctx.guildContract.label.toLowerCase() +"-"+authContext.loggedAddress[0];

    sendTx([AssetNFTTx.MsgMint({
      sender: authContext.loggedAddress[0],
      classId: nftClassID,
      id: `Id-${Date.now()}`,
      uri: cidMetadata,
      uriHash: "hash"
    })]).then((passed) => {
      if (passed) {
        queryNFTs()
      }
    })
  }
  async function uploadToIPFS(cidImage) {

    const content = {
      "description": "The PIRaTeS BCN is a guild of elite warriors...",
      "image": cidImage,
      "name": ctx.guildContract.label,
      "attributes": [
        {
          "trait_type": "Base",
          "value": "..."
        }
      ]
    }
    const blob = new Blob([JSON.stringify(content)], { type: 'application/json' })
    const file = new File([blob], 'guild.json')

    cid = await client.put([file]);

    console.log("Metadata: " +cid)

    return cid;
  }

  async function uploadImageToIPFS() {
    let cidImage = "";

    const fileInput = fileRef.current.files[0];

    cidImage = await client.put([fileInput]);

    console.log("Image: " + cidImage)

    return cidImage;

  }

  async function processMintNft(){
    createNFTClass();
    let cidImage = await uploadImageToIPFS();
    let cidMetada = await uploadToIPFS(cidImage);
    mintNFT(cidMetada)
  }

  const queryNFTs = () => {
    const nftClassID = ctx.guildContract.label.toLowerCase() +"-"+authContext.loggedAddress[0];
    coreumQueryClient?.NFTClient().NFTs({
      classId: nftClassID,
      owner: authContext.loggedAddress[0],
    }).then(async (res: QueryNFTsResponse) => {
      const nfts = await Promise.all(
        res.nfts.map(async (nft) => {
          const resOwner = await coreumQueryClient?.NFTClient().Owner({
            classId: nft.classId,
            id: nft.id
          })
          return {
            classId: nft.classId,
            id: nft.id,
            uri: nft.uri,
            uriHash: nft.uriHash,
            owner: resOwner.owner,
          }
        })
      )
      setNftList(nfts)
      console.log(nfts)
    })
      .catch((error) => {
        console.log("Query NFT's Error" + error)
      })
  }
  //queryNFTs();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Guild Profile
        <Button variant="contained" onClick={processMintNft}>
            Create Guild NFT
          </Button>
          <input  id="mintFile" ref={fileRef} type="file" />
      </Typography>
      <Box>
        <Paper>
          <Typography variant="h6">Name</Typography>
          <Typography>
            {ctx?.guildContract ? (
              ctx?.guildContract.label
            ) : (
              <CircularProgress />
            )}
          </Typography>

          <Typography variant="h6">Bio</Typography>
          <Typography>
            {/* Here, you can pull the description from your context or state. */}
            The PIRaTeS BCN is a guild of elite warriors...
          </Typography>

          <Typography variant="h6">Location</Typography>
          <Typography>Spain</Typography>

          <Typography variant="h6">Website</Typography>
          <Typography>www.patrick123.com</Typography>

          {/* You can continue to add more items for Discord, Telegram, Reddit, etc... */}
        </Paper>
        <Paper>
          <Typography variant="h6" gutterBottom>
            Members:
          </Typography>
          <li>
            {ctx?.guildMembers?.map((member) => (
              <ul key={member.name}>
                <Typography variant="h6" gutterBottom key={member.name}>
                  {member.name}
                </Typography>
              </ul>
            ))}
          </li>
        </Paper>
        <Button variant="contained" onClick={queryNFTs}>
            Check NFT
          </Button>
        <code>
            {nftList && JSON.stringify(nftList)}
              </code>
      </Box>
    </>
  );
};

export default GuildProfile;
