import { Signal } from '@angular/core';
import { ApiRes, ChequeDelegationRes, DelegationDetailsRes, ProductApprovalRes } from './model';

export function universalDelegationParse(type: Signal<string>) {
  return (value: any) => {
    switch (type()) {
      case '/pending-cheques':
        return chequeDelegationParse(value);
      default:
        return productDelegationParse(value);
    }
  };
}

export function chequeDelegationParse(value: ChequeDelegationRes) {
  return {
    ...(value as any),
    data: {
      ...value.data,
      details: {
        ...value.data.chequebookDetail,
        status: value.status,
        requestId: value.requestId,
        from: { nickname: 'Not provided', accountNumber: value.data.chequebookDetail.accountNumber },
      },
    },
  } as ApiRes<DelegationDetailsRes>;
}

export function productDelegationParse(value: ApiRes<ProductApprovalRes>) {
  const p = value.data.productDetail;
  return {
    ...(value as any),
    data: {
      ...value.data,
      details: {
        ...p,
        from: { nickname: p.debitAccountHolderNickName, accountNumber: p.debitAccount },
        to: { nickname: p.creditAccountHolderNickName, accountNumber: p.creditPrincipleAccount },
      },
    },
  } as ApiRes<DelegationDetailsRes>;
}
