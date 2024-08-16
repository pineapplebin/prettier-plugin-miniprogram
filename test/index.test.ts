import prettier from 'prettier'
import { describe, expect, test } from 'vitest'
import { plugin } from '../src'

describe('prettier', async () => {
  test('prettier', async () => {
    const code = `
<view class="state__for">
  <view class="state__btn" aria-role="button" bindtap="goInsuranceIndex" hover-stay-time="60" hover-class="btn-hover">
    完成</view>
    <span>三地发烧那地方拉丝发生了{{asdfasdf}}对方撒了发的</span>
  <span>
    
    asdfasd</span></view>
<wxs hidden   />
<wxs src="./../tools.wxs"  asdf=""   module="tools"  hiddehiddenhiddenhiddenn/>
<wxs module="m1"   src="sss">var msg = "hello world"; const v = "<asd></asd>";
module.exports.message = msg;</wxs>`
    const formatted = await prettier.format(code, {
      parser: 'wxml',
      printWidth: 60,
      plugins: [plugin],
    })
    expect(formatted).toBe(true)
  })
})
