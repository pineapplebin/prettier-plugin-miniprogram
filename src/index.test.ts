import prettier from 'prettier'
import { describe, expect, test } from 'vitest'
import { plugin } from './index'

describe('prettier', async () => {
  test('prettier', async () => {
    const code = `
<view class="state__for">
  <view class="state__btn" aria-role="button" bindtap="goInsuranceIndex" hover-stay-time="60" hover-class="btn-hover">
    完成
    </view>
</view>
<wxs src="./../tools.wxs"    module="tools" />
<wxs module="m1"   src="sss">
var msg = "hello world"; const v = "<asd></asd>";
module.exports.message = msg;
</wxs>`
    const formatted = await prettier.format(code, {
      parser: 'wxml',
      plugins: [plugin],
    })
    expect(formatted).toBe(true)
  })
})
