// @flow
import React from 'react'
import BigNumber from 'bignumber.js'

import TransferTokensFormRenderer from './TransferTokensFormRenderer'
import { NATIVE_TOKEN_ADDRESS } from '../../config/tokens'
import type { TOMOTxParams, TransferTokensTxParams } from '../../types/transferTokensForm'
import type { Token } from '../../types/tokens'

type State = {
  token: Token,
  amount: number,
  receiver: string,
  customGas: ?number,
  customGasPrice: ?number,
}

type Props = {
  address: string,
  token: Token,
  tokens: Array<Token>,
  loading: boolean,
  error: string,
  status: string,
  statusMessage: string,
  gas: number,
  gasPrice: number,
  hash: string,
  receipt: Object,
  validateEtherTx: TOMOTxParams => void,
  validateTransferTokensTx: TransferTokensTxParams => void,
  sendEtherTx: TOMOTxParams => void,
  sendTransferTokensTx: TransferTokensTxParams => void,
  resetForm: void => void
}

class TransferTokensForm extends React.PureComponent<Props, State> {
  state = {
    token: this.props.tokens[0] || {},
    amount: 0,
    receiver: '',
    sender: '',
    customGas: this.props.gas,
    customGasPrice: this.props.gasPrice,
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.token.symbol !== prevState.token.symbol || this.props.gas !== prevProps.gas) {
      this.setState({customGas: this.props.gas})
    }
  }

  componentWillUnmount() {
    this.setState({
      token: this.props.token || this.props.tokens[0],
      amount: 0,
      receiver: '',
      customGas: null,
      customGasPrice: null,
    }, this.props.resetForm())
  }

  handleChange = (e: SyntheticInputEvent<>) => {
    let { value, name } = e.target

    value = (name === 'receiver') ? value.trim() : value

    this.setState({ [name]: value }, () => {
      const { amount, receiver, token, customGasPrice, customGas } = this.state
      let { gas, gasPrice, validateEtherTx, validateTransferTokensTx } = this.props

      gas = customGas
      gasPrice = customGasPrice

      if (token.address === NATIVE_TOKEN_ADDRESS && amount && receiver) {
        validateEtherTx({ amount, receiver, gas, gasPrice, tokenDecimals: token.decimals })
      } else if (amount && receiver && token) {
        validateTransferTokensTx({ 
          amount, 
          receiver, 
          gas, 
          gasPrice, 
          tokenAddress: token.address, 
          tokenDecimals: token.decimals,
        })
      }
    })
  }

  handleTokenChange = (token: Object) => {    
    this.setState({ token }, () => {
      const { amount, receiver, token } = this.state
      const { gas, gasPrice, validateEtherTx, validateTransferTokensTx, resetForm } = this.props

      resetForm()

      if (token.address === NATIVE_TOKEN_ADDRESS && amount && receiver) {
        validateEtherTx({ amount, receiver, gas, gasPrice })
      } else if (token && amount && receiver) {
        validateTransferTokensTx({ 
          amount, 
          receiver, 
          gas, 
          gasPrice, 
          tokenAddress: token.address, 
          tokenDecimals: token.decimals,
        })
      }
    })
  }

  handleSubmit = () => {
    const { amount, receiver, token, customGas, customGasPrice } = this.state
    let { address, gas, gasPrice, sendEtherTx, sendTransferTokensTx } = this.props
    gas = customGas
    gasPrice = customGasPrice
              
    if (this.state.token.address === NATIVE_TOKEN_ADDRESS) {
      sendEtherTx({ amount, receiver, gas, gasPrice, address })
    } else {
      sendTransferTokensTx({ 
        amount, 
        receiver, 
        gas, 
        gasPrice, 
        tokenAddress: token.address, 
        tokenDecimals: token.decimals,
        tokenSymbol: token.symbol,
      })
    }
  }

  isInvalidInput = () => {
    const { amount, receiver } = this.state

    return !amount || !receiver
  }

  sendMaxAmount = async (token) => {
    if (Number(token.availableBalance) === 0) return

    const { gas, gasPrice, validateEtherTx, validateTransferTokensTx } = this.props

    if (token.address === NATIVE_TOKEN_ADDRESS) {

      await validateEtherTx({ gas, gasPrice })
    } else {

      await validateTransferTokensTx({ 
        tokenAddress: token.address, 
        tokenDecimals: token.decimals,
      })
    }

    if (Number(token.availableBalance) < Number(this.props.transferFee)) return

    const amountWithoutFee = BigNumber(token.availableBalance).minus(this.props.transferFee).toFixed(8)    
    this.setState({ amount: Number(amountWithoutFee) })
  }

  render() {
    let { tokens, loading, error, status, statusMessage, gas, gasPrice, hash, receipt, estimatedGas, transferFee } = this.props
    const { token, amount, receiver, customGas, customGasPrice } = this.state
    gas = customGas
    gasPrice = customGasPrice

    return (
      <TransferTokensFormRenderer
        handleChange={this.handleChange}
        handleTokenChange={this.handleTokenChange}
        handleSubmit={this.handleSubmit}
        loading={loading}
        error={error}
        status={status}
        statusMessage={statusMessage}
        gas={gas}
        estimatedGas={estimatedGas}
        gasPrice={gasPrice}
        hash={hash}
        receipt={receipt}
        tokens={tokens}
        token={token}
        amount={amount}
        receiver={receiver}
        isInvalidInput={this.isInvalidInput()}
        sendMaxAmount={this.sendMaxAmount}
        transferFee={transferFee}
      />
    )
  }
}

export default TransferTokensForm
