const Mongoose = require('mongoose')

const Schema = Mongoose.Schema

/**
 * This model is used to control which users
 * claimed blockchain accounts through utopian
 */
const utopianBlockchainAccounts = new Schema({
  blockchain: {
    type: String,
    enum: ['steem'],
    required: true
  },
  address: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    enum: ['github'],
    required: true
  },
  username: {
    type: String,
    required: true
  },
  userId: {
    type: String
  },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date },
  deletedAt: { type: Date }
})

module.exports = Mongoose.model('UtopianBlockchainAccounts', utopianBlockchainAccounts, 'utopianBlockchainAccounts')
