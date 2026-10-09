---
slug: "sincronizar-estado-web-app-com-hash-na-url"
type: note
title: "Sincronizar estado entre dispositivos sem backend: hash na URL"
date: 2026-06-05
cover: "../../../assets/covers/notes/sincronizar-estado-web-app-com-hash-na-url.webp"
---

localStorage resolve persistência no mesmo navegador, mas não sincroniza celular com notebook. Para ferramentas client-only (planejadores, editores, cadernos), subir backend só para copiar JSON entre dispositivos é custo desproporcional. Serializar estado, comprimir, colocar no **hash** da URL e restaurar na abertura do link.

### Por que hash e não query string

A query (`?foo=bar`) vai na requisição HTTP. Proxies, logs de CDN e servidores antigos tratam ~2 KB como teto prático. O fragmento (`#...`) fica no cliente: o browser não envia o hash ao servidor. Browsers modernos aceitam dezenas de KB no fragmento.

| Parte | Vai ao servidor? | Uso típico |
|-------|------------------|------------|
| `?state=...` | Sim | Filtros, UTM, deep links server-side |
| `#state=...` | Não | Snapshot de estado client-only |

Para transferir estado entre dispositivos, o hash é o canal certo.

### Pipeline de encode

```text
estado da app → JSON → deflate → base64url → #state=<token>
```

Envolva o payload com metadados mínimos. Campo `v` evolui o formato; `app` impede abrir link de planejador no editor errado:

```json
{
  "v": 1,
  "app": "planejador-semanal",
  "data": {
    "plan": {
      "mon": [{ "id": "1", "title": "Reunião", "start": "09:00", "end": "10:00" }],
      "tue": []
    }
  }
}
```

```typescript
const jsonString = JSON.stringify(payload);
const compressed = new Blob([jsonString])
  .stream()
  .pipeThrough(new CompressionStream("deflate"));
const buffer = await new Response(compressed).arrayBuffer();

const token = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

const url = new URL(window.location.href);
url.hash = new URLSearchParams({ state: token }).toString();
```

deflate costuma reduzir JSON repetitivo em 60-80%. base64url evita caracteres que quebram ao colar em chat ou e-mail. O botão "Copiar link" só chama esse pipeline.

### Import na abertura da página

Quem recebe o link abre a mesma rota com `#state=...` no final. Na inicialização:

1. Ler `window.location.hash`
2. Extrair token, decodificar base64url, descomprimir, `JSON.parse`
3. Validar `v` e `app`
4. Gravar em localStorage (ou store da UI) e limpar hash com `history.replaceState`

Limpar o hash após importar evita reprocessar o mesmo estado a cada refresh.

### Sanitizar na entrada

Estado vindo de link é entrada externa. O mesmo código que valida localStorage deve rodar no import:

```typescript
function applyImportedState(raw: unknown) {
  const safe = normalizePlan(raw);
  savePlan(safe);
}
```

Campo ausente vira default; tipo errado descarta ou corrige; item inválido em lista filtra. Pular isso no import quebra a UI com link adulterado ou payload de versão antiga.

### Onde não usar

Transferência de snapshot, não sync em tempo real. Não substitui WebSocket, CRDT ou backend com merge.

Após compressão, ~64 KB na URL completa é teto prático; apps de mensagem truncam links maiores. Fotos em base64 dentro do JSON explodem o payload. CompressionStream exige browser recente. O estado fica visível para quem recebe o link: não coloque segredos.

Separe persistência local, serialização de link (encode/decode, limite, envelope) e UI (copiar link, detectar hash no mount). A camada de link transporta JSON; não precisa conhecer campos internos da app.

Copiar link no desktop e abrir no celular reproduz o estado sem conta, API ou arquivo `.json` intermediário.
