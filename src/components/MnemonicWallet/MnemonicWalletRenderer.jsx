import React from 'react'
import styled from 'styled-components'
import { FormattedMessage } from 'react-intl'
import { Label, Spinner } from '@blueprintjs/core'

import { TmColors, Theme, SmallText, ButtonLogin } from '../../components/Common'

const MnemonicWalletRenderer = (props) => {
    const { 
      mnemonic,
      mnemonicStatus, 
      handleMnemonicChange, 
      unlockWallet,
      loading,
    } = props
  
    return (
      <WalletWrapper>
        <LabelWrapper>
          <LabelTitle><FormattedMessage id="unlockWalletPage.mnemonic.labelMnemonic" /></LabelTitle> 
          <TextAreaWrapper 
            value={mnemonic} 
            isInvalid={mnemonicStatus === 'invalid'} 
            onChange={handleMnemonicChange}
            autoComplete="off" 
            readOnly 
            onFocus={(event) => event.target.removeAttribute('readonly')} />
        </LabelWrapper>
        {(mnemonicStatus === 'invalid') && (<ErrorMessage><FormattedMessage id="unlockWalletPage.mnemonic.invalid" /></ErrorMessage>)}
    
        <ButtonLogin disabled={mnemonicStatus !== 'valid'} onClick={unlockWallet}>
          <FormattedMessage id="unlockWalletPage.unlockWallet" />
          {loading && <Spinner intent="PRIMARY" size={Spinner.SIZE_SMALL} />}
        </ButtonLogin>
        <Warning><FormattedMessage id="unlockWalletPage.notRecommended" /></Warning>
      </WalletWrapper>
    )
}

const WalletWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 395px;
  margin: 0 auto;
`

const LabelWrapper = styled(Label)`
  margin-bottom: 0 !important;
  width: 100%;
  &:not(:first-child) {
    margin-top: 35px;
  }
`

const LabelTitle = styled.div`
  margin-bottom: 25px;
`

const TextAreaWrapper = styled.textarea`
  width: 100%;
  min-height: 128px !important;
  padding: 15px;
  background-color: ${TmColors.BLACK};
  margin-bottom: 5px;
  resize: none;
  font-size: ${Theme.FONT_SIZE_LG};
  color: ${TmColors.WHITE};
  border: ${props => props.isInvalid ? `1px solid ${TmColors.RED} !important` : 'none'};

  &:focus {
      border: 1px solid ${TmColors.ORANGE};
  }
`

const ErrorMessage = styled.div`
  color: ${TmColors.RED};
  font-size: 12px;
  margin-top: 7px;
  width: 100%;
`

const Warning = styled(SmallText)`
  color: ${TmColors.RED};
  width: 100%;
  margin-top: 10px;
  text-align: center;
`

export default MnemonicWalletRenderer