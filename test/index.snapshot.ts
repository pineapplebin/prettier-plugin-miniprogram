export const testNestedViewSnapshot = `<view class="state__for">
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
</view>
`;

export const testWxsSnapshot = `<wxs hidden />
<wxs src="./../tools.wxs" asdf module="tools" hidden />
<wxs module="test">
  module.exports.a = function () {
    console.log('wow');
  };
</wxs>
`;
