import { describe, expect, test } from 'vitest';
import { wrapFormat } from './utils';
import { testNestedViewSnapshot, testWxsSnapshot } from './index.snapshot';

describe('prettier-plugin-miniprogram', async () => {
  test('nested view', async () => {
    const code = `<view class="state__for">
  <view class="state__btn" aria-role="button" bindtap="goInsuranceIndex" hover-stay-time="60" hover-class="btn-hover">
    完成
</view>
<span class="{{styleClass+'hello'}}">some</span>
    <span>三地发烧那地方拉丝发生了{{data.someAttr}}对方撒了发的</span>
  <span>

    asdfasd</span></view>`;

    const formatted = await wrapFormat(code);
    expect(formatted).toEqual(testNestedViewSnapshot);
  });

  test('wxs', async () => {
    const code = `<wxs hidden   />
    <wxs src="./../tools.wxs"  asdf=""   module="tools"  hidden/>
    <wxs module="test">
    module.exports.a = function () {
      console.log('wow')
    }
    </wxs>`;
    const formatted = await wrapFormat(code);
    expect(formatted).toEqual(testWxsSnapshot);
  });
});
