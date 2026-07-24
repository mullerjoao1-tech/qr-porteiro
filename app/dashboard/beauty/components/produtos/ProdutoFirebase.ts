import {
  onValue,
  push,
  ref,
  serverTimestamp,
  set,
  update,
} from "firebase/database";

import { db } from "../../../../services/firebase";

import type {
  NovoProdutoBeauty,
  ProdutoBeauty,
  StatusProduto,
} from "./ProdutoTypes";

const BASE =
  "beauty-v2/estabelecimentos/qr-beauty-demo/produtos";

export function observarProdutos(
  sucesso: (dados: ProdutoBeauty[]) => void,
  erro?: (e: Error) => void
) {
  const produtosRef = ref(db, BASE);

  return onValue(
    produtosRef,
    (snapshot) => {
      const lista: ProdutoBeauty[] = [];

      snapshot.forEach((item) => {
        lista.push({
          id: item.key ?? "",
          ...(item.val() as Omit<ProdutoBeauty, "id">),
        });
      });

      sucesso(lista.reverse());
    },
    (e) => erro?.(e)
  );
}

export async function criarProduto(
  dados: NovoProdutoBeauty
) {
  const novoRef = push(ref(db, BASE));

  await set(novoRef, {
    ...dados,
    criadoEm: Date.now(),
    atualizadoEm: Date.now(),
    servidor: serverTimestamp(),
  });
}

export async function atualizarProduto(
  id: string,
  dados: Partial<NovoProdutoBeauty>
) {
  await update(ref(db, `${BASE}/${id}`), {
    ...dados,
    atualizadoEm: Date.now(),
  });
}

export async function alterarStatusProduto(
  id: string,
  status: StatusProduto
) {
  await update(ref(db, `${BASE}/${id}`), {
    status,
    atualizadoEm: Date.now(),
  });
}
