import test from 'ava'
import kis from './kis'
import crypto from 'crypto'
import fs from 'fs'

test('allows writing files and stays under limit', function* (t) {
  const cache = yield kis('./sandbox/1', '3kb')
  t.is(cache.size, 0)
  let randString = crypto.randomBytes(1021).toString('hex')
  cache.writeSync('1', randString)
  t.is(fs.existsSync('./sandbox/1/1'), true)
  t.is(cache.size, 2042)
  randString = crypto.randomBytes(1020).toString('hex')
  cache.writeSync('2', randString)
  t.is(fs.existsSync('./sandbox/1/1'), false)
  t.is(cache.size, 2040)
  yield cache.purge()
  t.is(fs.existsSync('./sandbox/1/2'), false)
})

test('deletes lru files on init and being over the limit', function* (t) {
  const cache = yield kis('./sandbox/2', '20kb')
  let randString = crypto.randomBytes(1000).toString('hex')
  cache.writeSync('1', randString)
  cache.writeSync('2', randString)
  cache.writeSync('3', randString)

  yield kis('./sandbox/2', '3kb')
  t.is(fs.existsSync('./sandbox/2/1'), false)
  t.is(fs.existsSync('./sandbox/2/2'), false)
  t.is(fs.existsSync('./sandbox/2/3'), true)
  yield cache.purge()
})

test('throws when write is over the limit', function* (t) {
  const cache = yield kis('./sandbox/4', '2kb')
  const randString = crypto.randomBytes(1025).toString('hex') // each char takes 2 bytes
  t.throws(() => {
    cache.writeSync('2', randString)
  }, 'write is too big-limit is 2048 but the write is 2050')
})

test('throws size validation', function* (t) {
  yield kis('./sandbox/4').catch((err) => {
    t.is(err.message, 'size of undefined could not been parsed')
  })

  yield kis('./sandbox/4', '-5.9MB').catch((err) => {
    t.is(err.message, 'size -5.9MB is not valid input-only positive numbers are allowed')
  })
})
