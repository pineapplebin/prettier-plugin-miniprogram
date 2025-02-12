import { describe, expect, test } from 'vitest';
import { wrapFormat } from './utils';

describe('prettier-plugin-miniprogram', async () => {
  test('playground', async () => {
    const code = `<view data="{{...c, b}}"></view>`;
    const formatted = await wrapFormat(code);
  });

  test('nested view', async () => {
    const code = `<view class="state__for">
  <view class="state__btn" aria-role="button" bindtap="goInsuranceIndex" hover-stay-time="60" hover-class="btn-hover">
    完成
</view>
<span class="{{styleClass+'hello'}}">some</span>
    <span>三地发烧那地方拉丝发生了{{data.someAttr}}对方撒了发的</span>
  <span>

    asdfasd</span>
    <image class="long long long long" src="https://xxxxxxxxxxxxxxxxxxxx" aspect="very-long" ></image>
    </view>`;

    const formatted = await wrapFormat(code);
    expect(formatted).toMatchInlineSnapshot(`
      "<view class="state__for">
        <view
          class="state__btn"
          aria-role="button"
          bindtap="goInsuranceIndex"
          hover-stay-time="60"
          hover-class="btn-hover"
        >
          完成
        </view>
        <span class="{{styleClass + 'hello'}}">some</span>
        <span>三地发烧那地方拉丝发生了{{data.someAttr}}对方撒了发的</span>
        <span> asdfasd</span>
        <image
          class="long long long long"
          src="https://xxxxxxxxxxxxxxxxxxxx"
          aspect="very-long"></image>
      </view>
      "
    `);
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
    expect(formatted).toMatchInlineSnapshot(`
      "<wxs hidden />
      <wxs src="./../tools.wxs" asdf module="tools" hidden />
      <wxs module="test">
        module.exports.a = function () {
          console.log('wow');
        };
      </wxs>
      "
    `);
  });

  test('interpolation', async () => {
    const code = `<view class="{{normalData}}">
{{normalNumber > 10 ? 10 : 20}}
</view>
<view class="{{computed === true ? 'yes' : 'no'}}"></view>
<view class="long long long long long long long long long long {{expression > 10 ? (expressionB < 10 ? 'B' : 'C') : 'A'}}"></view>
<view data="{{p,...expr, a}}"></view>
<view data="{{a: 10, b: someAttr}}"></view>
<view data="{{a: computed > 10 ? someA : someB}}"></view>
<view class="head-card-name head-card-name-{{detail.detail.cardType}} head-card-name-sub-type-{{detail.detail.extra.subType === 8 ? detail.detail.extra.subType + '-' + detail.detail.extra.pendulumSubType : detail.detail.extra.subType}}">
{{detail.detail.name}}
</view>`;

    const formatted = await wrapFormat(code);
    expect(formatted).toMatchInlineSnapshot(`
      "<view class="{{normalData}}">
        {{normalNumber > 10 ? 10 : 20}}
      </view>
      <view class="{{computed === true ? 'yes' : 'no'}}"></view>
      <view
        class="long long long long long long long long long long {{expression > 10 ? (expressionB < 10 ? 'B' : 'C') : 'A'}}"
      ></view>
      <view data="{{p, ...expr, a}}"></view>
      <view data="{{a: 10, b: someAttr}}"></view>
      <view data="{{a: computed > 10 ? someA : someB}}"></view>
      <view
        class="head-card-name head-card-name-{{detail.detail.cardType}} head-card-name-sub-type-{{detail.detail.extra.subType === 8 ? detail.detail.extra.subType + '-' + detail.detail.extra.pendulumSubType : detail.detail.extra.subType}}"
      >
        {{detail.detail.name}}
      </view>
      "
    `);
  });

  test('force self closing', async () => {
    const code = `<input></input>
    <input/>
    <import src="path/to/comp" ></import>
    <progress></progress>`;

    const formatted = await wrapFormat(code);
    expect(formatted).toMatchInlineSnapshot(`
      "<input />
      <input />
      <import src="path/to/comp" />
      <progress />
      "
    `);
  });
});
