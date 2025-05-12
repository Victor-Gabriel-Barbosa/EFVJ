# Configuração para resolver problemas de CORS no Firebase Storage

Este documento descreve como configurar corretamente as regras CORS para o Firebase Storage para permitir o upload de imagens da sua aplicação GitHub Pages.

## Passo 1: Instalar a CLI do Firebase

Se ainda não tiver instalado:

```bash
npm install -g firebase-tools
```

## Passo 2: Fazer login na sua conta do Firebase

```bash
firebase login
```

## Passo 3: Aplicar as regras CORS

O arquivo `cors.json` já foi criado no projeto. Para aplicar estas regras ao seu bucket do Firebase Storage, execute:

```bash
firebase storage:cors set cors.json --project eufacovcjoga
```

Substitua `eufacovcjoga` pelo ID do seu projeto Firebase, se necessário.

## Passo 4: Verificar se a configuração foi aplicada

Se ainda ocorrer erros CORS após aplicar essas configurações, verifique:

1. Se o ID do projeto está correto
2. Se você tem permissão para aplicar essas regras
3. Se a origem (github.io) está listada corretamente no arquivo cors.json

## Detalhes das configurações CORS

O arquivo cors.json permite:
- Acessos de domínios específicos (github.io e localhost para desenvolvimento)
- Métodos HTTP necessários (GET, PUT, POST, etc.)
- Headers necessários para o funcionamento correto do Firebase Storage
