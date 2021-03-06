// @flow
import { connect } from 'react-redux'
import getWalletPageSelector, {
  redirectToTradingPage,
  redirectToLendingPage,
} from '../../store/models/walletPage'
import { copyDataSuccess } from '../../store/models/app'
import { removeNotification } from '../../store/actions/app'
import { closeHelpModal } from '../../store/actions/walletPage'

import type { State } from '../../types'

export function mapStateToProps(state: State) {
  const walletPageSelector = getWalletPageSelector(state)

  return {
    ...walletPageSelector,
  }
}

export const mapDispatchToProps = {
  removeNotification,
  redirectToTradingPage,
  redirectToLendingPage,
  closeHelpModal,
  copyDataSuccess,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)
