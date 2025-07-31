# Stripe 付款系统完整文档

## 概述

本文档详细记录了 EduSocial 平台的 Stripe 付款系统实现，包括从用户选择信用点套餐到完成付款的完整流程。

## 系统架构

付款系统采用分层架构模式：

1. **API 层** (`lib/api.js`) - 包含所有 API 函数
2. **Hooks 层** (`hooks/business/payments/`) - React Query hooks 用于数据管理
3. **组件层** (`components/business/payments/`) - UI 组件
4. **后端 API** (`app/api/stripe/`) - Next.js API 路由

## 付款成功后的三个必要操作

根据您的要求，每次付款成功后系统会自动执行以下三个操作：

1. **创建发票 (invoices)** - 在 `invoices` 表中创建付款发票记录
2. **创建信用交易记录 (credit_transactions)** - 在 `credit_transactions` 表中记录信用点变动
3. **更新用户信用余额 (business_credits)** - 更新 `business_credits` 表中的 `total_credits` 字段

这些操作都在 `app/api/stripe/webhook/route.js` 的 `processPaymentSuccess` 函数中统一处理。

## 完整付款流程

### 1. API 层设置 (`lib/api.js`)

```javascript
// Stripe-specific payment API functions
const stripeApi = {
  createPaymentIntent: async (data) => {
    // Creates a payment intent for card payments
  },

  confirmPayment: async (data) => {
    // Confirms a payment with payment method
  },



  getPaymentMethods: async () => {
    // Gets available payment methods by region/currency
  }
}
#### Stripe API 函数

```javascript
const stripeApi = {
  createPaymentIntent: async (data) => {
    // 创建 Stripe Payment Intent
    const response = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: data.orderId,
        paymentMethodTypes: data.paymentMethodTypes || ['card']
      })
    });
    return response.json();
  },

  confirmPayment: async (data) => {
    // 确认付款
    const response = await fetch('/api/stripe/confirm-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: data.paymentIntentId,
        paymentMethodId: data.paymentMethodId,
        paymentMethodType: data.paymentMethodType,
        returnUrl: data.returnUrl
      })
    });
    return response.json();
  }
}
```

#### 主要特性：
- 支持多种付款方式（信用卡、Alipay、GrabPay、Google Pay）
- 完善的错误处理机制
- 支持不同货币和地区的付款方式
- 与 React Query 集成进行状态管理

### 2. Hooks 实现

#### `useStripePaymentIntent.js`
- 创建 Stripe Payment Intent
- 处理基于卡片的付款
- 与 React Query 集成进行缓存和状态管理

#### `useStripeConfirmPayment.js`
- 在用户交互后确认付款
- 处理付款成功/失败状态
- 自动刷新相关查询缓存

#### `useCheckout.js`
- 提供 CheckoutProvider 和 useCheckoutContext
- 管理订单和套餐信息
- 处理已付款订单的状态

### 3. 后端 API 路由

#### `/api/stripe/create-payment-intent`
**功能**: 创建 Payment Intent
**流程**:
1. 验证用户身份和订单权限
2. 获取订单和套餐信息
3. 创建 Stripe Payment Intent
4. 更新订单的 payment_reference

#### `/api/stripe/confirm-payment`
**功能**: 确认付款
**流程**:
1. 验证 Payment Intent 所有权
2. 根据付款方式类型处理确认逻辑
3. 更新订单状态
4. 返回付款结果

#### `/api/stripe/webhook`
**功能**: 处理 Stripe Webhook 事件
**关键函数**: `processPaymentSuccess`
**付款成功后的三个操作**:

1. **更新信用余额**:
```javascript
// 获取当前信用余额并添加新购买的信用点
const { data: currentCredits } = await supabase
  .from("business_credits")
  .select('total_credits, used_credits')
  .eq('business_user_id', order.business_user_id)
  .single();

const { error: creditsError } = await supabase
  .from("business_credits")
  .upsert({
    business_user_id: order.business_user_id,
    total_credits: currentTotalCredits + creditPlan.credit_amount,
    used_credits: currentUsedCredits,
    updated_at: new Date(),
  });
```

2. **创建信用交易记录**:
```javascript
const { error: transactionError } = await supabase
  .from("credit_transactions")
  .insert({
    business_user_id: order.business_user_id,
    order_id: order.id,
    type: 'top_up',
    credit_change: creditPlan.credit_amount,
    balance_after: currentTotalCredits + creditPlan.credit_amount,
    description: `Credit purchase - ${creditPlan.name}`,
    created_at: new Date(),
  });
```

3. **创建发票记录**:
```javascript
const invoiceNumber = `INV-${Date.now()}-${order.id.slice(-8)}`;
const { error: invoiceError } = await supabase
  .from("invoices")
  .insert({
    business_user_id: order.business_user_id,
    order_id: order.id,
    invoice_number: invoiceNumber,
    amount: order.total_price,
    currency: order.currency,
    status: 'paid',
    business_name: businessProfile?.company_name || 'EduSocial Business',
    billing_address: businessProfile?.company_address || '',
    issued_at: new Date(),
    created_at: new Date(),
  });
