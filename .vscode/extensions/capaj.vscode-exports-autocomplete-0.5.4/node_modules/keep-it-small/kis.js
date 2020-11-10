const path = require('path')
const bytes = require('bytes')
const utf8Length = require('utf8-length')
const fs = require('mz/fs')
const klaw = require('klaw')
const co = require('co')
const _ = require('lodash')
const debug = require('debug')('keep-it-small')

function getStats (p) {
  return new Promise((resolve, reject) => {
    let totalInBytes = 0
    let items = []
    klaw(p)
      .on('data', function (item) {
        if (item.stats.isDirectory()) {
          return
        }
        if (item.stats.size > 0) {
          totalInBytes += item.stats.size
          items.push(item)
        }
      })
      .on('error', function (err, item) {
        reject(err)
      })
      .on('end', function () {
        items = _.sortBy(items, (item) => item.stats.birthtime)
        resolve({totalInBytes, items})
      })
  })
}

function unlink (file) {
  return fs.unlink(file).catch((err) => {
    if (!err.message.match(/ENOENT/)) {
      throw err
    }
  })
}

module.exports = co.wrap(function *(dirPath, size) {
  const limit = bytes.parse(size)
  if (!Number.isInteger(limit)) {
    throw new TypeError(`size of ${size} could not been parsed`)
  }
  if (limit < 0) {
    throw new TypeError(`size ${size} is not valid input-only positive numbers are allowed`)
  }
  const stats = yield getStats(dirPath)

  const removeSomeIfNeeded = (overflowingSize) => {
    let deletedSize = 0

    if (overflowingSize > limit) {
      debug('removeSomeIfNeeded limit: ', limit)
      debug('removeSomeIfNeeded overflowingSize: ', overflowingSize)
      let index = 0
      const sizeDifference = overflowingSize - limit
      while (deletedSize < sizeDifference) {
        const item = stats.items[index]
        deletedSize += item.stats.size
        unlink(item.path)
        stats.items.splice(index, 1)
      }
    }
    stats.totalInBytes = overflowingSize - deletedSize
  }
  debug('currentSize: ', stats.totalInBytes)
  if (stats.totalInBytes > limit) {
    removeSomeIfNeeded(stats.totalInBytes)
  }
  const checkSize = (content) => {
    const size = utf8Length(content)
    if (size > limit) {
      throw new Error(`write is too big-limit is ${limit} but the write is ${size}`)
    }
    return size
  }
  return {
    *write (fileName, content) {
      const size = checkSize(content)
      let existingFileSize = 0
      let existingFile = _.find(stats.items, (item) => {
        return path.basename(item.path) === fileName
      })
      if (existingFile) {
        existingFileSize = existingFile.stats.size
      }

      const sizeWithNewFile = size + stats.totalInBytes - existingFileSize
      removeSomeIfNeeded(sizeWithNewFile)
      yield fs.writeFile(path.join(dirPath, fileName), content)
      debug('written', fileName)
      stats.items.push({
        path: path.join(path.resolve(dirPath), fileName),
        stats: {
          size
        }
      })
    },
    writeSync (fileName, content) {
      const size = checkSize(content)
      let existingFileSize = 0
      let existingFile = _.find(stats.items, (item) => {
        return path.basename(item.path) === fileName
      })
      if (existingFile) {
        existingFileSize = existingFile.stats.size
      }

      const sizeWithNewFile = size + stats.totalInBytes - existingFileSize
      removeSomeIfNeeded(sizeWithNewFile)

      fs.writeFileSync(path.join(dirPath, fileName), content)
      debug('written', fileName)
      stats.items.push({
        path: path.join(dirPath, fileName),
        stats: {
          size
        }
      })
    },
    *purge () {
      yield Promise.all(stats.items.map((file) => unlink(file.path)))
      stats.totalInBytes = 0
      stats.items = []
    },
    get size () {
      return stats.totalInBytes
    }
  }
})
