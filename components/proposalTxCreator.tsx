import { useContext, useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { Coin } from '@cosmjs/amino';
import WalletLoader from 'components/WalletLoader';
import { useSigningClient } from 'contexts/client';
import {
  convertDenomToMicroDenom,
  convertFromMicroDenom,
  convertMicroDenomToDenom,
} from 'util/conversion';
import { FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox } from "@mui/material"
import { MsgSend } from 'coreum/proto-ts/coreum/nft/v1beta1/tx';
import { AssetFT  } from 'coreum/tx'
import { MsgExecuteContract } from 'hooks/generated-ts/cosmwasm/wasm/v1/tx';
import { Button, Typography, TextField, Select, MenuItem } from '@mui/material';
import { MsgIssue } from 'coreum/proto-ts/coreum/asset/ft/v1/tx';

interface IProps {
    vaultSelected: string;
    vaultBalance: Coin[];
    setMsgs: (m: any) => void;
}

//@ts-ignore
const ProposalTxCreator: NextPage = (props: IProps) => {
    const [txModel, setTxModel] = useState<string>('')
    const [vaultFtSelected, setVaultFtSelected] = useState<Coin | null>(null) 

    const [issueTokenFeatures, setIssueTokenFeatures] = useState({
        mintable: true,
        burnable: false,
    // ..more features of smart tokens
    })

    const handleTxChange = (e: any) => {
        const { name, value } = e.target;
        setTxTransferForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleTxIssueChange = (e: any) => {
        const { name, value } = e.target;
        setTxIssueForm((prev) => ({ ...prev, [name]: value }));
    };
    const emptyTransferTx = {    // transfers only
        type: "",   // ft || nft
        token: '',  // token denom
        amount: 0,
        destination: '',
    }
    const [txTransferForm, setTxTransferForm] = useState(emptyTransferTx)
    const [txIssueForm, setTxIssueForm] = useState({
        subunit: '',
        symbol: '',
        precision: 18,
        initialAmount: "0",
        features: [1, 0],
        sendCommissionRate: '0'
    })

    const handleFeaturesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIssueTokenFeatures({
        ...issueTokenFeatures,
        [event.target.name]: event.target.checked,
        });
        //console.log(`features ${JSON.stringify(issueTokenFeatures)}`)
    };
    const handleAddMsg = () => {
        // validate balance
        // validate destination address
        // create formatted msg for proposal
        let msg = {
        bank: {
            send : {
            from_address: props.vaultSelected,
            to_address: txTransferForm.destination,
            amount: [{denom: vaultFtSelected?.denom, amount: txTransferForm.amount}]
            }
        }
        }
        props.setMsgs(msg)
        setTxModel('')
        setVaultFtSelected(null)
        setTxTransferForm(emptyTransferTx)
    }

    // WIP
    const handleAddIssueMsg = () => {
        let features = []
        if (issueTokenFeatures["mintable"]) {
        features.push(1)
        } 
        if (issueTokenFeatures["burnable"]) {
        features.push(2)
        }
        // try with wasm: { instantiate: {MsgInstantiate}}
        const msgIssueFT = {
            typeUrl: "/coreum.asset.ft.v1.MsgIssue",  // error (expected "custom", "bank" or "wasm")
            value: MsgIssue.fromPartial({
                issuer: props.vaultSelected,
                subunit: txIssueForm.subunit,
                symbol: txIssueForm.symbol,
                precision: txIssueForm.precision,
                initialAmount: txIssueForm.initialAmount,
                features: features,//txIssueForm.features,
                sendCommissionRate: txIssueForm.sendCommissionRate// `${Decimal.fromUserInput("0.5", 18).atomics}` / // 50% input
            }),
        };
        let te = new TextEncoder()
        let msg_e = te.encode(JSON.stringify(msgIssueFT))
        let msg = {
        custom: {
            msg: msg_e
        }}
        props.setMsgs(msg)
        setTxModel('')
        setVaultFtSelected(null)
    }


    return (
    <>

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
        {/* many more..  vault/ft/admin/member dependent */}
    </Select>
    {txModel === 'create-ft' &&
      <>
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
        {props.vaultSelected && props.vaultBalance &&
          <>
          <Select
            value={vaultFtSelected}
           /* @ts-ignore */
            onChange={(t) => setVaultFtSelected(t.target.value)}
          >
        {/* @ts-ignore */}
            {props.vaultBalance.map((b) => {return( <MenuItem value={b}>{b.denom}</MenuItem>)})}
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
    </>
  );
};

export default ProposalTxCreator;