```

### 4. 组件实现

#### `CustomStripeCheckout.jsx`
**主要付款组件**，包含：

1. **Remove Direct API Calls**: All API calls now go through hooks
2. **Support Multiple Payment Methods**: Card payments and alternative methods
3. **Improved Error Handling**: Better error states and user feedback
4. **Loading States**: Proper loading indicators during payment processing

Key Features:
- Card payment form using Stripe Elements
- Alternative payment methods button
- Payment method selection UI
- Success/failure state handling

## Payment Flow

### 1. Display Credit Plans
- User views available credit plans
- Plans show pricing, credits, and features

### 2. Order Creation
- User selects a plan
- System creates a credit order in `pending` status
- Order contains plan details and user information

### 3. Payment Method Selection
- User chooses between card payment or alternative methods
- Card payments use Payment Intents
- Alternative methods use Checkout Sessions

### 4. Payment Processing

#### Card Payments:
1. Create payment intent via `useStripePaymentIntent`
2. User enters card details in Stripe Elements
3. Payment is confirmed client-side
4. Webhook processes successful payment

#### Alternative Payments:
1. Create checkout session via `useStripeCheckoutSession`
2. Redirect user to Stripe Checkout
3. User completes payment on Stripe's hosted page
4. Webhook processes successful payment

### 5. Payment Completion
- Webhook updates order status to `paid`
- Credits are added to user account
- Transaction record is created
- Invoice is generated
- User is redirected to success page

## Supported Payment Methods

### By Currency/Region:

#### Malaysian Ringgit (MYR):
- Credit/Debit Cards
- FPX (Malaysian online banking)
- GrabPay
- Alipay

#### US Dollar (USD):
- Credit/Debit Cards
- US Bank Account
- Alipay

#### Euro (EUR):
- Credit/Debit Cards
- SEPA Direct Debit
- Sofort (German banking)
- iDEAL (Dutch banking)

#### British Pound (GBP):
- Credit/Debit Cards
- Bacs Direct Debit

## Database Schema

- **PaymentForm**: 处理信用卡和重定向付款流程
- **GooglePayButton**: 专门处理 Google Pay 付款
- **付款方式选择**: 支持信用卡、Alipay、GrabPay、Google Pay

#### `CheckoutForm.jsx`
**结账表单组件**，功能包括：
- 显示订单摘要和套餐信息
- 处理已付款订单（显示成功页面而非错误）
- 集成 CustomStripeCheckout 组件

## 完整付款流程图

### 用户付款流程：
1. **用户选择套餐** → `买信用点页面`
2. **创建订单** → `POST /api/business/credit-orders`
3. **进入结账页面** → `CheckoutForm.jsx`
4. **选择付款方式** → `CustomStripeCheckout.jsx`
5. **创建 Payment Intent** → `POST /api/stripe/create-payment-intent`
6. **确认付款** → `POST /api/stripe/confirm-payment`
7. **Stripe 处理付款** → 重定向或直接处理
8. **Webhook 通知** → `POST /api/stripe/webhook`
9. **执行三个操作** → `processPaymentSuccess` 函数
10. **显示成功页面** → 用户可返回首页

### 文件执行顺序：

#### 前端流程：
1. `components/business/payments/CheckoutForm.jsx` - 显示结账表单
2. `components/business/payments/CustomStripeCheckout.jsx` - 处理付款方式选择
3. `hooks/business/payments/useStripePaymentIntent.js` - 创建 Payment Intent
4. `hooks/business/payments/useStripeConfirmPayment.js` - 确认付款

#### 后端流程：
1. `app/api/stripe/create-payment-intent/route.js` - 创建 Payment Intent
2. `app/api/stripe/confirm-payment/route.js` - 确认付款
3. `app/api/stripe/webhook/route.js` - 处理 Webhook 事件
4. `processPaymentSuccess` 函数执行三个必要操作

## 数据库表结构

### 关键表：
- `credit_orders` - 订单信息和付款引用
- `credit_plans` - 可用的信用点套餐
- `credit_transactions` - 交易历史记录
- `business_credits` - 用户信用余额
- `invoices` - 生成的发票记录
- `business_profiles` - 商业档案（用于发票信息）

## 安全考虑

1. **身份验证**: 所有 API 路由都需要有效的用户会话
2. **授权**: 用户只能访问自己的订单
3. **验证**: 对金额、套餐和订单进行广泛验证
4. **Webhook 安全**: Stripe webhook 签名验证
5. **重复防护**: 检查以防止重复的信用处理

## 错误处理

### 常见错误情况：
1. **订单已付款**: 显示成功页面而非错误
2. **付款方式错误**: Alipay/GrabPay 使用正确的 payment_method_data 结构
3. **重复处理**: Webhook 中检查订单状态防止重复处理
4. **网络错误**: 前端组件提供重试机制

## 已修复的问题

### 1. 订单已付款错误处理 ✅
**问题**: 信用卡付款成功但订单已标记为"已付款"时显示错误
**解决方案**: 修改 useCheckout hook 将已付款订单视为成功状态

### 2. Alipay 付款方式确认错误 ✅
**问题**: Alipay 付款失败，错误信息 `Invalid string: {:type=>"alipay"}`
**解决方案**: 使用 `payment_method_data: { type: 'alipay' }` 而非 `payment_method: { type: 'alipay' }`

### 3. GrabPay 付款方式确认错误 ✅
**问题**: 与 Alipay 相同的问题
**解决方案**: 使用正确的 payment_method_data 结构

### 4. 清理多余文件 ✅
**删除的文件**:
- `app/api/payments/checkout/route.js` - 旧的付款 API，已被 Stripe 专用 API 替代
- 移除了 `lib/api.js` 中未使用的 `paymentsApi.checkout` 函数
- 清理了 `useCheckout.js` 中的旧 hook 实现

## 测试建议

### Alipay 测试：
如果 Alipay 点击没有反应，请检查：
1. 浏览器控制台是否有 JavaScript 错误
2. Payment Intent 是否成功创建
3. 确认付款请求是否正确发送
4. 检查 Stripe 仪表板中的付款状态

### 调试步骤：
1. 打开浏览器开发者工具
2. 选择 Alipay 付款方式
3. 点击付款按钮
4. 查看控制台输出和网络请求
5. 检查是否有错误信息

## 维护注意事项

1. **定期检查 Webhook**: 确保 Stripe Webhook 正常工作
2. **监控重复处理**: 检查是否有重复的信用点添加
3. **发票编号唯一性**: 确保发票编号不重复
4. **货币支持**: 添加新货币时更新货币映射
5. **付款方式更新**: Stripe 添加新付款方式时及时更新

## 总结

本付款系统完整实现了您要求的功能：
- ✅ 支持多种付款方式（信用卡、Alipay、GrabPay、Google Pay）
- ✅ 付款成功后自动创建发票
- ✅ 付款成功后自动创建信用交易记录
- ✅ 付款成功后自动更新用户信用余额
- ✅ 完善的错误处理和用户体验
- ✅ 安全的付款流程和数据保护

所有相关文件都已优化，多余文件已删除，系统运行更加高效稳定。

1. **Client-Side**: User-friendly error messages in components
2. **API Level**: Proper HTTP status codes and error responses
3. **Webhook Processing**: Graceful handling of webhook failures
4. **Payment Failures**: Clear feedback and retry mechanisms

## Testing Considerations

1. **Unit Tests**: Test individual hooks and API functions
2. **Integration Tests**: Test complete payment flows
3. **Webhook Testing**: Use Stripe CLI for webhook testing
4. **Multi-Currency Testing**: Test different currency scenarios
5. **Payment Method Testing**: Test various payment methods

## Future Enhancements

1. **Saved Payment Methods**: Allow users to save cards for future use
2. **Subscription Support**: Add recurring payment capabilities
3. **Refund Processing**: Implement refund functionality
4. **Payment Analytics**: Add payment success/failure tracking
5. **Mobile Payments**: Enhanced mobile payment experience

## Configuration

### Environment Variables:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Dashboard Configuration:
- Enable required payment methods
- Configure webhook endpoints
- Set up currency support
- Configure business information

## Monitoring and Maintenance

1. **Payment Success Rates**: Monitor via Stripe Dashboard
2. **Error Logging**: Server-side error logging for debugging
3. **Webhook Reliability**: Monitor webhook delivery success
4. **Performance**: Monitor API response times
5. **User Experience**: Track payment abandonment rates

## Complete Implementation Flow

### From DisplayAllCreditPlans to Stripe Purchase:

1. **Credit Plans Display** (`DisplayAllCreditPlans` component)
   - Shows available credit plans with pricing
   - User selects a plan and clicks "Buy Now"

2. **Order Creation** (via existing hooks)
   - Creates a credit order in the database
   - Order status set to 'pending'

3. **Checkout Page** (with `CheckoutProvider`)
   - Loads order and plan information
   - Provides context to payment components

4. **Payment Component** (`StripePayment.jsx`)
   - Uses refactored hooks instead of direct API calls
   - Supports both card and alternative payment methods
   - Handles payment success/failure states

5. **Payment Processing**
   - Card payments: Direct integration with Stripe Elements
   - Alternative payments: Redirect to Stripe Checkout
   - Webhook handles payment completion

6. **Post-Payment Processing**
   - Credits added to user account
   - Transaction record created
   - Invoice generated
   - User redirected to success page

This implementation provides a robust, scalable payment system that supports multiple payment methods while maintaining security and user experience standards.