import type { NextPage } from 'next';
import { useContext, useRef, useState } from 'react';
import { GuildContext } from 'contexts/guildContext';
import { useSigningClient } from 'contexts/client';

import { Paper, Avatar, Box, Typography, Link, Button } from '@mui/material';
import { Edit } from '@mui/icons-material';
import { Web3Storage } from "web3.storage";


import {AssetNFT as AssetNFTTx, NFT as NFTTx} from "../coreum/tx";
import { AuthContext } from 'contexts/AuthContext';

const UserProfile: NextPage = () => {
  const ctx = useContext(GuildContext);
  //console.log(`context is ${JSON.stringify(ctx)}`);

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
      symbol: "did",
      description: "The PIRaTeS BCN is a guild of elite warriors...",
      features:[0,3]
    })]).then((passed) => {
      console.log(passed)

    })
  }

  const mintNFT = (cidMetadata) => {
    const nftClassID = "did"+"-"+authContext.loggedAddress[0];

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
      "name": "patrick",
      "attributes": [
        {
          "trait_type": "Base",
          "value": "..."
        }
      ]
    }
    const blob = new Blob([JSON.stringify(content)], { type: 'application/json' })
    const file = new File([blob], 'user.json')

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
    const nftClassID = "did" +"-"+authContext.loggedAddress[0];
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
      <Typography variant="h4">My profile</Typography>
      <Button variant="contained" onClick={processMintNft}>
            Create Identifier NFT
          </Button>
          <input  id="mintFile" ref={fileRef} type="file" />
      <Paper sx={{ padding: '1rem', marginTop: '1rem' }}>
        <Box
          sx={{
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          {/* Avatar with Edit Icon */}
          <Box sx={{ position: 'relative' }}>
            <Avatar sx={{ width: 80, height: 80 }} />
            <Box sx={{ textAlign: 'left' }}>
              <Edit fontSize="small" />
            </Box>
          </Box>

          {/* Username */}
          <Typography variant="h6">Username</Typography>
          <Typography variant="body1">patrick.pirates8bcn</Typography>

          {/* Bio */}
          <Typography variant="h6">Bio</Typography>
          <Typography variant="body1">
            RPG gaming lover. Some of my favorite games are WOW and Final
            Fantasy XIV. I’m also a game developer and C# expert. I’m looking
            for new friends and communities to join, so feel free to message.
          </Typography>

          {/* Location */}
          <Typography variant="h6">Location</Typography>
          <Typography variant="body1">Spain</Typography>

          {/* Contacts */}
          <Box>
            <Typography variant="h6">Website</Typography>
            <Link
              href="http://www.patrick123.com"
              target="_blank"
              rel="noopener"
            >
              www.patrick123.com
            </Link>
          </Box>
          <Box>
            <Typography variant="h6">Discord</Typography>
            <Typography variant="body1">@patrick123</Typography>
          </Box>
          <Box>
            <Typography variant="h6">Telegram</Typography>
            <Typography variant="body1">@patrick123</Typography>
          </Box>
          <Box>
            <Typography variant="h6">Reddit</Typography>
            <Typography variant="body1">@patrick123</Typography>
          </Box>
        </Box>
      </Paper>
      <Button variant="contained" onClick={queryNFTs}>
            Check NFT
          </Button>
      <code>
            {nftList && JSON.stringify(nftList)}
              </code>
    </>
  );
};

export default UserProfile;
