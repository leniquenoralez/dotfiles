/* eslint-env jest */
import undeclared from '../index'

describe('babylon-undeclared-identifiers', () => {
  it('should return empty array if no undeclared identifiers are in the source code', () => {
    expect(undeclared('var answer = 6 * 7;').length).toBe(0)
  })

  it('should find undeclared identifiers', () => {
    const found = undeclared('answer = 6 * 7;')
    expect(found.length).toEqual(1)
    expect(found[0]).toEqual('answer')

    const found2 = undeclared(`for (i = 0; i < scopeChain.length; i++) {
    var scope = scopeChain[i]
      if (scope.indexOf(varname) !== -1) {
      }
    }`)
    expect(found2[0]).toEqual('i')
    expect(found2[1]).toEqual('scopeChain')
    expect(found2[2]).toEqual('varname')

    const found3 = undeclared('var a, b, c; d')
    expect(found3[0]).toEqual('d')

    const found4 = undeclared(`const beginning = editor.getSelectedScreenRange().start
  if (beginning.column !== 0) {
    beginning.column = 0
    const selectionRange = editor.getSelectedScreenRange()
    selectionRange.start = beginning
    editor.setSelectedScreenRange(selectionRange)
  }`)
    expect(found4[0]).toEqual('editor')
  })

  it('destructuring', () => {
    const un = undeclared(`  if (user) {
      const {profile} = user
      const {profile: {a: deeplyDestructured}} = user
      globalState.extend({user: profile, token, deeplyDestructured})
    }`)
    expect(un).toEqual(['user', 'globalState', 'token'])
  })

  it('picks even inside call expression', () => {
    const un = undeclared(`const state = observable({
  selectedTab: SearchListStore.CONVERSATIONS_TABS
})`)

    expect(un).toEqual(['observable', 'SearchListStore'])
  })

  it('works with jsx', () => {
    const un = undeclared(`<h5>
  unicorn
</h5>`)

    expect(un).toEqual([])

    const un2 = undeclared(`<MyAwesomeComponent>
  unicorn
</MyAwesomeComponent>`)

    expect(un2).toEqual(['MyAwesomeComponent'])
  })
})
