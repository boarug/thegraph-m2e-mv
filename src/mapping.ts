import {Address, BigInt} from "@graphprotocol/graph-ts"

import {NFT, Transfer} from "../generated/NFT/NFT"
import {Holder, Token, TokenInfo, Transfer as TransferEvent} from "../generated/schema"

function getHolder(address: string): Holder {
    let holder = Holder.load(address)
    if (!holder) {
        return new Holder(address)
    }
    return holder
}

function getToken(tokenId: BigInt): Token {
    let token = Token.load(tokenId.toString())
    if (!token) {
        return new Token(tokenId.toString())
    }
    return token
}

function updateTokenInfo(address: Address, tokenId: BigInt): void {
    let contract = NFT.bind(address)
    let tokenInfo = TokenInfo.load(tokenId.toString())
    if (!tokenInfo) {
        tokenInfo = new TokenInfo(tokenId.toString())
        let moveyInfo = contract.getMoveyInfo(tokenId)
        tokenInfo.rare = moveyInfo.rare + 1
        tokenInfo.code = moveyInfo.code
        tokenInfo.topey = ["jogging", "running", "walking"][moveyInfo.topey]
        let props = contract.getProperties(tokenId)
        tokenInfo.effective = props[0]
        tokenInfo.quality = props[1]
        tokenInfo.luck = props[2]
        tokenInfo.save()
    }
}

// export function handleTransferTemplate(event: Transfer): void {
//     handleTransfer(event)
// }

export function handleTransfer(event: Transfer): void {
    if (event.params.from != Address.zero()) {
        let from = getHolder(event.params.from.toHex())
        from.sentCount = from.sentCount + 1
        from.balance = from.balance - 1
        from.save()
    }

    let to = getHolder(event.params.to.toHex())
    to.receivedCount = to.receivedCount + 1
    to.balance = to.balance + 1
    to.save()

    let transfer = new TransferEvent(event.transaction.hash.toHex())
    transfer.from = event.params.from
    transfer.to = event.params.to
    transfer.tokenId = event.params.tokenId
    transfer.timestamp = event.block.timestamp
    transfer.save()

    updateTokenInfo(event.address, event.params.tokenId)

    let token = getToken(event.params.tokenId)
    token.owner = event.params.to.toHex()
    token.updatedAt = event.block.timestamp
    token.latestTx = event.transaction.hash
    token.transfersCount = token.transfersCount.plus(BigInt.fromI32(1))
    token.info = event.params.tokenId.toString()
    token.save()
}
