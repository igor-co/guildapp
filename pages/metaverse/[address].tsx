import { useEffect, useState, useCallback, useLayoutEffect } from 'react'
import { Unity, useUnityContext } from "react-unity-webgl";
import { useRouter } from 'next/router';


//NFTs
import { useSigningClient } from 'contexts/client';
import { QueryNFTsResponse } from 'hooks/coreum-ts/coreum/nft/v1beta1/query';


const Metaverse = () => {
  const { walletAddress, signingClient, coreumQueryClient } = useSigningClient();
  const router = useRouter();
  const [guildAddress, setGuildAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [nftsU, setNftsU] = useState<string | null>(null);
  const [numNft, setNumNfts] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!guildAddress) {
      let address = router.query.address;
      if (typeof address == 'string') {
        setGuildAddress(address);
      }
    }
  }, [router]);

  // Comunication to Unity
  const [isReady, setIsReady] = useState(false);
  const [isChangePage, setIsChangePage] = useState(false);


  const { unityProvider, addEventListener, removeEventListener, sendMessage } =
    useUnityContext({
      loaderUrl: '../unity/Build/clientBuild.loader.js',
      dataUrl: '../unity/Build/clientBuild.data',
      frameworkUrl: '../unity/Build/clientBuild.framework.js',
      codeUrl: '../unity/Build/clientBuild.wasm',
    });


  // ---- Unity is Ready to comunicate ----

  const handleReady = useCallback((_ready) => {
    setIsReady(!!_ready);
  }, []);

  useEffect(() => {
    addEventListener('Ready', handleReady);
    return () => {
      removeEventListener('Ready', handleReady);
    };
  }, [addEventListener, removeEventListener, handleReady]);

  useEffect(() => {
    if (isReady) {
      if (guildAddress) {
        getMembers(guildAddress);
      }

      walletName ? sendMessage("CanvasHUD", "setName", walletName) : sendMessage("CanvasHUD", "setName", "Unknown"); // ????
      

      /// TODO: Get the NFTs info from the function and contrcut the array with [{NftHash, uriImage?},...]
      GetNFTs();
    }
  }, [isReady]);

  useEffect(() => {

    sendMessage("CanvasHUD", "setNFTNumber", numNft);
    sendMessage("CanvasHUD", "setNFTs", nftsU);

  }, [numNft, numNft]);

  function sendGuildName(name) {
    sendMessage("CanvasHUD", "setName", name);
  }

  function sendNFTnum(num) {
    sendMessage("CanvasHUD", "setNFTNumber", num);
  }

  function sendNFTs(value) {
    sendMessage("CanvasHUD", "setNFTs", value);
  }

  //---- Change page to management page -----

  const handleChangePage = useCallback((_changePage) => {
    setIsChangePage(!!_changePage);
  }, []);

  useEffect(() => {
    if (isChangePage) {
      router.push(`/management/${guildAddress}`)
    }
  }, [isChangePage]);

  useEffect(() => {
    addEventListener("ChangePage", handleChangePage);
    return () => {
      removeEventListener("ChangePage", handleChangePage);
    };
  }, [addEventListener, removeEventListener, handleChangePage]);

  //----Wallet Name------------

  useEffect(() => {
    if (walletName == null && guildAddress) {
      getMembers(guildAddress);
      //console.log("109 Aqui llega");
    }
  }, [walletName, guildAddress]);

  async function getMembers(address: string) {
    console.log("getMembers:::");
    let membersMsg = {
      list_members: {
        start_after: null,
        limit: null,
      },
    };

    console.log("122:::", signingClient);
    if (signingClient) {
      let membersList = await signingClient.queryContractSmart(
        address,
        membersMsg,
      );
      if (membersList.members) {
        membersList.members.forEach(m => {
          console.log("128::", m);
          if (m.addr == walletAddress) {
            console.log("129::", m?.name);
            setWalletName(m?.name);
          }
        });
      } else {
        setError('No members could be found');
      }
    }
  }


  //---------- NFTs ----------------

  function GetNFTs() {
    const nftClassID = "testclass2-testcore1pcf50v775jlky863sws00qlqyttq6v62r885ph"
    coreumQueryClient?.NFTClient().NFTs({
      classId: nftClassID,
      owner: "testcore1pcf50v775jlky863sws00qlqyttq6v62r885ph",
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
      //return nfts;
      // nftTotal = nfts;
      // console.log("nfts are ",nfts); // Todo: How to return that to send to Unity

      setNumNfts(nfts.length);
      setNftsU(JSON.stringify(nfts));
      console.log("nft numbers", numNft, nfts.length);
      console.log("nft strings ", nftsU, JSON.stringify(nfts));
    });
    // .catch((error) => {
    //   console.log("Query NFT's Error" + error)
    // }).then(() => { return nftTotal; })
  }


  return <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignContent: 'center' }}><Unity style={{ minWidth: "92vw", minHeight: "92vh" }} unityProvider={unityProvider} /> </div>;
};

export default Metaverse;
