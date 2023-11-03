import { useContext, useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useSigningClient } from 'contexts/client';
import { Typography } from '@mui/material';
import VaultCreator from 'components/CreateVault';
import { GuildContext } from 'contexts/guildContext';
import { Coin } from 'coreum/proto-ts/cosmos/base/v1beta1/coin';
/* 
- TODO:
  - get NFT's
  - adapt to figma (it displays counting and then a component with details)
    - create this component
  
  - Design considerations:
    - how to index the tokens we want to check?
      - regular "successful" tokens
      - concat with guild created tokens
      - concat to guildhub specific tokens


*/

interface VaultBalanceFt {
  vault: string,
  balance: Coin,
}

//@ts-ignore
const Vaults: NextPage = () => {
  const { walletAddress, signingClient } = useSigningClient();
  const ctx = useContext(GuildContext);
  const vaults = ctx?.guildVaults;
  const [balancesFt, setBalancesFt] = useState<VaultBalanceFt[]>([])
  const tokensList = ["utestcore"]

  async function getBalancesFT(vaultAddress: string) {
    for (let t = 0; t < tokensList.length; t++) {
      let tokenDenom = tokensList[t]
      let bal = await signingClient?.getBalance(vaultAddress, tokenDenom)
      if (bal) {
        //console.log(`getting FT's for ${vaultAddress} is ${JSON.stringify(bal)}`)
        setBalancesFt((balancesFt) => [...balancesFt, {vault: vaultAddress, balance:bal}])
      }
    }
  }
  useEffect(() => {
    if (vaults && vaults?.length > 0) {
      for (let i = 0; i < vaults.length; i++) {
        getBalancesFT(vaults[i])
      }
    }
  },[vaults])

  const getBalancesOfVault = (address: string) => {
    let l = balancesFt.filter((b) => b.vault === address)
    if (l.length > 0) {
      return l[0]                   // It returns only the first item! FIX ME
    } else {
      return null
    }
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Vaults
      </Typography>
      <VaultCreator />
      <hr />
      {vaults && vaults?.length > 0 && (
        <table>
          <tr>
            <th>Vault address</th>
            <th>FTs</th>
            {/* 
            <th>NFTs</th>
            */}
          </tr>
          {vaults?.map((v) => {
            return (
            <tr key={v}>
              <th>{v}</th>
              {/* do a loop for each vault to show all tokens? */}
              {getBalancesOfVault(v) &&
                <td
                  key={v}
                  style={{padding: "15px"}}
                >
                  {getBalancesOfVault(v)?.balance.amount} {getBalancesOfVault(v)?.balance.denom}
                </td>
              }
              <th>{}</th>
            </tr>
            );
          })}
        </table>
      )}
    </>
  );
};

export default Vaults;
