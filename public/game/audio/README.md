# Áudio do portfólio

A trilha atual é `Stardew-Valley-song.mp3`, configurada em `content/site.ts`:

```ts
soundtrackUrl: "/game/audio/Stardew-Valley-song.mp3",
```

Para trocar, adicione outro arquivo nesta pasta e altere esse caminho.
Uma string vazia desativa a trilha. Não é necessário configurar `.env.local`.

Os efeitos em `effects/` são carregados em
`components/portfolio/game/phaser-game.tsx`; o clique dos botões é controlado por
`components/portfolio/game/ui-sound-controller.tsx`.

As gravações fornecidas no projeto foram preservadas nesta entrega.
