import type { NextPage } from 'next';
import { useContext, useEffect, useState } from 'react'
import { Button, Typography, TextField, Select, MenuItem } from '@mui/material';
import { GuildContext } from 'contexts/guildContext';
import { Cw3FlexMultisigNamedClient } from 'hooks/guildapp-ts/Cw3FlexMultisigNamed.client';
import { useSigningClient } from 'contexts/client';
import { Coin } from 'coreum/proto-ts/cosmos/base/v1beta1/coin';
import { tokensList } from 'util/constants';
import { MsgIssue } from 'coreum/proto-ts/coreum/asset/ft/v1/tx';
import { FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox } from "@mui/material"
/* 
TO FIX:
- continue FT issuance

- Add tx generator
- handle response 


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
  const [txIssueForm, setTxIssueForm] = useState({
    subunit: '',
    symbol: '',
    precision: 18,
    initialAmount: "0",
    features: [1, 0],
    sendCommissionRate: '0'
  })
  const [txTransferForm, setTxTransferForm] = useState({    // transfers only
    type: "",   // ft || nft
    token: '',  // token denom
    amount: 0,
    destination: '',
  })
  const [msgs, setMsgs] = useState([])
  const [txModel, setTxModel] = useState<string>('none')
  const [success, setSuccess] = useState<string>('')
  const [vaultSelected, setVaultSelected] = useState()
  const [vaultBalance, setVaultBalance] = useState<Coin[]>([])
  const [vaultFtSelected, setVaultFtSelected] = useState<Coin | null>(null) 
  const [issueTokenFeatures, setIssueTokenFeatures] = useState({
    mintable: true,
    burnable: false,
// ..more features of smart tokens
  })
  const handleFeaturesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIssueTokenFeatures({
      ...issueTokenFeatures,
      [event.target.name]: event.target.checked,
    });
    //console.log(`features ${JSON.stringify(issueTokenFeatures)}`)
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTxChange = (e: any) => {
    const { name, value } = e.target;
    setTxTransferForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTxIssueChange = (e: any) => {
    const { name, value } = e.target;
    setTxIssueForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddMsg = () => {
    // validate balance
    // validate destination address
    // create formatted msg for proposal
    let msg = {
      typeUrl: "/coreum.asset.ft.v1.Msg...", // cant find the message for a simple FT transfer
      value: {}
    }
    // add it to msgs
  }

  const handleAddIssueMsg = () => {
    let features = []
    if (issueTokenFeatures["mintable"]) {
      features.push(1)
    } 
    if (issueTokenFeatures["burnable"]) {
      features.push(2)
    }
    const msgIssueFT = {
          typeUrl: "/coreum.asset.ft.v1.MsgIssue",  // error (expected "custom", "bank" or "wasm")
          value: MsgIssue.fromPartial({
              issuer: vaultSelected,
              subunit: txIssueForm.subunit,
              symbol: txIssueForm.symbol,
              precision: txIssueForm.precision,
              initialAmount: txIssueForm.initialAmount,
              features: features,//txIssueForm.features,
              sendCommissionRate: txIssueForm.sendCommissionRate/* `${Decimal.fromUserInput("0.5", 18).atomics}` */ // 50% input
          }),
      };
      const ftDenom = `${msgIssueFT.value.subunit}-${vaultSelected}`
      console.log(
          `issuing ${ftDenom} FT ${JSON.stringify(msgIssueFT)}`
      );
      // add to msgs
      setMsgs((msgs) => [...msgs, msgIssueFT])

  }

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
      setVaultFtSelected(null)
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
    <hr />
    Add txs <br />
    <Select
      value={txModel}
      onChange={(e) => setTxModel(e.target.value)}
    >
      <MenuItem value={'none'}>None</MenuItem>
      <MenuItem value={'send-ft'}>Send FT</MenuItem>
      <MenuItem value={'send-nft'}>Send NFT</MenuItem>
      <MenuItem value={'create-ft'}>Create FT</MenuItem>
      <MenuItem value={'create-nft'}>Create NFT</MenuItem>
      <MenuItem disabled value={'members'}>Add/Remove Member</MenuItem>
    </Select>
    {txModel === 'create-ft' &&
      <>
      {' '}from vault:{' '} 
      <Select
        value={vaultSelected}
        onChange={(e) => setVaultSelected(e.target.value)}
      >
        {vaults?.map((v) => {return(<MenuItem value={v}>{v}</MenuItem>)})}
      </Select>
      <br />

      <TextField
        margin="normal"
        label="Subunit"
        name="subunit"
        value={txIssueForm.subunit}
        onChange={handleTxIssueChange}
      />
      <TextField
        margin="normal"
        label="Token Symbol"
        name="symbol"
        value={txIssueForm.symbol}
        onChange={handleTxIssueChange}
      />
      <TextField
        margin="normal"
        label="Initial amount"
        name="initialAmount"
        placeholder="Supply (e.g., 1,000,000)"
        value={txIssueForm.initialAmount}
        onChange={handleTxIssueChange}
      />
      <TextField
        margin="normal"
        label="Precision"
        name="decimals"
        type="number"
        sx={{ width: '8rem' }}
        value={txIssueForm.precision}
        onChange={handleTxIssueChange}
        inputProps={{ min: 0, max: 18 }} // This constrains input to the range 0-18
      />
      <TextField
        margin="normal"
        label="Send comission"
        name="sendCommissionRate"
        type="number"
        sx={{ width: '8rem' }}
        value={txIssueForm.sendCommissionRate}
        onChange={handleTxIssueChange}
        inputProps={{ min: 0, max: 100 }}
        />
        
      <FormControl component="fieldset">
        <FormLabel component="legend">Token features</FormLabel>
        <FormGroup aria-label="position" row>
          <FormControlLabel
            value="Mintable"
            control={<Checkbox
                checked={issueTokenFeatures.mintable}
                onChange={handleFeaturesChange}
                name="mintable"
              />}
            label="Mintable"
            labelPlacement="top"
          />
          <FormControlLabel
            value="Burnable"
            control={<Checkbox
                checked={issueTokenFeatures.burnable}
                onChange={handleFeaturesChange}
                name="burnable"
              />}
            label="Burnable"
            labelPlacement="top"
          />
          <FormControlLabel
            value="Freezable"
            disabled
            control={<Checkbox />}
            label="Freezable"
            labelPlacement="top"
          />
          <FormControlLabel
            value="Unfreezable"
            disabled
            control={<Checkbox />}
            label="Unfreezable"
            labelPlacement="top"
          />
        </FormGroup>
      </FormControl>

      <Button
        onClick={handleAddIssueMsg}
      >Add tx</Button>
      </>
    }
    {txModel === 'create-nft' &&
      <>Create NFT from your guild</>
    }

    {txModel === 'send-ft' &&
      <>
        <Select
          value={vaultSelected}
          onChange={(e) => setVaultSelected(e.target.value)}
        >
          {vaults?.map((v) => {return(<MenuItem value={v}>{v}</MenuItem>)})}
        </Select>
        {vaultSelected && vaultBalance &&
          <>
          <Select
            value={vaultFtSelected}
            onChange={(t) => setVaultFtSelected(t.target.value)}
          >
            {vaultBalance.map((b) => {return( <MenuItem value={b}>{b.denom}</MenuItem>)})}
          </Select>
          {vaultFtSelected &&
            <>
              Max: {vaultFtSelected.amount}
              <hr />
              <TextField        
                margin="normal"
                label="Destination"
                name="destination"
                value={txTransferForm.destination}
                onChange={handleTxChange}
              />
              <TextField
                margin="normal"
                label="amount"
                name="amount"
                type='number'
                inputProps={{min: 0, max: vaultFtSelected.amount}}                
                value={txTransferForm.amount}
                onChange={handleTxChange}
              >Amount</TextField>
              <Button
                onClick={handleAddMsg}
              >Add tx</Button>
            </>
          }
          </>
        }
      </>
    }
    {txModel === 'send-nft' &&
      <>Select vault, choose NFT, select destination</>
    }
    <hr />
    <Button
      style={{marginTop: "50px"}}
      onClick={() => createProposal()}
    >Launch proposal</Button>
    </>
  );
};

export default Proposal;
