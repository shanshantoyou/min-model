export { default as BaseIndexer } from './base-indexer'

import StringIndexer from './string-indexer'
import NumberIndexer from './number-indexer'
import BooleanIndexer from './boolean-indexer'
import ObjectIndexer from './object-indexer'
import ArrayIndexer from './array-indexer'
import DateIndexer from './date-indexer'
import ErrorIndexer from './error-indexer'
import { PendingSearchResult } from '../search-result'
import { nameOfNativeType } from '../utils'

import { EventEmitter } from 'events'

const typesMap = new Map([
  [ 'string', StringIndexer ],
  [ String, StringIndexer ],
  [ 'number', NumberIndexer ],
  [ Number, NumberIndexer ],
  [ 'boolean', BooleanIndexer ],
  [ Boolean, BooleanIndexer ],
  [ 'object', ObjectIndexer ],
  [ Object, ObjectIndexer ],
  [ 'array', ArrayIndexer ],
  [ Array, ArrayIndexer ],
  [ 'date', DateIndexer ],
  [ Date, DateIndexer ],
  [ 'error', ErrorIndexer ],
  [ Error, ErrorIndexer ]
])

export default class Index extends EventEmitter {
  constructor(sequence, prefix, key, type, min) {
    super()

    this.sequence = sequence
    this.prefix = prefix
    this.key = key
    this.type = type
    this.ready = false

    if (typesMap.has(type)) {
      this.indexer = new (typesMap.get(type))(sequence, prefix, key, min)
      this.indexer
        .on('ready', () => {
          this.ready = true
          this.emit('ready')
        })
        .on('updated', () => this.emit('updated'))
    } else {
      throw new Error('Not support for this type.')
    }
  }

  add(key, val) {
    if (!this.indexer) throw new ReferenceError('There not indexer available.')

    if (!this.ready) {
      return new Promise((resolve, reject) => {
        this.indexer.once('ready', () => {
          this.indexer.add(key, val)
            .then(resolve)
            .catch(reject)
        })
      })
    }

    return this.indexer.add(key, val)
  }

  reindex(key, newValue, oldValue) {
    if (!this.indexer) throw new ReferenceError('There not indexer available.')

    if (!this.ready) {
      return new Promise((resolve, reject) => {
        this.indexer.once('ready', () => {
          this.indexer.reindex(key, newValue, oldValue)
            .then(resolve)
            .catch(reject)
        })
      })
    }

    return this.indexer.reindex(key, newValue, oldValue)
  }

  search(query, chainData = null, context) {
    if (!this.indexer) throw new ReferenceError('There not indexer available.')

    if (!this.ready) {
      return PendingSearchResult(new Promise((resolve, reject) => {
        this.indexer.once('ready', () => {
          this.indexer.search(query, chainData)
            .then(resolve)
            .catch(reject)
        })
      }), context)
    }

    return PendingSearchResult(
      this.indexer.search(query, chainData),
      context
    )
  }
}

export function setIndexer(type, indexerCtor) {
  typesMap.set(type, indexerCtor)
  typesMap.set(nameOfNativeType(type), indexerCtor)
}