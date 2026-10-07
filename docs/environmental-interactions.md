# Interações ambientais do exterior

As copas e a parte superior de grama, flores e arbustos reutilizam recortes do atlas atual. O movimento é de até 2 pixels, depende da proximidade dos pés e volta à posição original fora do alcance. Troncos e raízes ficam fixos; as duas partes usam a profundidade original. Terreno, posições, colisões, caminhos e interações foram preservados.

Peixes ambientais saltam a cada 2 segundos do relógio do mundo. Cada salto dura 680 ms no ar, seguido de respingos e uma ondulação que desaparece até 1280 ms. A seleção aleatória usa 20 pontos seguros derivados dos tiles, com direções, alturas, distâncias e três cores. O espaço de todo o arco e da ondulação exclui margem, píer, pedras, lírios e juncos. A animação não chama o controlador de pesca nem altera capturas.

Os postes têm pequenas quedas de brilho com longos intervalos estáveis. O brilho em pixels é rasterizado uma vez numa textura reutilizada nas trocas de cena. Os efeitos ambientais são atualizados a no máximo 20 quadros/s; copas, peixes, nuvens e luzes fora da câmera são ocultados. Movimento reduzido desativa esses movimentos e as variações de brilho, mantendo a iluminação de dia/noite. Mudanças da preferência do sistema são aplicadas durante o jogo.

O áudio do Phaser agora acompanha o botão de som e o volume existentes, com remoção da assinatura ao sair da cena. Os novos efeitos não acrescentam sons.

## Validação

Passaram lint, checagem de tipos, build de produção, check:world e check:house. Os testes verificam percursos, acesso às 16 interações, pesca/cancelamento/conquistas, cada pixel de arcos e ondulações, profundidade dos recortes, preferência de movimento em tempo real, ausência de redesenho do lago fora da câmera, reutilização da textura e limpeza das assinaturas de áudio.

As prévias de composição de dia/noite e sequências de quadros foram inspecionadas. Para regenerar as imagens e animações sem alterar os arquivos de referência:

```powershell
node scripts/render-world-life-preview.mjs work/environment --motion
```

Os arquivos lake-day.webp, lake-night.webp, foliage-day.webp e foliage-night.webp ficam em work/environment. A reação da vegetação termina na metade das prévias.

A conferência no jogo em movimento continua pendente: o navegador integrado estava indisponível e a conexão de Computer Use ao Windows falhou. É necessário conferir câmera/zoom, passagem visual pela frente e por trás das árvores, fluidez em celular real, reprodução de áudio e controles de pesca no desktop e no celular, de dia e à noite.

Branch preservada: feat/exterior-tile-rebuild. estado-atual-mapa.patch manteve o SHA-256 AA8511A8BE03D578DF9AE285F8601F02477CF86A2510C7A300D727342B9C08BA. Nenhum commit ou push foi feito.
