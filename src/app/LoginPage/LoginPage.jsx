// @flow
import React from 'react'
import styled from 'styled-components'
import { Redirect } from 'react-router-dom'
import LoginPageRenderer from './LoginPageRenderer'
import type { LoginWithWallet } from '../../types/loginPage'
import { TrezorSigner } from '../../store/services/signer/trezor'
import { LedgerWallet } from '../../store/services/signer/ledger'
import {
  createWalletFromMnemonic,
  createWalletFromPrivateKey,
  // getEncryptedWalletAddress,
} from '../../store/services/wallet'
import AddressGenerator from '../../store/services/device/addressGenerator'
import { validatePassword } from '../../utils/helpers'

type Props = {
  authenticated: boolean,
  loginWithWallet: LoginWithWallet => void,
  loginWithTrezorWallet: Object => void,
  loginWithLedgerWallet: () => void,
  removeNotification: any => void,
  getTrezorPublicKey: (Object, ?string) => void
}

type State = {
  selectedTabId: string,
  privateKeyStatus: string,
  privateKey: string,
  mnemonicStatus: string,
  mnemonic: string,
  password: string,
  passwordStatus: string,
  isOpenAddressesDialog: boolean,
  addresses: Array<Object>,
  indexAddress: number,
  ledgerError: object,
}

const errorList = {
  "TransportOpenUserCancelled": "No device selected.",
  "26368": "Invalid status 0x6700. Check to make sure the right application is selected?",
  "26628": "Invalid status 0x6804. Check to make sure the right application is selected?",
}

const hdPaths = [
  {path: "m/44'/889'/0'/0", type: "TomoChain App"},
  {path: "m/44'/60'/0'", type: "Ledger Live"},
  {path: "m/44'/60'/0'/0", type: "Ethereum App"},
].map((m, index) => ({ ...m, rank: index + 1 }))

class LoginPage extends React.PureComponent<Props, State> {

  state = {
    // selectedTabId: 'private-key',
    selectedTabId: 'trezor',
    privateKeyStatus: 'initial',
    privateKey: '',
    mnemonicStatus: 'initial',
    mnemonic: '',
    password: '',
    passwordStatus: 'initial',
    isOpenAddressesDialog: false,
    addresses: [],
    indexAddress: 0,
    indexHdPathActive: 0,
    ledgerError: null,
    loading: false,
  }

  createLedgerSigner = async () => {
    try {
      new LedgerWallet()
      await window.signer.instance.create()
    } catch(e) {
      throw e
    }
  }
  
  getMultipleAddresses = async (offset, limit = 5, init) => {
    try {
      if (init) {
        const { indexHdPathActive } = this.state
        const publicKey = await window.signer.instance.getPublicKey(hdPaths[indexHdPathActive].path)
        if (!publicKey) return
        this.generator = new AddressGenerator(publicKey)
      }
      
      const nextAddresses = []

      for (let index = offset; index < offset + limit; index++) {
          const addressString = this.generator.getAddressString(index)

          const address = {
              addressString,
              index,
              balance: -1,
          }

          nextAddresses.push(address)
      }

      this.setState({
        indexAddress: offset + limit,
        addresses: nextAddresses,
      })
    } catch(e) {
      throw e
    }
  }

  prevAddresses = () => {
    let offset = this.state.indexAddress - 10
    offset = (offset > 0) ? offset : 0
    this.getMultipleAddresses(offset, 5, false)
  }

  nextAddresses = () => {
    this.getMultipleAddresses(this.state.indexAddress, 5, false)
  }

  handleTabChange = async (selectedTabId: string) => {
    this.setState({ 
      selectedTabId,
      privateKeyStatus: 'initial',
      mnemonicStatus: 'initial',
      privateKey: '',
      mnemonic: '',
      password: '',
      passwordStatus: 'initial',
    })
  }

  checkPrivateValid = (privateKey) => {
    (privateKey.length === 66) ? this.setState({isPrivateKeyValid: true}) : this.setState({isPrivateKeyValid: false})
  }

  handlePrivateKeyChange = (e) => {
    if (e.target.value.length !== 66) {
      this.setState({ 
        privateKey: e.target.value,
        privateKeyStatus: 'invalid',
      })
      return
    }

    this.setState({
      privateKey: e.target.value,
      privateKeyStatus: 'valid',
    })
  }

  handleMnemonicChange = (e) => {
    if (e.target.value.trim().split(' ').length !== 12) {
      this.setState({ 
        mnemonicStatus: 'invalid',
        mnemonic: e.target.value,
      })
      return
    }

    this.setState({
      mnemonicStatus: 'valid',
      mnemonic: e.target.value,
    })
  }

