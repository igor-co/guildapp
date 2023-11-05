import type { NextPage } from 'next';
import { useContext, useEffect, useState } from 'react'
import { Button, Typography, TextField, Select, MenuItem } from '@mui/material';
import { GuildContext } from 'contexts/guildContext';
import { Cw3FlexMultisigNamedClient } from 'hooks/guildapp-ts/Cw3FlexMultisigNamed.client';
import { useSigningClient } from 'contexts/client';
import { Coin } from 'coreum/proto-ts/cosmos/base/v1beta1/coin';
import { tokensList } from 'util/constants';
import ProposalTxCreator from './proposalTxCreator';
  
/* 
TO FIX:
- continue FT issuance
- NFT (issuance & transfers)
- handle responses 


*/
const Proposal: NextPage = () => {
  const { signingClient, walletAddress } = useSigningClient()
  
  const ctx = useContext(GuildContext)
  const vaults = ctx?.guildVaults
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    msgs: [],
  });
//    action: "", // create || transfer (later could be added "mint, burn, freeze, unfreeze")
  const [msgs, setMsgs] = useState([])
  const [txModel, setTxModel] = useState<string>('none')
  const [success, setSuccess] = useState<string>('')
  const [vaultSelected, setVaultSelected] = useState<string>('')
  const [vaultBalance, setVaultBalance] = useState<Coin[]>([])

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  async function createProposal() {
    if (!vaults || !signingClient) return
    // change to the selected vault
    let v1
    if (vaultSelected) { 
      v1 = vaultSelected
    } else {
      v1 = vaults[0]
    }
    let msg = {
      title: formData.title,
      description: formData.description,
      msgs: msgs,
      latest: undefined
    }
    let client_o = new Cw3FlexMultisigNamedClient(signingClient, walletAddress, v1)
    let res = await client_o.propose(msg, "auto") 
    if (res) {
      setSuccess("your proposal has been created!")
    }
  }
  function addMsg(m: any) {
    console.log(`enters ${JSON.stringify(m)}`)
    setMsgs((msgs) => [...msgs, m])
  }
  async function getBalancesFT(vaultAddress: string) {
    for (let t = 0; t < tokensList.length; t++) {
      let tokenDenom = tokensList[t]
      let bal = await signingClient?.getBalance(vaultAddress, tokenDenom)
      if (bal) {
        //console.log(`getting FT's for ${vaultAddress} is ${JSON.stringify(bal)}`)
        //@ts-ignore
        setVaultBalance((vaultBalance) => [...vaultBalance, bal])
      }
    }
  }
  useEffect(() => {
    if (vaultSelected) {
      setVaultBalance([])
      getBalancesFT(vaultSelected)
    }
  }, [vaultSelected])

  return (
    <>
    <Typography variant="h4" gutterBottom>
      Proposal
    </Typography>
  
    <TextField
      margin="normal"
      label="Title"
      name="title"
      value={formData.title}
      onChange={handleInputChange}
    />
    <TextField
      margin="normal"
      label="Description"
      name="description"
      value={formData.description}
      onChange={handleInputChange}
    />

    {' '}from vault:{' '} 
    <Select
      value={vaultSelected}
      onChange={(e) => setVaultSelected(e.target.value)}
    >
      {vaults?.map((v) => {return(<MenuItem value={v}>{v}</MenuItem>)})}
    </Select>
    <hr />
    <ProposalTxCreator 
      vaultSelected={vaultSelected}
      vaultBalance={vaultBalance}
      setMsgs={(m)=>addMsg(m)} 
    />
    <hr />
    <Button
      style={{marginTop: "50px"}}
      onClick={() => createProposal()}
    >Launch proposal</Button>
    </>
  );
};

export default Proposal;