  handlePasswordChange = (e) => {
    const password = e.target.value

    if (!validatePassword(password)) {
      this.setState({ 
        passwordStatus: 'invalid',
        password,
      })

      return
    }

    this.setState({ 
      passwordStatus: 'valid',
      password,
    })
  }

  unlockWalletWithPrivateKey = async () => {
    const { 
      props: { loginWithWallet },
      state: { privateKey, privateKeyStatus },
    } = this

    if (privateKeyStatus !== 'valid') return

    const wallet = await createWalletFromPrivateKey(privateKey)

    if (!wallet) {
      this.setState({ privateKeyStatus: 'invalid' })
      return
    }

    loginWithWallet(wallet)
  }

  unlockWalletWithMnemonic = async () => {
    const {
      props: { loginWithWallet },
      state: { mnemonicStatus, mnemonic },
    } = this

    if (mnemonicStatus !== 'valid') return

    const wallet = await createWalletFromMnemonic(mnemonic)

    if (!wallet) {
      this.setState({ mnemonicStatus: 'invalid' })
      return
    }

    loginWithWallet(wallet)
  }

  toggleAddressesDialog = (status) => {
    if (status === 'open') {
      this.setState({ isOpenAddressesDialog: true })
      return
    } 
    
    this.setState({ 
      indexHdPathActive: 0,
      isOpenAddressesDialog: false,
      loading: false,
    })
  }

  handleHdPathChange = async (path) => {
    this.setState({ indexHdPathActive: path.rank - 1 })
    await this.connectToLedger()
  }

  connectToLedger = async () => {    
    try {
      this.setState({ loading: true })
      await this.createLedgerSigner()
      await this.getMultipleAddresses(0, 5, true) // Init get addresses
      
      if (this.state.addresses.length > 0) {
        this.setState({ 
          ledgerError: null,
          loading: false,
        })

        this.toggleAddressesDialog('open')
      }
    } catch(e) {
      this.setState({ 
        ledgerError: e,
        addresses: [],
      })
    }
  }

  openAddressesTrezorDialog = async () => {
    this.deviceService = new TrezorSigner()
    await this.props.getTrezorPublicKey(this.deviceService)
  }

  closeAddressesTrezorDialog = () => {
    this.props.closeSelectAddressModal()
  }

  render() {

    const {
      props: {
        authenticated,
        isSelectAddressModalOpen,
        loginWithLedgerWallet,
        loginWithTrezorWallet,
      },
      state: { 
        selectedTabId, 
        privateKeyStatus, 
        privateKey,
        mnemonicStatus,
        mnemonic,
        password,
        passwordStatus,
        addresses,
        isOpenAddressesDialog,
        indexHdPathActive,
        ledgerError,
        loading,
      },
      handleTabChange,
      handlePrivateKeyChange,
      unlockWalletWithPrivateKey,
      handleMnemonicChange,
      unlockWalletWithMnemonic,
      handlePasswordChange,
      toggleAddressesDialog,
      handleHdPathChange,
      connectToLedger,
      prevAddresses,
      nextAddresses,
      openAddressesTrezorDialog,
      closeAddressesTrezorDialog,
      deviceService,
    } = this

    // go to markets by default
    if (authenticated) {
      return <Redirect to="/markets" />
    }

    return (
      <Wrapper>
        <LoginPageRenderer
          selectedTabId={selectedTabId}
          handleTabChange={handleTabChange}
          privateKeyStatus={privateKeyStatus}
          privateKey={privateKey}
          handlePrivateKeyChange={handlePrivateKeyChange}
          unlockWalletWithPrivateKey={unlockWalletWithPrivateKey}
          mnemonicStatus={mnemonicStatus}
          mnemonic={mnemonic}
          handleMnemonicChange={handleMnemonicChange}
          unlockWalletWithMnemonic={unlockWalletWithMnemonic}
          password={password}
          passwordStatus={passwordStatus}
          handlePasswordChange={handlePasswordChange}
          addresses={addresses}
          isOpenAddressesDialog={isOpenAddressesDialog}
          toggleAddressesDialog={toggleAddressesDialog}
          loginWithLedgerWallet={loginWithLedgerWallet}
          handleHdPathChange={handleHdPathChange}
          indexHdPathActive={indexHdPathActive}
          hdPaths={hdPaths}
          connectToLedger={connectToLedger}
          prevAddresses={prevAddresses}
          nextAddresses={nextAddresses}
          ledgerError={ledgerError}
          errorList={errorList}
          isSelectAddressModalOpen={isSelectAddressModalOpen}
          openAddressesTrezorDialog={openAddressesTrezorDialog}
          closeAddressesTrezorDialog={closeAddressesTrezorDialog}
          deviceService={deviceService}
          loginWithTrezorWallet={loginWithTrezorWallet}
          loading={loading} />
      </Wrapper>
    )
  }
}

const Wrapper = styled.div`
  height: 100%;
`

export default LoginPage
